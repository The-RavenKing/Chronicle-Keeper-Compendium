import { BaseStrategy } from './base-strategy.js';

export class SubclassStrategy extends BaseStrategy {
  constructor() {
    super();
    this.key = "subclass";
  }

  getPrompt(content) {
    let cleanContent = content;
    try {
      const sourceTagRegex = new RegExp("\\[.*?\\]", "g");
      cleanContent = cleanContent.replace(sourceTagRegex, "");
      cleanContent = cleanContent.split("\r\n").join("\n");
      const multiNewlineRegex = new RegExp("\\n{3,}", "g");
      cleanContent = cleanContent.replace(multiNewlineRegex, "\n\n");
    } catch (e) {
      console.warn("Chronicle Keeper | Text cleaning warning:", e);
    }

    return `You are a strict data extraction engine.
    
    TASK: Extract the Subclass Metadata from the SOURCE TEXT. 
    We are mapping which features appear at which levels.

    *** SCHEMA ***
    {
      "name": "The Subclass/Archetype Name (e.g. 'The Faceless One')",
      "baseClass": "The core class (e.g. 'Warlock')",
      "description": "Intro paragraphs only (flavor text)",
      "features": [
        { "name": "Feature Name", "level": 3 }
      ]
    }

    *** CRITICAL RULES ***
    1. **SUBCLASS NAME:** Use only the name of the archetype. Do NOT include the class name (e.g. Use 'The Faceless One', NOT 'The Faceless One Warlock').
    2. **SPELL LISTS:** ALWAYS include the "Expanded Spell List" or "Subclass Spells" (e.g. 'Facelessone Archfey Spells'). 
    3. **EXHAUSTIVE EXTRACTION:** You MUST extract EVERY feature mentioned. This includes "Ethereal Techniques" or other bottom-of-page supplemental features.
    4. **LEVELS:** Pay close attention to level indicators like "(3rd Level)" or "Level 6:".
    5. **NO CONTENT:** Do NOT extract feature descriptions. Only Name and Level.

    *** ONE-SHOT EXAMPLE ***
    Input:
    "Base Class: Warlock
     The Magma Soul
     The Magma Soul is a patron...
     
     Expanded Spell List
     Warlock Level Spells
     1st magma bomb
     
     Burning Soul (3rd level)
     You gain...
     
     Level 6: Magma Mastery
     
     Ethereal Arts:
     Flowing Lava (Available at 6th level)"

    Correct Output:
    {
      "name": "The Magma Soul",
      "baseClass": "Warlock",
      "description": "<p>The Magma Soul is a patron...</p>",
      "features": [
        { "name": "Expanded Spell List", "level": 1 },
        { "name": "Burning Soul", "level": 3 },
        { "name": "Magma Mastery", "level": 6 },
        { "name": "Flowing Lava", "level": 6 }
      ]
    }
    *** END EXAMPLE ***

    SOURCE TEXT:
    ${cleanContent}`;
  }

  /**
   * Post-process incoming data to handle model hallucinations
   */
  normalizeData(data) {
    if (data.levels && !data.features) {
      data.features = [];
      for (const entry of data.levels) {
        if (entry.features && Array.isArray(entry.features)) {
          for (const feat of entry.features) {
            if (typeof feat === 'string') {
              data.features.push({ name: feat, level: entry.level || 1 });
            } else if (typeof feat === 'object') {
              data.features.push({ ...feat, level: entry.level || feat.level || 1 });
            }
          }
        }
      }
      delete data.levels;
    }

    if (!data.features) data.features = [];

    data.features = data.features.map(f => {
      if (typeof f === 'string') return { name: f, level: 1 };
      return f;
    });

    return data;
  }

  _cleanSubclassName(name, baseClass) {
    if (!name || typeof name !== 'string') return "Unknown Subclass";

    // Remove "Level X:" prefixes
    let clean = name.replace(/^Level \d+:\s*/i, "").trim();

    // Remove Class suffixes (e.g. "Faceless One Warlock" -> "Faceless One")
    if (baseClass) {
      const classRegex = new RegExp(`\\s+${baseClass}$`, 'i');
      clean = clean.replace(classRegex, "").trim();
    }

    return clean || "Unknown Subclass";
  }

