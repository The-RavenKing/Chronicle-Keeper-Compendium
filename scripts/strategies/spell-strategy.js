import { BaseStrategy } from './base-strategy.js';

export class SpellStrategy extends BaseStrategy {
  constructor() {
    super();
    this.key = "spell";
  }

  getPrompt(content) {
    return `Extract D&D 5e SPELL information.

Required JSON Structure:
{
  "name": "Fireball",
  "level": 3,
  "school": "evocation",
  "castingTime": { "value": 1, "unit": "action" },
  "range": { "value": 150, "units": "ft" },
  "duration": { "value": 0, "units": "inst" },
  "components": { "v": true, "s": true, "m": false, "material": "" },
  "description": "Full text...",
  "damage": { "parts": [["8d6", "fire"]], "scaling": "level" },
  "save": { "ability": "dex", "dc": null, "scaling": "spell" },
  "target": { "value": 20, "units": "ft", "type": "sphere" }
}

RULES:
1. School must be lowercase (evocation, abjuration, etc).
2. Level 0 is Cantrip.
3. Duration units: inst, round, minute, hour, day.
4. Target type: sphere, cone, cylinder, line, cube, self, creature.

SOURCE TEXT:
${content}`;
  }

  async create(data) {
    const packId = game.settings.get('chronicle-keeper-compendium', 'targetCompendium');
    const pack = game.packs.get(packId);
    if (!pack) throw new Error("Target compendium not found");

    const itemData = {
      name: data.name,
      type: 'spell',
      img: 'icons/svg/daze.svg', // Generic icon
      system: {
        description: { value: `<p>${data.description}</p>` },
        level: data.level,
        school: data.school?.toLowerCase(),
        activation: { type: data.castingTime?.unit || 'action', value: data.castingTime?.value || 1 },
        duration: { value: data.duration?.value || 0, units: data.duration?.units || 'inst' },
        range: { value: data.range?.value, units: data.range?.units || 'ft' },
        target: { value: data.target?.value, units: data.target?.units, type: data.target?.type },
        properties: []
      }
    };

    // Components
    if (data.components) {
      itemData.system.properties = [];
      if (data.components.v) itemData.system.properties.push('vocal');
      if (data.components.s) itemData.system.properties.push('somatic');
      if (data.components.m) {
        itemData.system.properties.push('material');
        itemData.system.materials = { value: data.components.material, consumed: false, cost: 0 };
      }
    }

    // Damage / Attack Activity
    if (data.damage || data.save) {
      const activityId = foundry.utils.randomID();
      itemData.system.activities = {
        [activityId]: {
          _id: activityId,
          type: data.save ? 'save' : 'attack',
          damage: {
            parts: data.damage?.parts.map(p => ({
              number: parseInt(p[0].match(/(\d+)d/)?.[1] || 0),
              denomination: parseInt(p[0].match(/d(\d+)/)?.[1] || 6),
              types: [p[1]]
            })) || []
          }
        }
      };
      
      if (data.save) {
        itemData.system.activities[activityId].save = {
          ability: { Set: [data.save.ability] },
          dc: { calculation: 'spell' }
        };
      }
    }

    await pack.documentClass.create(itemData, { pack: pack.collection });
    ui.notifications.info(`Created Spell: ${data.name}`);
  }
}