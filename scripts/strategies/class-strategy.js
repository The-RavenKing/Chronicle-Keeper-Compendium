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
      "name": "Feature Name",
      "description": "Beginning at 1st level...",
      "level": 1
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
    // 1. Define Target Packs
    const classPack = game.packs.get("world.chronicle-keeper-classes");
    const featurePack = game.packs.get("world.chronicle-keeper-features");

    // Fallback if packs don't exist
    if (!classPack || !featurePack) {
        throw new Error("Required compendiums not found. Please re-initialize module.");
    }

    // 2. Create Features in the FEATURES pack
    const featureMap = new Map(); 
    
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
      
      const created = await featurePack.documentClass.create(featData, { pack: featurePack.collection });
      featureMap.set(feature.name, { uuid: created.uuid, level: feature.level });
    }

    // 3. Build Advancement
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

    // Add Hit Points
    advancements.push({
        _id: foundry.utils.randomID(),
        type: 'HitPoints',
        configuration: { denomination: parseInt(data.hitDie.replace('d', '')) },
        title: 'Hit Points'
    });

    // Add Saves
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

    // Add Skills
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

    // 4. Create Class Item in the CLASSES pack
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
    ui.notifications.info(`Created Class: ${data.name} with ${data.features.length} features!`);
  }
}