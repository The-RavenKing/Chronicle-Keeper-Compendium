import { BaseStrategy } from './base-strategy.js';

export class SpeciesStrategy extends BaseStrategy {
  constructor() {
    super();
    this.key = "species";
  }

  getPrompt(content) {
    return `Extract species information from the text below and return strictly valid JSON.

Required JSON Structure:
{
  "name": "Race Name",
  "description": "Flavor text...",
  "creatureType": "Humanoid", 
  "size": { "value": "med", "options": ["sm", "med"] },
  "movement": { "walk": 30, "climb": 0, "fly": 0, "swim": 0 },
  "senses": { "darkvision": 0, "blindsight": 0 },
  "abilityScoreIncrease": {
    "type": "flexible",
    "options": { "increases": 3, "pool": [1, 1, 1] }
  },
  "traits": [
    {
      "name": "Trait Name",
      "description": "Full description of the trait.",
      "isAttack": false
    }
  ],
  "languages": { "value": ["common"], "custom": "one choice" },
  "proficiencies": { 
    "skills": [], 
    "skillCount": 0,
    "traitName": ""
  }
}

RULES:
1. EXTRACT EVERY BOLDED HEADER AS A TRAIT. Do not skip "Expert Duplication" or "Mimicry".
2. "isAttack": true ONLY if it is a natural weapon (bite, claw).
3. SKILLS: If text says "choose two skills" or "proficiency in two skills":
   - Set "skillCount": 2.
   - Set "traitName": "Name of the trait" (e.g. Kenku Recall).
   - Leave "skills": [] empty.

SOURCE TEXT:
${content}`;
  }

  validate(data) {
    if (!data.name) throw new Error('Missing race name');
    
    // SAFETY NET: Manual scan for missed skills
    if (!data.proficiencies) data.proficiencies = {};
    if (!data.proficiencies.skillCount || data.proficiencies.skillCount === 0) {
      const skillRegex = /(?:choose|select|pick|proficiency\s+in)\s+(?:any\s+)?(\d+|one|two|three|four)\s+skills?/i;
      const numMap = { 'one': 1, 'two': 2, 'three': 3, 'four': 4 };

      if (data.traits) {
        for (const trait of data.traits) {
          const match = trait.description.match(skillRegex);
          if (match) {
            let count = parseInt(match[1]);
            if (isNaN(count)) count = numMap[match[1].toLowerCase()] || 0;
            if (count > 0) {
              console.log(`Chronicle Keeper | Safety Net: Found ${count} skills in ${trait.name}`);
              data.proficiencies.skillCount = count;
              data.proficiencies.traitName = trait.name;
              break; 
            }
          }
        }
      }
    }

    data.description = data.description || '';
    data.creatureType = data.creatureType || 'Humanoid';
    if (!data.size || typeof data.size === 'string') {
      const sizeMap = { 'Tiny': 'tiny', 'Small': 'sm', 'Medium': 'med', 'Large': 'lg', 'Huge': 'huge' };
      const val = data.size ? (sizeMap[data.size] || 'med') : 'med';
      data.size = { value: val, options: [val] };
    }
    data.movement = data.movement || { walk: 30 };
    data.senses = data.senses || {};
    if (!data.abilityScoreIncrease) {
      data.abilityScoreIncrease = { type: 'flexible', options: { increases: 3, pool: [1, 1, 1] } };
    }
    data.traits = data.traits || [];
    if (Array.isArray(data.languages)) {
      data.languages = { value: data.languages.map(l => l.toLowerCase()), custom: '' };
    } else if (!data.languages) {
      data.languages = { value: ['common'], custom: '' };
    }
    data.proficiencies.skills = data.proficiencies.skills || [];
    data.proficiencies.skillCount = data.proficiencies.skillCount || 0;
    return data;
  }

  async create(raceData) {
    const speciesCompendiumId = game.settings.get('chronicle-keeper-compendium', 'targetCompendium');
    const traitsCompendiumId = game.settings.get('chronicle-keeper-compendium', 'traitsCompendium');
    
    if (!speciesCompendiumId) throw new Error("Species compendium not found");
    const speciesPack = game.packs.get(speciesCompendiumId);
    if (!speciesPack) throw new Error("Species compendium pack not found");
    const traitsPack = traitsCompendiumId ? game.packs.get(traitsCompendiumId) : speciesPack;
    
    // --- 1. Handle Traits ---
    const existingTraits = await traitsPack.getDocuments();
    const traitMap = new Map();
    
    if (raceData.traits.length > 0) {
      for (const trait of raceData.traits) {
        const traitItemData = this._buildTraitItem(trait, raceData);
        const existingTrait = existingTraits.find(i => i.name === trait.name);
        let created;
        
        if (existingTrait) {
          console.log(`Chronicle Keeper | Updating existing trait: ${trait.name}`);
          created = existingTrait;
          await created.update(traitItemData);
        } else {
          console.log(`Chronicle Keeper | Creating new trait: ${trait.name}`);
          created = await traitsPack.documentClass.create(traitItemData, { pack: traitsPack.collection });
        }
        traitMap.set(trait.name, created.uuid);
      }
    }
    
    // --- 2. Handle Species ---
    const itemData = this._buildItemData(raceData);
    if (itemData.system.advancement) {
      itemData.system.advancement.forEach(adv => {
        if (adv.type === 'ItemGrant' && adv.configuration) {
          const uuid = traitMap.get(adv.title);
          if (uuid) adv.configuration.items = [uuid];
        }
      });
    }
    
    const existingSpecies = (await speciesPack.getDocuments()).find(i => i.name === raceData.name);
    if (existingSpecies) {
      console.log(`Chronicle Keeper | Updating existing species: ${raceData.name}`);
      await existingSpecies.update(itemData);
      ui.notifications.info(`Updated existing species: ${raceData.name}`);
    } else {
      console.log(`Chronicle Keeper | Creating new species: ${raceData.name}`);
      await speciesPack.documentClass.create(itemData, { pack: speciesPack.collection });
      ui.notifications.info(`Created new species: ${raceData.name}`);
    }
    
    return raceData;
  }

