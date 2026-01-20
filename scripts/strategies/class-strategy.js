import { BaseStrategy } from './base-strategy.js';

export class ClassStrategy extends BaseStrategy {
  constructor() {
    super();
    this.key = "class";
  }

  getPrompt(content) {
    return `Extract D&D 5e CLASS information from the text below.

Required JSON Structure:
{
  "name": "Class Name",
  "description": "Class flavor text",
  "hitDie": "d8",
  "savingThrows": ["dex", "int"],
  "skills": {
    "count": 2,
    "options": ["acr", "ste", "perc"]
  },
  "features": [
    {
      "name": "Sneak Attack",
      "description": "Beginning at 1st level...",
      "level": 1
    },
    {
      "name": "Cunning Action",
      "description": "Starting at 2nd level...",
      "level": 2
    }
  ]
}

RULES:
1. Extract ALL class features mentioned in the text with their level.
2. Hit Die should be d6, d8, d10, or d12.
3. Saving throws should be abbreviated (str, dex, con, int, wis, cha).
4. Skill codes: acr, ani, arc, ath, dec, his, ins, itm, inv, med, nat, prc, prf, per, rel, slt, ste, sur.

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
    const packId = game.settings.get('chronicle-keeper-compendium', 'targetCompendium');
    const pack = game.packs.get(packId);
    if (!pack) throw new Error("Target compendium not found");

    // 1. Create Feature Items first
    const featureMap = new Map(); // Name -> UUID
    
    for (const feature of data.features) {
      const featData = {
        name: feature.name,
        type: 'feat',
        img: 'icons/svg/book.svg',
        system: {
          description: { value: `<p>${feature.description}</p>` },
          source: { custom: `${data.name} Class Feature` },
          type: { value: 'class', subtype: '' },
          requirements: `${data.name} ${feature.level}`
        }
      };
      
      const created = await pack.documentClass.create(featData, { pack: pack.collection });
      featureMap.set(feature.name, { uuid: created.uuid, level: feature.level });
    }

    // 2. Build Advancement for Features
    const advancements = [];
    
    // Group features by level
    const featuresByLevel = {};
    featureMap.forEach((val, name) => {
      if (!featuresByLevel[val.level]) featuresByLevel[val.level] = [];
      featuresByLevel[val.level].push(val.uuid);
    });

    // Create Grant advancements for each level
    for (const [level, uuids] of Object.entries(featuresByLevel)) {
      advancements.push({
        _id: foundry.utils.randomID(),
        type: 'ItemGrant',
        configuration: { items: uuids },
        level: parseInt(level),
        title: 'Class Features'
      });
    }

    // Add Hit Points advancement
    advancements.push({
      _id: foundry.utils.randomID(),
      type: 'HitPoints',
      configuration: { denomination: parseInt(data.hitDie.replace('d', '')) },
      title: 'Hit Points'
    });

    // Add Saving Throws advancement
    if (data.savingThrows && data.savingThrows.length > 0) {
      advancements.push({
        _id: foundry.utils.randomID(),
        type: 'Trait',
        configuration: { 
          mode: 'default', 
          grants: data.savingThrows.map(s => `saves:${s}`) 
        },
        title: 'Saving Throws'
      });
    }

    // Add Skill Choices
    if (data.skills && data.skills.count > 0) {
      advancements.push({
        _id: foundry.utils.randomID(),
        type: 'Trait',
        configuration: {
          mode: 'default',
          allowReplacements: false,
          choices: [{
            count: data.skills.count,
            pool: data.skills.options.map(s => `skills:${s}`)
          }]
        },
        title: 'Skills',
        hint: `Choose ${data.skills.count} skills`
      });
    }

    // 3. Create the Main Class Item
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

    await pack.documentClass.create(itemData, { pack: pack.collection });
    ui.notifications.info(`Created Class: ${data.name} with ${data.features.length} features!`);
  }
}