import { BaseStrategy } from './base-strategy.js';

export class SubclassStrategy extends BaseStrategy {
  constructor() {
    super();
    this.key = "subclass";
  }

  getPrompt(content) {
    // 1. CLEAN THE TEXT
    let cleanContent = content;

    try {
      // 1. CLEAN THE TEXT
      // Matches: [Source] or [PHB]
      const sourceTagRegex = new RegExp("\\[.*?\\]", "g"); // FIXED: non-greedy match for brackets
      cleanContent = cleanContent.replace(sourceTagRegex, "");

      // Standardize newlines
      cleanContent = cleanContent.split("\r\n").join("\n");

      // Reduce multiple newlines
      const multiNewlineRegex = new RegExp("\\n{3,}", "g");
      cleanContent = cleanContent.replace(multiNewlineRegex, "\n\n");

    } catch (e) {
      console.warn("Chronicle Keeper | Text cleaning warning:", e);
    }

    return `You are a strict data extraction engine.

    TASK: Extract D&D 5e SUBCLASS data from the text below.

    *** CRITICAL RULES ***
    1. **EXTRACT VERBATIM:** Do NOT summarize. Copy the text EXACTLY as it appears.
    2. **INCLUDE ALL PARAGRAPHS:** Features often have multiple sections (e.g. "Additionally...", "Once you use..."). Extract EVERYTHING.
    3. **MECHANICS:** Extract Action Type, Range, Target, Saving Throws, and Damage from ANY part of the text.
    4. **HANDLE DUPLICATES:** The text may contain a summary list (e.g. "Level 3: Feature Name") AND a detailed section. **IGNORE THE SUMMARY LIST.** Only extract the **DETAILED** section with the full text.
    5. **HTML FORMAT:** Wrap paragraphs in <p> tags. Use <ul>/<li> for lists.
    6. **NO SPLITTING SUB-OPTIONS:** If a feature lists choices (e.g. "Choose one:", "Options:", or bullet points), KEEP them in the Description. Do **NOT** create separate features for them.
    7. **NAME ACCURACY:** Use the EXACT name found in the header. Do NOT use terms found inside the description (e.g. if header is "Master of None", do NOT call it "False Identity").
    8. **SPELLS:** If you see "Expanded Spell List", extract it as a "spells" array.
    9. **NAME DETECTION:** If the name is not labeled "Name:", look at the first paragraph (e.g. "The Faceless One is..." -> Name: "The Faceless One").
    10. **HEADER FORMATS:** Recognize BOTH "Feature Name (Level X)" AND "Level X: Feature Name".

    *** ONE-SHOT EXAMPLE ***
    Input Text:
    "Level 3: Magma Mastery. As an action, you create a sphere of magma in a 15-foot cone. Each creature in that area must make a Dexterity saving throw. On a failed save, the creature takes 3d6 fire damage.
    
    Additionally, you choose one of the following benefits:
    * Searing Skin: You deal 1d4 fire damage to creatures that touch you.
    * Molten Core: You gain resistance to cold damage.
    
    Once you use this feature, you cannot use it again until you finish a short or long rest."
    
    Correct Output (JSON):
    {
      "features": [
        {
          "name": "Magma Mastery",
          "description": "<p>As an action, you create a sphere of magma in a 15-foot cone. Each creature in that area must make a Dexterity saving throw. On a failed save, the creature takes 3d6 fire damage.</p><p>Additionally, you choose one of the following benefits:</p><ul><li><strong>Searing Skin:</strong> You deal 1d4 fire damage to creatures that touch you.</li><li><strong>Molten Core:</strong> You gain resistance to cold damage.</li></ul><p>Once you use this feature, you cannot use it again until you finish a short or long rest.</p>",
          "level": 3,
          "activation": { "type": "action", "cost": 1 },
          "range": { "value": 15, "units": "ft" },
          "target": { "value": 15, "units": "ft", "type": "cone" },
          "save": { "ability": "dex", "scaling": "spell" },
          "uses": { "value": 1, "max": "1", "per": "sr" }
        }
      ]
    }
    *** END EXAMPLE ***

    Required JSON Structure:
    {
      "name": "Subclass Name",
      "baseClass": "Base Class",
      "description": "Flavor text",
      "features": [
        { 
          "name": "Feature Name", 
          "description": "FULL HTML CONTENT", 
          "level": 3,
          "activation": { "type": "action", "cost": 1 },
          "range": { "value": null, "units": "ft" },
          "target": { "value": null, "units": "ft", "type": "" },
          "save": { "ability": "", "scaling": "spell" },
          "uses": { "value": null, "max": "", "per": "" }
        }
      ],
      "spells": [ { "name": "Spell Name", "level": 1 } ]
    }

    SOURCE TEXT:
    ${cleanContent}`;
  }