  // --- Helper Methods (Internal to Strategy) ---

  _buildTraitItem(trait, raceData) {
    const itemData = {
      name: trait.name,
      type: 'feat',
      img: trait.isAttack ? 'icons/skills/melee/strike-sword-steel-yellow.webp' : 'icons/svg/upgrade.svg',
      system: {
        description: { value: `<p>${trait.description}</p>` },
        source: { custom: `${raceData.name} Trait` },
        type: { value: 'race', subtype: '' },
        advancement: []
      }
    };

    if (raceData.proficiencies.traitName === trait.name && raceData.proficiencies.skillCount > 0) {
       console.log(`Chronicle Keeper | Adding Skill Advancement to TRAIT: ${trait.name}`);
       const allSkills = [
         "skills:acr", "skills:ani", "skills:arc", "skills:ath", 
         "skills:dec", "skills:his", "skills:ins", "skills:itm", 
         "skills:inv", "skills:med", "skills:nat", "skills:prc", 
         "skills:prf", "skills:per", "skills:rel", "skills:slt", 
         "skills:ste", "skills:sur"
       ];

       itemData.system.advancement.push({
        _id: foundry.utils.randomID(),
        type: 'Trait',
        configuration: {
          mode: 'default',
          allowReplacements: true, 
          choices: [{ 
            count: raceData.proficiencies.skillCount,
            pool: allSkills 
          }]
        },
        title: 'Skills',
        hint: `Choose any ${raceData.proficiencies.skillCount} skill proficiencies`
      });
    }

    if (trait.isAttack && trait.damage && trait.damage.parts) {
      const activityId = foundry.utils.randomID();
      itemData.system.activities = {
        [activityId]: {
          _id: activityId,
          type: 'attack',
          activation: { type: 'action', value: 1 },
          attack: { ability: trait.damage.base || 'str', type: { value: 'melee', classification: 'natural' } },
          damage: {
            includeBase: true,
            parts: trait.damage.parts.map(p => ({
              number: parseInt(p[0].match(/(\d+)d/)?.[1] || 1),
              denomination: parseInt(p[0].match(/d(\d+)/)?.[1] || 6),
              bonus: '@mod',
              types: [p[1]]
            }))
          }
        }
      };
    }
    return itemData;
  }

  _buildItemData(raceData) {
    return {
      name: raceData.name,
      type: 'race',
      img: 'icons/svg/mystery-man.svg',
      system: {
        description: { value: `<p>${raceData.description}</p>` },
        identifier: raceData.name.toLowerCase().replace(/\s+/g, '-'),
        type: { value: (raceData.creatureType || 'humanoid').toLowerCase() },
        movement: this._buildMovement(raceData.movement),
        senses: this._buildSenses(raceData.senses),
        advancement: this._buildAdvancement(raceData)
      }
    };
  }

  _buildMovement(m) {
    if (!m) return { walk: 30, units: 'ft' };
    const r = { walk: m.walk || 30, units: 'ft' };
    if (m.climb) r.climb = m.climb;
    if (m.fly) r.fly = m.fly;
    if (m.swim) r.swim = m.swim;
    return r;
  }

  _buildSenses(s) {
    if (!s) return { units: 'ft' };
    const r = { units: 'ft' };
    if (s.darkvision) r.darkvision = s.darkvision;
    if (s.blindsight) r.blindsight = s.blindsight;
    return r;
  }

  _buildAdvancement(raceData) {
    const adv = [];
    if (raceData.size) {
      adv.push({
        _id: foundry.utils.randomID(),
        type: 'Size',
        configuration: { sizes: raceData.size.options || ['med'] }
      });
    }
    if (raceData.abilityScoreIncrease) {
      adv.push({
        _id: foundry.utils.randomID(),
        type: 'AbilityScoreImprovement',
        configuration: {
          points: raceData.abilityScoreIncrease.options.increases || 3,
          cap: 2
        }
      });
    }
    if (raceData.languages && raceData.languages.value) {
      adv.push({
        _id: foundry.utils.randomID(),
        type: 'Trait',
        configuration: {
          mode: 'default',
          grants: raceData.languages.value,
          choices: raceData.languages.custom ? [{ count: 1, pool: [] }] : []
        },
        title: 'Languages',
        hint: raceData.languages.custom
      });
    }
    if (raceData.traits) {
      raceData.traits.forEach(t => {
        adv.push({
          _id: foundry.utils.randomID(),
          type: 'ItemGrant',
          configuration: { items: [t.name] }, 
          title: t.name
        });
      });
    }
    if (raceData.proficiencies.skills && raceData.proficiencies.skills.length > 0) {
       adv.push({
        _id: foundry.utils.randomID(),
        type: 'Trait',
        configuration: {
          mode: 'default',
          grants: raceData.proficiencies.skills.map(s => s.toLowerCase())
        },
        title: 'Skill Proficiency'
      });
    }
    return adv;
  }
}