import { BaseStrategy } from './base-strategy.js';

export class FeatureStrategy extends BaseStrategy {
  constructor() {
    super();
    this.key = "feature";
  }

  getPrompt(content, options = {}) {
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

    // --- SPECIALIZED PROMPT FOR SPELL LISTS ---
    if (options.isSpellList) {
      return `You are a helper for D&D 5e.
      
      TASK: Convert the input text into a SINGLE D&D Feature representing an "Expanded Spell List".
      
      RULES:
      1. NAME: The first line is the Feature Name. Remove "Level X:" prefixes. Keep the rest of the name COMPLETE. Do not shorten it.
      2. DESCRIPTION: 
         - Start with the introduction text VERBATIM (e.g., "The [Name] lets you choose...").
         - Then create a COMPLETE HTML Table (<table>) containing EVERY row from the source text. Do NOT truncate.
         - Columns: "Spell Level" and "Spells".
      3. OUTPUT: Return a JSON object with a single feature.

      Example Input:
      "Guardian Expanded Spells
      The Guardian offers these spells.
      1st: sleep, charm person
      2nd: darkness, hold person"

      Example Output:
      {
        "features": [
          {
            "name": "Guardian Expanded Spells",
            "description": "<p>The Guardian offers these spells.</p><table border='1'><thead><tr><th>Spell Level</th><th>Spells</th></tr></thead><tbody><tr><td>1st</td><td>sleep, charm person</td></tr><tr><td>2nd</td><td>darkness, hold person</td></tr></tbody></table>",
            "level": 1
          }
        ]
      }

      SOURCE TEXT:
      ${cleanContent}

      Return JSON only.`;
    }

    return `You are a strict data extraction engine.

    TASK: Extract D&D 5e CLASS FEATURE data from the text below.

    *** CRITICAL RULES ***
    1. **NAME = FIRST LINE:** The first line of the text is the Feature Name. Use it VERBATIM. Do NOT look for a name in the description.
    2. **EXTRACT VERBATIM:** Do NOT summarize. Copy the text EXACTLY as it appears. Include EVERY sentence, especially the final one.
    3. **INCLUDE ALL PARAGRAPHS:** Features often have multiple sections (e.g. "Additionally...", "Once you use..."). Extract EVERYTHING.
    4. **MECHANICS:** Extract Action Type, Range, Target, Saving Throws, and Damage from ANY part of the text.
    5. **HTML FORMAT:** Wrap paragraphs in <p> tags. Use <ul>/<li> for lists.
    6. **TABLES:** If the text contains a table (like a Spell List), format it as an HTML <table> with <thead> and <tbody>.
    7. **NO SPLITTING SUB-OPTIONS:** If a feature lists choices (e.g. "Choose one:", "Options:", or bullet points), KEEP them in the Description. Do **NOT** create separate features for them.
    8. **IGNORE REFERENCES:** If the text modifies another feature (e.g. "When you use Misty Escape..." or "When using Master of None..."), the name is the NEW feature (the Header), NOT the referenced feature.
    9. **NO EXAMPLE COPYING:** The "ONE-SHOT EXAMPLE" below is for formatted reference only. Do NOT include "Magma Mastery" or "Phantom Echo" in your output. Output ONLY data found in the **SOURCE TEXT**.
    10. **REQUIREMENTS:** Only include class requirements if explicitly stated in the text. DO NOT HALLUCINATE "Fighter".
    11. **SPELLS:** If you see "Expanded Spell List", extract it as a "spells" array.
    12. **NAME DETECTION:** If the name is not labeled "Name:", look at the first paragraph (e.g. "The Faceless One is..." -> Name: "The Faceless One").
    13. **HEADER FORMATS:** Recognize specific formats:
        - "Feature Name (Level X)"
        - "Level X: Feature Name"
        - "Feature Name (Available at X Level)"

    *** ONE-SHOT EXAMPLE ***
    Input:
    "Magma Mastery (Available at 3rd level)
    As an action, you create a sphere of magma in a 15-foot cone. Each creature in that area must make a Dexterity saving throw. On a failed save, the creature takes 3d6 fire damage.
    
    Additionally, you choose one of the following benefits:
    * Searing Skin: You deal 1d4 fire damage to creatures that touch you.
    * Molten Core: You gain resistance to cold damage.

    Phantom Echo (Available at 6th level)
    When you use your Misty Step feature, you can choose to leave an illusion behind. This illusion lasts until the start of your next turn.

    Eldritch Expanded Spells (Available at 3rd level)
    The Eldritch Guardian lets you choose from an expanded list of spells when you learn a warlock spell.
    1st: faerie fire, sleep
    2nd: calm emotions, phantasmal force
    3rd: blink, plant growth
    
    Once you use this feature, you cannot use it again until you finish a short or long rest."

    Output:
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
          "damage": [ { "formula": "3d6", "type": "fire" } ],
          "uses": { "value": 1, "max": "1", "per": "sr" }
        },
        {
          "name": "Phantom Echo",
          "description": "<p>When you use your Misty Step feature, you can choose to leave an illusion behind. This illusion lasts until the start of your next turn.</p>",
          "level": 6,
          "activation": {},
          "range": {},
          "target": {},
          "save": {},
          "uses": {}
        },
        {
          "name": "Eldritch Expanded Spells",
          "description": "<p>The Eldritch Guardian lets you choose from an expanded list of spells when you learn a warlock spell.</p><table border='1'><thead><tr><th>Spell Level</th><th>Spells</th></tr></thead><tbody><tr><td>1st</td><td>faerie fire, sleep</td></tr><tr><td>2nd</td><td>calm emotions, phantasmal force</td></tr><tr><td>3rd</td><td>blink, plant growth</td></tr></tbody></table>",
          "level": 3
        }
      ]
    }
    *** END EXAMPLE ***

    Required JSON Structure:
    {
      "features": [
        { 
          "name": "Feature Name", 
          "description": "FULL HTML CONTENT", 
          "level": 1,
          "activation": { "type": "action", "cost": 1 },
          "range": { "value": null, "units": "ft" },
          "target": { "value": null, "units": "ft", "type": "" },
          "save": { "ability": "", "scaling": "spell" },
          "uses": { "value": null, "max": "", "per": "" }
        }
      ]
    }

    SOURCE TEXT:
    ${cleanContent}
    
    IMPORTANT: EXTRACT THE FULL DESCRIPTION VERBATIM. DO NOT TRUNCATE.`;
  }