  async create(data) {
    console.log("Chronicle Keeper | Subclass Data Received:", data);
    data = this.normalizeData(data);

    data.baseClass = data.baseClass || "Warlock";
    data.name = this._cleanSubclassName(data.name, data.baseClass);

    console.log(`Chronicle Keeper | Aggregating: ${data.name} (${data.baseClass})`);

    const subclassPack = game.packs.get("world.chronicle-keeper-subclasses");
    const featurePack = game.packs.get("world.chronicle-keeper-features");

    if (!subclassPack || !featurePack) {
      ui.notifications.error("Missing compendiums! Please re-initialize module.");
      return;
    }

    const subclassFolderId = await this.getOrCreateFolder(subclassPack, data.baseClass);
    const existingFeatures = featurePack.index || await featurePack.getIndex();

    const featureUuidsByLevel = {};

    for (const feat of data.features) {
      const lvl = parseInt(feat.level) || 1;
      if (!featureUuidsByLevel[lvl]) featureUuidsByLevel[lvl] = [];

      // --- FEATURE MATCHING ---
      let existing = null;

      // 1. EXACT MATCH
      existing = existingFeatures.find(i => i.name.toLowerCase() === feat.name.toLowerCase());

      // 2. SPELL LIST SPECIAL HANDLING
      if (!existing && (feat.name.toLowerCase().includes("spells") || feat.name.toLowerCase().includes("spell list"))) {
        console.log(`Chronicle Keeper | Feature '${feat.name}' looks like a spell list. Searching...`);
        existing = existingFeatures.find(i => {
          const packName = i.name.toLowerCase();
          const cleanSubName = data.name.toLowerCase().replace(/[^a-z0-9]/g, "");
          return packName.includes("spells") && (packName.includes(cleanSubName) || packName.includes("archfey") || packName.includes(feat.name.toLowerCase().replace("spells", "").trim()));
        });
      }

      // 3. FUZZY MATCH (Alphanumeric only)
      if (!existing) {
        existing = existingFeatures.find(i => {
          const lowPack = i.name.toLowerCase().replace(/[^a-z0-9]/g, "");
          const lowFeat = feat.name.toLowerCase().replace(/[^a-z0-9]/g, "");
          return lowPack.includes(lowFeat) || lowFeat.includes(lowPack);
        });
      }

      if (existing) {
        console.log(`Chronicle Keeper | Linked existing Feature: ${feat.name} -> ${existing.name} (${existing.uuid})`);
        featureUuidsByLevel[lvl].push(existing.uuid);
      } else {
        console.warn(`Chronicle Keeper | Could not find existing Feature for '${feat.name}'. Skipping.`);
      }
    }

    // 3. Build Advancement
    const advancement = [];
    for (const [level, uuids] of Object.entries(featureUuidsByLevel)) {
      if (uuids.length === 0) continue;
      advancement.push({
        _id: foundry.utils.randomID(),
        type: 'ItemGrant',
        configuration: { items: uuids },
        level: parseInt(level),
        title: 'Subclass Features'
      });
    }

    // 4. Create Subclass
    let subDesc = data.description || "";
    if (subDesc && !subDesc.startsWith('<')) {
      subDesc = `<p>${subDesc.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br>')}</p>`;
    }

    const subItem = {
      name: data.name,
      type: 'subclass',
      img: 'icons/svg/mystery-man.svg',
      folder: subclassFolderId,
      system: {
        description: { value: subDesc },
        identifier: data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
        classIdentifier: data.baseClass?.toLowerCase().replace(/\s+/g, '-') || 'warlock',
        advancement: advancement
      }
    };

    await subclassPack.documentClass.create(subItem, { pack: subclassPack.collection });
    ui.notifications.info(`Assembled Subclass: ${data.name}`);
  }
}