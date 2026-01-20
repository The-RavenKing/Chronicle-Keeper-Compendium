import { BaseStrategy } from './base-strategy.js';

export class SubclassStrategy extends BaseStrategy {
  constructor() {
    super();
    this.key = "subclass";
  }

  getPrompt(content) {
    return `Extract SUBCLASS information from the text below.

Required JSON Structure:
{
  "name": "Name of the Subclass",
  "baseClass": "Name of the Base Class",
  "description": "The flavor text description...",
  "features": [
    { "name": "Name of Feature", "description": "Full text of feature...", "level": 1 },
    { "name": "Another Feature", "description": "...", "level": 6 }
  ],
  "spells": [
    { "name": "Spell Name", "level": 1 }
  ]
}

RULES:
1. Extract the ACTUAL names from the text.
2. If the text lists an "Expanded Spell List", include those in "spells".
3. Extract features with their specific levels (3rd Level, 6th Level, etc).

SOURCE TEXT:
${content}`;
  }

  async create(data) {
    const subclassPack = game.packs.get("world.chronicle-keeper-subclasses");
    const featurePack = game.packs.get("world.chronicle-keeper-features");

    if (!subclassPack || !featurePack) {
        ui.notifications.error("Missing compendiums! Please re-initialize module.");
        return;
    }

    // 1. Create Features
    const featureUuids = {}; 
    
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

    // 2. Build Advancement
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
        classIdentifier: data.baseClass?.toLowerCase().replace(/\s+/g, '-') || 'warlock',
        advancement: advancement
      }
    };

    await subclassPack.documentClass.create(subItem, { pack: subclassPack.collection });
    ui.notifications.info(`Created Subclass: ${data.name} for ${data.baseClass}`);
  }
}