  async create(data) {
    // --- SAFETY CHECKS ---
    data.name = data.name || "Unknown Subclass";
    data.baseClass = data.baseClass || "Warlock";

    // --- DEBUGGING ---
    console.log("Chronicle Keeper | -------------------------------------------");
    console.log(`Chronicle Keeper | Processing: ${data.name} (${data.baseClass})`);
    console.log(`Chronicle Keeper | Features Found (Raw): ${data.features?.length || 0}`);

    const subclassPack = game.packs.get("world.chronicle-keeper-subclasses");
    const featurePack = game.packs.get("world.chronicle-keeper-features");

    if (!subclassPack || !featurePack) {
      ui.notifications.error("Missing compendiums! Please re-initialize module.");
      return;
    }

    // 1. Folder Management
    let folderId = null;
    if (data.baseClass) {
      // Normalize base class name for case-insensitive search
      const baseClassName = data.baseClass.trim();

      // Use .contents if available, or just .folders (it's a Collection)
      const folders = subclassPack.folders;

      const existingFolder = folders.find(f => f.name.toLowerCase() === baseClassName.toLowerCase());

      if (existingFolder) {
        folderId = existingFolder.id;
        console.log(`Chronicle Keeper | Using existing folder: ${existingFolder.name} (${folderId})`);
      } else {
        console.log(`Chronicle Keeper | Creating new folder: ${baseClassName}`);

        try {
          const newFolder = await Folder.create({
            name: baseClassName, // Use trimmed name
            type: "Item",
            sorting: "a",
            pack: subclassPack.collection // IMPORTANT: This ensures it lives INSIDE the compendium
          });
          console.log("Chronicle Keeper | New Folder Created:", newFolder);
          folderId = newFolder.id;
        } catch (err) {
          console.error("Chronicle Keeper | Folder creation failed:", err);
          ui.notifications.error("Failed to create class folder. Placing item at root.");
        }
      }
    }

    // 2. Create Features (with De-duplication and Linking)
    const featureUuids = {};
    const uniqueFeatures = {};
    const existingFeatures = featurePack.index || await featurePack.getIndex(); // Ensure index is loaded

    // Filter duplicates: Keep the one with the LONGER description
    if (data.features) {
      for (const feat of data.features) {
        const keys = [feat.name];
        // Normalize name slightly to catch "Feature Name" vs "Feature Name (Level 3)"
        // But usually the name extracted is clean. 
        // If duplicate names exist:
        if (!uniqueFeatures[feat.name]) {
          uniqueFeatures[feat.name] = feat;
        } else {
          // If existing description is shorter than new one, overwrite
          const oldDescLen = uniqueFeatures[feat.name].description?.length || 0;
          const newDescLen = feat.description?.length || 0;
          if (newDescLen > oldDescLen) {
            console.log(`Chronicle Keeper | Updating duplicate feature '${feat.name}' with longer description.`);
            uniqueFeatures[feat.name] = feat;
          }
        }
      }
    }

    // Sort features
    const sortedFeatures = Object.values(uniqueFeatures).sort((a, b) => a.level - b.level);

    // --- NEW: Handle Expanded Spell List ---
    if (data.spells && data.spells.length > 0) {
      console.log("Chronicle Keeper | Generating Expanded Spell List feature...");
      let spellTable = "<h3>Expanded Spell List</h3><table border='1'><thead><tr><th>Spell Level</th><th>Spells</th></tr></thead><tbody>";

      // Group spells by level
      const spellsByLevel = {};
      for (const spell of data.spells) {
        const lvl = spell.level || 1;
        if (!spellsByLevel[lvl]) spellsByLevel[lvl] = [];
        spellsByLevel[lvl].push(spell.name);
      }

      // Sort levels
      const levels = Object.keys(spellsByLevel).sort((a, b) => a - b);
      for (const limit of levels) {
        spellTable += `<tr><td>${limit}</td><td>${spellsByLevel[limit].join(", ")}</td></tr>`;
      }
      spellTable += "</tbody></table>";

      // Add as a pseudo-feature
      sortedFeatures.unshift({
        name: "Expanded Spell List",
        description: spellTable,
        level: 1 // Usually level 1 or 3, 1 is safe for warlock/cleric usually
      });
    }

    // Process loop
    for (const feat of sortedFeatures) {
      const lvlKey = String(feat.level);
      if (!featureUuids[lvlKey]) featureUuids[lvlKey] = [];

      // 1. LOOKUP EXISTING FEATURE
      // Fuzzy search? Exact name match is best for now given "One-Shot" should return clean names.
      const existing = existingFeatures.find(i => i.name === feat.name);

      if (existing) {
        console.log(`Chronicle Keeper | Linked existing Feature: ${feat.name} (${existing.uuid})`);
        featureUuids[lvlKey].push(existing.uuid);
        continue; // Skip creation
      }

      // 2. CREATE NEW FEATURE (Fallback)
      let cleanDesc = feat.description || "";
      if (!cleanDesc.trim().startsWith('<')) {
        cleanDesc = `<p>${cleanDesc.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br>')}</p>`;
      }

      // Map Activation
      const activation = {
        type: feat.activation?.type || "",
        cost: feat.activation?.cost || 1,
        condition: ""
      };

      // Map Range
      const range = {
        value: feat.range?.value || null,
        units: feat.range?.units || ""
      };

      // Map Target
      const target = {
        value: feat.target?.value || null,
        units: feat.target?.units || "",
        type: feat.target?.type || ""
      };

      // Map Save
      const save = {
        ability: feat.save?.ability || "",
        dc: null,
        scaling: feat.save?.scaling || "spell" // Default to spell
      };

      // Map Uses
      const uses = {
        value: feat.uses?.value || null,
        max: feat.uses?.max || "",
        per: feat.uses?.per || ""
      };

      const featItem = {
        name: feat.name,
        type: 'feat',
        img: 'icons/svg/book.svg',
        system: {
          description: { value: cleanDesc },
          source: { custom: `${data.name} (${data.baseClass})` },
          type: { value: 'class', subtype: '' },
          requirements: `${data.baseClass} ${feat.level}`,
          activation: activation,
          range: range,
          target: target,
          save: save,
          uses: uses,
          actionType: save.ability ? "save" : (target.type ? "other" : "")
        }
      };

      // --- ACTIVITY GENERATION (Modern 5e) ---
      featItem.system.activities = {};
      const activityId = foundry.utils.randomID();

      const cleanActivation = (act) => {
        const out = {};
        if (act.type) out.type = act.type;
        if (act.cost) out.cost = act.cost;
        if (act.condition) out.condition = act.condition;
        return out;
      };

      const cleanRange = (rng) => {
        if (!rng.value && !rng.units) return {};
        return { value: rng.value, units: rng.units };
      };

      const cleanTarget = (tgt) => {
        if (!tgt.value && !tgt.units && !tgt.type) return {};

        const templateShapes = ["circle", "cone", "cube", "cylinder", "line", "sphere", "square", "wall", "radius"];
        let rawType = tgt.type ? tgt.type.toLowerCase().trim() : "";

        // Check if type matches a template shape
        if (templateShapes.some(s => rawType.includes(s))) {
          const shape = templateShapes.find(s => rawType.includes(s)) || rawType;
          return {
            template: {
              type: shape,
              size: tgt.value,
              units: tgt.units
            }
          };
        } else {
          // Otherwise assume it affects creatures
          return {
            affects: {
              type: rawType || "creature",
              count: tgt.value || ""
            }
          };
        }
      };

      // 1. Save Activity
      if (save.ability) {
        featItem.system.activities[activityId] = {
          type: "save",
          _id: activityId,
          name: feat.name,
          activation: cleanActivation(activation),
          range: cleanRange(range),
          target: cleanTarget(target),
          save: {
            ability: [save.ability],
            dc: { calculation: "spell", formula: "" }
          },
          damage: { parts: feat.damage?.map(d => ({ custom: { enabled: false }, number: null, denomination: null, bonus: "", types: [d.type], scaling: "number", formula: d.formula })) || [] }
        };
      }
      // 2. Damage/Attack Activity (if damage but no save)
      else if (feat.damage && feat.damage.length > 0) {
        featItem.system.activities[activityId] = {
          type: "damage",
          _id: activityId,
          name: feat.name,
          activation: cleanActivation(activation),
          range: cleanRange(range),
          target: cleanTarget(target),
          damage: { parts: feat.damage.map(d => ({ custom: { enabled: false }, number: null, denomination: null, bonus: "", types: [d.type], scaling: "number", formula: d.formula })) }
        };
      }
      // 3. Utility Activity (if activation exists but no save/damage)
      else if (activation.type) {
        featItem.system.activities[activityId] = {
          type: "utility",
          _id: activityId,
          name: feat.name,
          activation: cleanActivation(activation),
          range: cleanRange(range),
          target: cleanTarget(target),
          roll: { prompt: false, visible: false }
        };
      }

      // --- ACTIVE EFFECTS GENERATION ---
      const conditions = ["Charmed", "Frightened", "Paralyzed", "Restrained", "Invisible", "Prone", "Stunned", "Poisoned", "Grappled"];
      const effects = [];

      for (const condition of conditions) {
        const regex = new RegExp(`\\b${condition}\\b`, "i");
        if (regex.test(cleanDesc)) {
          effects.push({
            name: condition,
            icon: `icons/svg/aura.svg`,
            transfer: false,
            statuses: [condition.toLowerCase()],
            description: `Applies ${condition} condition.`
          });
        }
      }
      featItem.effects = effects;

      const created = await featurePack.documentClass.create(featItem, { pack: featurePack.collection });
      featureUuids[lvlKey].push(created.uuid);

      console.log(`   - Created Feature: [Lvl ${feat.level}] ${feat.name}`);
    }

    // 3. Build Advancement
    const advancement = [];
    for (const [level, uuids] of Object.entries(featureUuids)) {
      advancement.push({
        _id: foundry.utils.randomID(),
        type: 'ItemGrant',
        configuration: { items: uuids },
        level: parseInt(level),
        title: 'Subclass Features'
      });
    }

    // 4. Create Subclass Item
    let subDesc = data.description || "";
    if (!subDesc.trim().startsWith('<')) {
      subDesc = `<p>${subDesc.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br>')}</p>`;
    }

    const subItem = {
      name: data.name,
      type: 'subclass',
      img: 'icons/svg/mystery-man.svg',
      folder: folderId,
      system: {
        description: { value: subDesc },
        identifier: data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
        classIdentifier: data.baseClass?.toLowerCase().replace(/\s+/g, '-') || 'warlock',
        advancement: advancement
      }
    };

    await subclassPack.documentClass.create(subItem, { pack: subclassPack.collection });

    // FORCE UI REFRESH - This ensures the folder appears immediately
    if (subclassPack.apps.length > 0) {
      subclassPack.apps.forEach(app => app.render(true));
    }

    ui.notifications.info(`Created Subclass: ${data.name} in folder ${data.baseClass}`);
  }
}