  async create(data) {
    console.log("Chronicle Keeper | Creating Features...");
    const featurePack = game.packs.get("world.chronicle-keeper-features");

    if (!featurePack) {
      ui.notifications.error("Missing feature compendium!");
      return;
    }

    // Safety check for data
    let features = data.features || [];

    // --- HALLUCINATION FILTER ---
    // Remove features that match the One-Shot Example names
    const BLACKLISTED = ["Magma Mastery", "Phantom Echo", "Eldritch Expanded Spells"];
    features = features.filter(f => !BLACKLISTED.includes(f.name));

    if (features.length === 0) {
      ui.notifications.warn("No features found in text (or only examples were found).");
      return;
    }

    let createdCount = 0;
    for (const feat of features) {
      let cleanDesc = feat.description || "";

      if (!cleanDesc.trim().startsWith('<')) {
        cleanDesc = `<p>${cleanDesc.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br>')}</p>`;
      }

      // Check for duplicates in the pack to avoid spamming? 
      // User requested "upload class feats", implying bulk add. 
      // We will create new ones, or maybe check by name?
      // For now, simple create is safer for bulk operations, user can delete duplicates.

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

      // Map Requirements
      const requirements = feat.requirements || (feat.level ? `Level ${feat.level}` : "");

      const featItem = {
        name: feat.name,
        type: 'feat',
        img: 'icons/svg/book.svg',
        system: {
          description: { value: cleanDesc },
          source: { custom: "Imported Feature" },
          type: { value: 'class', subtype: '' },
          requirements: requirements,
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
              size: tgt.value, // value usually maps to size/length for templates
              units: tgt.units
            }
          };
        } else {
          // Otherwise assume it affects creatures
          return {
            affects: {
              type: rawType || "creature",
              count: tgt.value || "" // If value is just a number, it might be count
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
        // Check regex for word boundaries to avoid false positives
        const regex = new RegExp(`\\b${condition}\\b`, "i");
        if (regex.test(cleanDesc)) {
          effects.push({
            name: condition,
            icon: `icons/svg/aura.svg`, // Generic placeholder, user can swap
            transfer: false, // Usually false for features applied to others
            statuses: [condition.toLowerCase()],
            description: `Applies ${condition} condition.`
          });
        }
      }
      featItem.effects = effects;

      await featurePack.documentClass.create(featItem, { pack: featurePack.collection });
      console.log(`   - Created Feature: ${feat.name}`);
      createdCount++;
    }

    ui.notifications.info(`Successfully created ${createdCount} features.`);
  }
}
