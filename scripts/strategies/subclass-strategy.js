import { BaseStrategy } from './base-strategy.js';

export class SubclassStrategy extends BaseStrategy {
  constructor() {
    super();
    this.key = "subclass";
  }

  getPrompt(content) {
    return `Extract D&D 5e SUBCLASS information.

Required JSON Structure:
{
  "name": "Life Domain",
  "baseClass": "Cleric",
  "description": "Flavor text...",
  "features": [
    { "name": "Disciple of Life", "description": "...", "level": 1 },
    { "name": "Channel Divinity", "description": "...", "level": 2 }
  ],
  "spells": [
    { "name": "Bless", "level": 1 },
    { "name": "Cure Wounds", "level": 1 }
  ]
}

RULES:
1. ONLY extract features found in the source text. Do NOT invent features.
2. If the text lists an "Expanded Spell List", include those in "spells".
3. Extract the "Base Class" name if present (e.g. Warlock, Cleric).

SOURCE TEXT:
${content}`;
  }

  async create(data) {
    const subclassPack = game.packs.get("world.chronicle-keeper-subclasses");
    const featurePack = game.packs.get("world.chronicle-keeper-features");

    // Fallback logic if packs are missing
    if (!subclassPack || !featurePack) {
        ui.notifications.error("Missing compendiums! Please re-initialize module.");
        return;
    }

    // 1. Create Features
    const featureUuids = {}; // Level -> [UUIDs]
    
    for (const feat of data.features || []) {
      const featItem = {
        name: feat.name,
        type: 'feat',
        img: 'icons/svg/book.svg',
        system: {
          description: { value: `<p>${feat.description}</p>` },
          source: { custom: `${data.name} (${data.baseClass})` },
          type: { value: 'class', subtype: '' },
          requirements: `${data.baseClass} ${feat.level}`
        }
      };
      const created = await featurePack.documentClass.create(featItem, { pack: featurePack.collection });
      
      if (!featureUuids[feat.level]) featureUuids[feat.level] = [];
      featureUuids[feat.level].push(created.uuid);
    }

    // 2. Build Advancement (Grant Features)
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

    // 3. Create Subclass Item
    const subItem = {
      name: data.name,
      type: 'subclass',
      img: 'icons/svg/mystery-man.svg',
      system: {
        description: { value: `<p>${data.description}</p>` },
        identifier: data.name.toLowerCase().replace(/\s+/g, '-'),
        classIdentifier: data.baseClass?.toLowerCase().replace(/\s+/g, '-') || '',
        advancement: advancement
      }
    };

    await subclassPack.documentClass.create(subItem, { pack: subclassPack.collection });
    ui.notifications.info(`Created Subclass: ${data.name} for ${data.baseClass}`);
  }
}