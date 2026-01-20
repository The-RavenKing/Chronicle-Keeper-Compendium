import { BaseStrategy } from './base-strategy.js';

export class MonsterStrategy extends BaseStrategy {
  constructor() {
    super();
    this.key = "monster";
  }

  getPrompt(content) {
    return `Extract D&D 5e MONSTER/NPC information.

Required JSON Structure:
{
  "name": "Goblin",
  "description": "Flavor text...",
  "size": "sm",
  "type": "humanoid",
  "ac": { "value": 15, "calc": "natural" },
  "hp": { "value": 7, "formula": "2d6" },
  "speed": { "walk": 30 },
  "stats": { "str": 8, "dex": 14, "con": 10, "int": 10, "wis": 8, "cha": 8 },
  "cr": 0.25,
  "actions": [
    { "name": "Scimitar", "desc": "Melee Weapon Attack: +4 to hit...", "damage": "1d6 + 2" }
  ]
}

SOURCE TEXT:
${content}`;
  }

  validate(data) {
    if (!data.name) throw new Error("Missing Name");
    return data;
  }

  async create(data) {
    // Note: We create an Actor, not an Item!
    const actorData = {
      name: data.name,
      type: 'npc',
      img: 'icons/svg/mystery-man.svg',
      system: {
        attributes: {
          ac: { value: data.ac?.value, calc: data.ac?.calc || 'flat' },
          hp: { value: data.hp?.value, max: data.hp?.value, formula: data.hp?.formula },
          speed: data.speed,
        },
        abilities: data.stats,
        details: { cr: data.cr, type: { value: data.type }, race: data.name }
      }
    };

    const actor = await Actor.create(actorData);
    
    // Create Actions as Items embedded in the Actor
    if (data.actions) {
      const items = data.actions.map(act => ({
        name: act.name,
        type: 'weapon', // Simplified for generic actions
        system: { description: { value: act.desc } }
      }));
      await actor.createEmbeddedDocuments("Item", items);
    }

    ui.notifications.info(`Created NPC: ${data.name}`);
  }
}