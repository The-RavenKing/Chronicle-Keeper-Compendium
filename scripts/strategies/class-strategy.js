import { BaseStrategy } from './base-strategy.js';

export class ClassStrategy extends BaseStrategy {
  constructor() {
    super();
    this.key = "class";
  }

  getPrompt(content) {
    return `Extract D&D 5e CLASS information.

Required JSON Structure:
{
  "name": "Class Name",
  "description": "Flavor text...",
  "hitDie": "d8",
  "savingThrows": ["dex", "int"],
  "skills": { "count": 2, "options": ["acr", "ste", "perc"] },
  "features": [
    { "name": "Feature Name", "description": "...", "level": 1 }
  ]
}

RULES:
1. ONLY extract features EXPLICITLY found in the text. Do NOT add example features like Sneak Attack unless they are in the text.
2. Hit Die should be d6, d8, d10, or d12.
3. Saving throws abbreviated (str, dex, con...).

SOURCE TEXT:
${content}`;
  }

  validate(data) {
    if (!data.name) throw new Error("Missing Class Name");
    if (!data.hitDie) data.hitDie = "d8";
    if (!data.features) data.features = [];
    return data;
  }

  async create(data) {
    // FIX: Route to correct compendiums
    const classPack = game.packs.get("world.chronicle-keeper-classes");
    const featurePack = game.packs.get("world.chronicle-keeper-features");

    if (!classPack || !featurePack) throw new Error("Compendiums not found.");

    // 1. Create Features
    const featureMap = new Map();
    for (const feature of data.features) {
      const featData = {
        name: feature.name,
        type: 'feat',
        img: 'icons/svg/book.svg',
        system: {
          description: { value: `<p>${feature.description}</p>` },
          source: { custom: `${data.name} Feature` },
          type: { value: 'class', subtype: '' },
          requirements: `${data.name} ${feature.level}`
        }
      };
      const created = await featurePack.documentClass.create(featData, { pack: featurePack.collection });
      featureMap.set(feature.name, { uuid: created.uuid, level: feature.level });
    }

    // 2. Build Advancement
    const advancements = [];
    const featuresByLevel = {};
    featureMap.forEach((val) => {
        if (!featuresByLevel[val.level]) featuresByLevel[val.level] = [];
        featuresByLevel[val.level].push(val.uuid);
    });

    for (const [level, uuids] of Object.entries(featuresByLevel)) {
        advancements.push({
            _id: foundry.utils.randomID(),
            type: 'ItemGrant',
            configuration: { items: uuids },
            level: parseInt(level),
            title: 'Class Features'
        });
    }

    // Hit Points
    advancements.push({
        _id: foundry.utils.randomID(),
        type: 'HitPoints',
        configuration: { denomination: parseInt(data.hitDie.replace('d', '')) },
        title: 'Hit Points'
    });

    // Saves
    if (data.savingThrows?.length > 0) {
        advancements.push({
            _id: foundry.utils.randomID(),
            type: 'Trait',
            configuration: { mode: 'default', grants: data.savingThrows.map(s => `saves:${s}`) },
            title: 'Saving Throws'
        });
    }

    // Skills
    if (data.skills?.count > 0) {
        advancements.push({
            _id: foundry.utils.randomID(),
            type: 'Trait',
            configuration: {
                mode: 'default',
                choices: [{ count: data.skills.count, pool: data.skills.options.map(s => `skills:${s}`) }]
            },
            title: 'Skills'
        });
    }

    // 3. Create Class Item
    const itemData = {
      name: data.name,
      type: 'class',
      img: 'icons/svg/mystery-man.svg',
      system: {
        description: { value: `<p>${data.description}</p>` },
        identifier: data.name.toLowerCase().replace(/\s+/g, '-'),
        hitDice: data.hitDie,
        advancement: advancements
      }
    };

    await classPack.documentClass.create(itemData, { pack: classPack.collection });
    ui.notifications.info(`Created Class: ${data.name}`);
  }
}