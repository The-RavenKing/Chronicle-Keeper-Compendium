export class RaceImporterApp extends Application {
  constructor(options = {}) {
    super(options);
    this.activeTab = 'url';
  }

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: 'race-importer',
      title: game.i18n.localize('RACE_IMPORTER.Title'),
      template: 'modules/race-importer-ollama/templates/race-importer.html',
      width: 650,
      height: 600,
      resizable: true,
      classes: ['race-importer-window'],
      submitOnChange: false,
      closeOnSubmit: false
    });
  }

  getData() {
    const data = super.getData();
    
    // Get settings
    data.ollamaUrl = game.settings.get('race-importer-ollama', 'ollamaUrl');
    data.ollamaModel = game.settings.get('race-importer-ollama', 'ollamaModel');
    data.systemType = game.settings.get('race-importer-ollama', 'systemType');
    
    // Get available compendiums
    data.compendiums = game.packs
      .filter(pack => pack.documentName === 'Item')
      .map(pack => ({
        id: pack.collection,
        name: pack.title
      }));
    
    data.selectedCompendium = game.settings.get('race-importer-ollama', 'targetCompendium');
    data.selectedTraitsCompendium = game.settings.get('race-importer-ollama', 'traitsCompendium');
    data.activeTab = this.activeTab;
    
    return data;
  }

  activateListeners(html) {
    super.activateListeners(html);

    // Tab switching
    html.find('.race-importer-tab').click(this._onTabClick.bind(this));

    // Buttons
    html.find('#fetch-url-btn').click(this._onFetchURL.bind(this));
    html.find('#import-url-btn').click(this._onImportFromURL.bind(this));
    html.find('#import-text-btn').click(this._onImportFromText.bind(this));
    html.find('#test-connection-btn').click(this._onTestConnection.bind(this));

    // Save settings on change
    html.find('#ollama-url').change(this._onSettingChange.bind(this));
    html.find('#ollama-model').change(this._onSettingChange.bind(this));
    html.find('#target-compendium').change(this._onSettingChange.bind(this));
    html.find('#traits-compendium').change(this._onSettingChange.bind(this));
    html.find('#system-type').change(this._onSettingChange.bind(this));
  }

  _onTabClick(event) {
    event.preventDefault();
    const tab = $(event.currentTarget).data('tab');
    this.activeTab = tab;
    
    // Update UI
    const html = this.element;
    html.find('.race-importer-tab').removeClass('active');
    html.find(`.race-importer-tab[data-tab="${tab}"]`).addClass('active');
    html.find('.race-importer-content').removeClass('active');
    html.find(`#${tab}-content`).addClass('active');
  }

  async _onSettingChange(event) {
    const setting = $(event.currentTarget).attr('id');
    const value = $(event.currentTarget).val();
    
    const settingMap = {
      'ollama-url': 'ollamaUrl',
      'ollama-model': 'ollamaModel',
      'target-compendium': 'targetCompendium',
      'traits-compendium': 'traitsCompendium',
      'system-type': 'systemType'
    };
    
    if (settingMap[setting]) {
      await game.settings.set('race-importer-ollama', settingMap[setting], value);
    }
  }

  async _onTestConnection(event) {
    event.preventDefault();
    const button = $(event.currentTarget);
    const ollamaUrl = game.settings.get('race-importer-ollama', 'ollamaUrl');
    
    button.prop('disabled', true);
    this._showStatus('info', 'Testing connection...');
    
    try {
      const response = await fetch(`${ollamaUrl}/api/tags`);
      if (response.ok) {
        this._showStatus('success', game.i18n.localize('RACE_IMPORTER.ConnectionSuccess'));
      } else {
        this._showStatus('error', game.i18n.localize('RACE_IMPORTER.ConnectionFailed'));
      }
    } catch (error) {
      this._showStatus('error', game.i18n.format('RACE_IMPORTER.OllamaError', { url: ollamaUrl }));
    } finally {
      button.prop('disabled', false);
    }
  }

  async _onFetchURL(event) {
    event.preventDefault();
    const button = $(event.currentTarget);
    const url = this.element.find('#race-url').val().trim();
    
    if (!url) {
      this._showStatus('error', 'Please enter a URL');
      return;
    }
    
    button.prop('disabled', true);
    this._showStatus('info', game.i18n.localize('RACE_IMPORTER.FetchingURL'));
    
    try {
      const content = await this._fetchURL(url);
      this.element.find('#url-preview').val(content);
      this._showStatus('success', 'Content fetched successfully');
    } catch (error) {
      this._showStatus('error', `Failed to fetch URL: ${error.message}`);
    } finally {
      button.prop('disabled', false);
    }
  }

  async _onImportFromURL(event) {
    event.preventDefault();
    const content = this.element.find('#url-preview').val().trim();
    
    if (!content) {
      this._showStatus('error', 'No content to import. Fetch a URL first.');
      return;
    }
    
    await this._importRace(content);
  }

  async _onImportFromText(event) {
    event.preventDefault();
    const content = this.element.find('#race-text').val().trim();
    
    if (!content) {
      this._showStatus('error', 'Please enter race information');
      return;
    }
    
    await this._importRace(content);
  }

  async _fetchURL(url) {
    // Use a CORS proxy or direct fetch depending on the URL
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const html = await response.text();
      
      // Extract text from HTML
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      // Remove script and style elements
      doc.querySelectorAll('script, style, nav, footer, header').forEach(el => el.remove());
      
      return doc.body.textContent || doc.body.innerText || '';
    } catch (error) {
      throw new Error(`Failed to fetch URL: ${error.message}`);
    }
  }

  async _importRace(content) {
    const button = this.element.find('.race-importer-button:contains("Import")');
    button.prop('disabled', true);
    
    try {
      // Step 1: Parse with Ollama
      this._showStatus('info', game.i18n.localize('RACE_IMPORTER.ParsingWithOllama'));
      const raceData = await this._parseWithOllama(content);
      
      // Step 2: Create Foundry document
      this._showStatus('info', game.i18n.localize('RACE_IMPORTER.CreatingDocument'));
      await this._createRaceDocument(raceData);
      
      this._showStatus('success', game.i18n.format('RACE_IMPORTER.Success', { name: raceData.name }));
    } catch (error) {
      console.error('Race import error:', error);
      this._showStatus('error', game.i18n.format('RACE_IMPORTER.Error', { error: error.message }));
    } finally {
      button.prop('disabled', false);
    }
  }

  async _parseWithOllama(content) {
    const ollamaUrl = game.settings.get('race-importer-ollama', 'ollamaUrl');
    const ollamaModel = game.settings.get('race-importer-ollama', 'ollamaModel');
    const systemType = game.settings.get('race-importer-ollama', 'systemType');
    
    const prompt = this._buildOllamaPrompt(content, systemType);
    
    console.log('Race Importer | Sending to Ollama...');
    
    try {
      const response = await fetch(`${ollamaUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: ollamaModel,
          prompt: prompt,
          stream: false,
          format: 'json'
        })
      });
      
      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('Race Importer | Raw Ollama response:', result.response);
      
      const jsonData = JSON.parse(result.response);
      console.log('Race Importer | Parsed JSON:', jsonData);
      
      const validated = this._validateRaceData(jsonData);
      console.log('Race Importer | Validated data:', validated);
      
      // Store for debugging
      if (!game.modules.get('race-importer-ollama')._debug) {
        game.modules.get('race-importer-ollama')._debug = {};
      }
      game.modules.get('race-importer-ollama')._debug.lastImport = validated;
      
      return validated;
    } catch (error) {
      console.error('Race Importer | Parse error:', error);
      throw new Error(`Failed to parse with Ollama: ${error.message}`);
    }
  }

  _buildOllamaPrompt(content, systemType) {
    return `Extract race/species information from the following text and return ONLY valid JSON (no markdown, no preamble) with this exact structure:

{
  "name": "Tabaxi",
  "description": "Tabaxi's appearance is as varied as their attitudes",
  "creatureType": "Humanoid",
  "size": {
    "value": "med",
    "options": ["sm", "med"]
  },
  "movement": {
    "walk": 30,
    "climb": 30,
    "fly": 0,
    "swim": 0,
    "burrow": 0,
    "hover": false
  },
  "senses": {
    "darkvision": 60,
    "blindsight": 0,
    "tremorsense": 0,
    "truesight": 0
  },
  "abilityScoreIncrease": {
    "type": "flexible",
    "options": {
      "increases": 3,
      "pool": [1, 1, 1]
    }
  },
  "traits": [
    {
      "name": "Cat's Claws",
      "description": "Full description with all mechanics",
      "isAttack": true,
      "damage": {
        "parts": [["1d6", "slashing"]],
        "base": "str"
      }
    },
    {
      "name": "Cat's Talent",
      "description": "You have proficiency in Perception and Stealth",
      "isAttack": false
    },
    {
      "name": "Darkvision",
      "description": "You can see in dim light within 60 feet",
      "isAttack": false
    },
    {
      "name": "Feline Agility",
      "description": "When you move on your turn you can double your speed",
      "isAttack": false
    }
  ],
  "languages": {
    "value": ["common"],
    "custom": "one other language"
  },
  "proficiencies": {
    "skills": ["perception", "stealth"]
  }
}

CRITICAL RULES:

1. EXTRACT ALL TRAITS - Don't skip any! Common traits include:
   - Attack traits (claws, bite, horns, etc.)
   - Skill proficiencies (as a trait if mentioned)
   - Darkvision (ALWAYS make this a separate trait if mentioned!)
   - Special movement (if it's a special ability, make it a trait)
   - Unique racial abilities (like Feline Agility, Lucky, Brave, etc.)

2. FOR ATTACK TRAITS ONLY:
   - Set "isAttack": true
   - Include "damage" object with parts and base
   - Example: Cat's Claws, Bite, Horns, Talons

3. FOR NON-ATTACK TRAITS:
   - Set "isAttack": false
   - DO NOT include "damage" field at all
   - Example: Darkvision, Feline Agility, Lucky, Brave, skill proficiencies

4. CREATURE TYPE:
   - ALWAYS set to "Humanoid" unless explicitly stated otherwise
   - Capitalize it

5. MOVEMENT:
   - "climbing speed equal to walking speed" → climb: same as walk
   - Always include walk speed (default 30)

6. DARKVISION:
   - If darkvision is mentioned, set senses.darkvision to the distance
   - ALSO create a separate trait for it!

7. ABILITY SCORES:
   - 2024 rules: always use flexible type
   - "increase one by 2 and one by 1" = increases: 2, pool: [2, 1]
   - "increase three by 1" = increases: 3, pool: [1, 1, 1]

8. LANGUAGES:
   - Standard languages in "value" array: ["common", "elvish"]
   - Choice text in "custom": "one other language of your choice"

9. SKILLS:
   - List in proficiencies.skills: ["perception", "stealth"]
   - Lowercase names

Source text:
${content}

Return ONLY the JSON object. Make sure to extract EVERY trait mentioned!`;
  }

  _validateRaceData(data) {
    if (!data.name) {
      throw new Error('Missing race name');
    }
    
    // Ensure required fields exist with proper defaults
    data.description = data.description || '';
    data.creatureType = data.creatureType || 'humanoid';
    
    // Validate and set defaults for size
    if (!data.size || typeof data.size === 'string') {
      // Convert old string format to new object format
      const sizeMap = {
        'Tiny': 'tiny',
        'Small': 'sm',
        'Medium': 'med',
        'Large': 'lg',
        'Huge': 'huge',
        'Gargantuan': 'grg'
      };
      const sizeValue = data.size ? (sizeMap[data.size] || 'med') : 'med';
      data.size = { value: sizeValue, options: [sizeValue] };
    }
    
    // Ensure movement exists
    data.movement = data.movement || { walk: 30 };
    
    // Ensure senses exists
    data.senses = data.senses || {};
    
    // Validate ability score increase
    if (!data.abilityScoreIncrease) {
      // Default to 2024 flexible increases
      data.abilityScoreIncrease = {
        type: 'flexible',
        options: { increases: 3, pool: [1, 1, 1] }
      };
    }
    
    // Ensure traits is an array
    data.traits = data.traits || [];
    
    // Validate languages format
    if (Array.isArray(data.languages)) {
      // Convert old array format to new object format
      data.languages = {
        value: data.languages.map(l => l.toLowerCase()),
        custom: ''
      };
    } else if (!data.languages) {
      data.languages = { value: ['common'], custom: '' };
    }
    
    // Ensure proficiencies exists
    data.proficiencies = data.proficiencies || {
      skills: [],
      weapons: [],
      armor: [],
      tools: []
    };
    
    return data;
  }

  async _createRaceDocument(raceData) {
    const speciesCompendiumId = game.settings.get('race-importer-ollama', 'targetCompendium');
    const traitsCompendiumId = game.settings.get('race-importer-ollama', 'traitsCompendium');
    
    if (!speciesCompendiumId) {
      throw new Error(game.i18n.localize('RACE_IMPORTER.NoCompendium'));
    }
    
    const speciesPack = game.packs.get(speciesCompendiumId);
    if (!speciesPack) {
      throw new Error('Species compendium not found');
    }
    
    // Use traits compendium if specified, otherwise use same as species
    const traitsPack = traitsCompendiumId ? game.packs.get(traitsCompendiumId) : speciesPack;
    if (!traitsPack) {
      throw new Error('Traits compendium not found');
    }
    
    console.log(`Race Importer | Species compendium: ${speciesPack.title}`);
    console.log(`Race Importer | Traits compendium: ${traitsPack.title}`);
    console.log(`Race Importer | Creating ${raceData.traits?.length || 0} trait items...`);
    
    // First, create the trait items and store their UUIDs
    const traitMap = new Map(); // name -> uuid
    if (raceData.traits && raceData.traits.length > 0) {
      for (const trait of raceData.traits) {
        console.log(`Race Importer | Creating trait: ${trait.name}`, trait);
        const traitItem = this._buildTraitItem(trait, raceData.name);
        console.log(`Race Importer | Trait item data:`, traitItem);
        const created = await traitsPack.documentClass.create(traitItem, { pack: traitsPack.collection });
        const uuid = `Compendium.${traitsPack.collection}.${created.id}`;
        traitMap.set(trait.name, uuid);
        console.log(`Race Importer | Created trait ${trait.name} with UUID: ${uuid}`);
      }
    }
    
    console.log(`Race Importer | Created ${traitMap.size} traits`);
    
    // Build the main species item data
    const itemData = this._buildItemData(raceData);
    console.log('Race Importer | Species item data:', itemData);
    
    // Update ItemGrant advancements to use UUIDs instead of IDs
    if (itemData.system.advancement) {
      itemData.system.advancement.forEach(adv => {
        if (adv.type === 'ItemGrant' && adv.configuration) {
          const traitName = adv.title;
          const uuid = traitMap.get(traitName);
          if (uuid) {
            adv.configuration.items = [uuid];
            console.log(`Race Importer | Linked ${traitName} to UUID: ${uuid}`);
          } else {
            console.warn(`Race Importer | Could not find UUID for trait: ${traitName}`);
          }
        }
      });
    }
    
    // Create the species document in the species compendium
    console.log(`Race Importer | Creating species: ${raceData.name}`);
    const species = await speciesPack.documentClass.create(itemData, { pack: speciesPack.collection });
    console.log(`Race Importer | Created species with ID: ${species.id}`);
  }

  _buildTraitItem(trait, raceName) {
    const itemData = {
      name: trait.name,
      type: 'feat',
      img: trait.isAttack ? 'icons/skills/melee/strike-sword-steel-yellow.webp' : 'icons/svg/upgrade.svg',
      system: {
        description: {
          value: `<p>${trait.description}</p>`,
          chat: '',
          unidentified: ''
        },
        source: {
          book: 'Imported',
          page: '',
          custom: `${raceName} Trait`
        },
        type: {
          value: 'race',
          subtype: ''
        },
        requirements: '',
        recharge: {
          value: null,
          charged: true
        },
        uses: {
          value: null,
          max: '',
          per: null,
          recovery: ''
        },
        properties: []
      }
    };

    // ONLY add activity if this is an attack trait with damage
    if (trait.isAttack === true && trait.damage && trait.damage.parts && trait.damage.parts.length > 0) {
      const activityId = foundry.utils.randomID();
      
      itemData.system.activities = {
        [activityId]: {
          _id: activityId,
          type: 'attack',
          activation: {
            type: 'action',
            value: 1,
            condition: '',
            override: false
          },
          consumption: {
            targets: [],
            scaling: {
              allowed: false,
              max: ''
            },
            spellSlot: true
          },
          description: {
            chatFlavor: ''
          },
          duration: {
            concentration: false,
            value: '',
            units: '',
            special: '',
            override: false
          },
          effects: [],
          range: {
            value: '',
            units: 'touch',
            special: '',
            override: false
          },
          target: {
            template: {
              count: '',
              contiguous: false,
              type: '',
              size: '',
              width: '',
              height: '',
              units: ''
            },
            affects: {
              count: '1',
              type: 'creature',
              choice: false,
              special: ''
            },
            override: false
          },
          attack: {
            ability: trait.damage.base || 'str',
            bonus: '',
            critical: {
              threshold: null,
              damage: ''
            },
            flat: false,
            type: {
              value: 'melee',
              classification: 'weapon'
            }
          },
          damage: {
            critical: {
              bonus: ''
            },
            includeBase: true,
            parts: trait.damage.parts.map(part => {
              // Parse the damage formula (e.g., "1d6")
              const match = part[0].match(/(\d+)d(\d+)/);
              const number = match ? parseInt(match[1]) : 1;
              const denomination = match ? parseInt(match[2]) : 6;
              
              return {
                number: number,
                denomination: denomination,
                bonus: '@mod', // This adds the ability modifier
                types: [part[1]],
                custom: {
                  enabled: false,
                  formula: ''
                },
                scaling: {
                  mode: '',
                  number: null,
                  formula: ''
                }
              };
            })
          },
          uses: {
            spent: 0,
            max: '',
            recovery: []
          }
        }
      };
      
      console.log(`Race Importer | Added attack activity to ${trait.name}`);
    } else {
      console.log(`Race Importer | ${trait.name} is not an attack, no activity added`);
    }
    
    return itemData;
  }

  _buildItemData(raceData) {
    const systemType = game.settings.get('race-importer-ollama', 'systemType');
    
    if (systemType === 'dnd5e') {
      return this._buildDnd5eData(raceData);
    }
    
    // Default/generic structure
    return this._buildGenericData(raceData);
  }

  _buildDnd5eData(raceData) {
    // Build the main species item
    const itemData = {
      name: raceData.name,
      type: 'race',
      img: 'icons/svg/mystery-man.svg',
      system: {
        description: {
          value: this._buildDescription(raceData),
          chat: '',
          unidentified: ''
        },
        source: {
          book: 'Imported',
          page: '',
          custom: 'Chronicle Keeper - Compendium Import'
        },
        identifier: raceData.name.toLowerCase().replace(/\s+/g, '-'),
        type: {
          value: (raceData.creatureType || 'humanoid').toLowerCase(), // Must be lowercase!
          subtype: '',
          swarm: '',
          custom: ''
        },
        movement: this._buildMovement(raceData.movement),
        senses: this._buildSenses(raceData.senses),
        advancement: this._buildAdvancement(raceData)
      }
    };
    
    return itemData;
  }

  _buildMovement(movement) {
    if (!movement) return { walk: 30, units: 'ft' };
    
    const result = {
      walk: movement.walk || 30,
      units: 'ft'
    };
    
    // Add special movement types if they exist
    if (movement.climb && movement.climb > 0) result.climb = movement.climb;
    if (movement.fly && movement.fly > 0) result.fly = movement.fly;
    if (movement.swim && movement.swim > 0) result.swim = movement.swim;
    if (movement.burrow && movement.burrow > 0) result.burrow = movement.burrow;
    if (movement.hover) result.hover = true;
    
    return result;
  }

  _buildSenses(senses) {
    if (!senses) return { units: 'ft' };
    
    const result = { units: 'ft' };
    
    if (senses.darkvision && senses.darkvision > 0) result.darkvision = senses.darkvision;
    if (senses.blindsight && senses.blindsight > 0) result.blindsight = senses.blindsight;
    if (senses.tremorsense && senses.tremorsense > 0) result.tremorsense = senses.tremorsense;
    if (senses.truesight && senses.truesight > 0) result.truesight = senses.truesight;
    
    return result;
  }

  _buildAdvancement(raceData) {
    const advancement = [];
    
    // Size advancement
    if (raceData.size) {
      const sizeConfig = {
        _id: foundry.utils.randomID(),
        type: 'Size',
        level: 0,
        configuration: {}
      };
      
      if (raceData.size.options && raceData.size.options.length > 1) {
        // Player can choose size
        sizeConfig.configuration.sizes = raceData.size.options;
      } else {
        // Fixed size
        sizeConfig.configuration.sizes = [raceData.size.value || 'med'];
      }
      
      advancement.push(sizeConfig);
    }
    
    // Ability Score Improvement - D&D 5e 2024 style
    if (raceData.abilityScoreIncrease) {
      const asi = raceData.abilityScoreIncrease;
      
      if (asi.type === 'flexible' && asi.options) {
        // Flexible ability score increases (2024 rules)
        advancement.push({
          _id: foundry.utils.randomID(),
          type: 'AbilityScoreImprovement',
          level: 0,
          configuration: {
            points: asi.options.increases || 3,
            cap: 2,
            fixed: {},
            choices: asi.options.pool || [1, 1, 1]
          },
          value: {
            type: 'asi'
          },
          title: 'Ability Score Increase'
        });
      } else if (asi.fixed) {
        // Fixed ability scores (legacy)
        const fixed = {};
        Object.entries(asi.fixed).forEach(([ability, value]) => {
          if (value > 0) fixed[ability] = value;
        });
        
        if (Object.keys(fixed).length > 0) {
          advancement.push({
            _id: foundry.utils.randomID(),
            type: 'AbilityScoreImprovement',
            level: 0,
            configuration: {
              fixed: fixed,
              points: 0,
              cap: 2
            },
            value: {},
            title: 'Ability Score Increase'
          });
        }
      }
    }
    
    // Language proficiency advancement
    if (raceData.languages && raceData.languages.value && raceData.languages.value.length > 0) {
      advancement.push({
        _id: foundry.utils.randomID(),
        type: 'Trait',
        level: 0,
        configuration: {
          mode: 'default',
          allowReplacements: false,
          grants: raceData.languages.value,
          choices: raceData.languages.custom ? [{
            count: 1,
            pool: [] // Empty pool means "any language"
          }] : []
        },
        value: {
          chosen: []
        },
        title: 'Languages',
        hint: raceData.languages.custom || '',
        classRestriction: ''
      });
    }
    
    // Trait grants - create as ItemGrant advancement
    if (raceData.traits && raceData.traits.length > 0) {
      raceData.traits.forEach(trait => {
        advancement.push({
          _id: foundry.utils.randomID(),
          type: 'ItemGrant',
          level: 0,
          configuration: {
            items: [trait.name],
            optional: false,
            spell: null
          },
          value: {},
          title: trait.name,
          icon: '',
          classRestriction: ''
        });
      });
    }
    
    // Skill proficiencies
    if (raceData.proficiencies && raceData.proficiencies.skills && raceData.proficiencies.skills.length > 0) {
      advancement.push({
        _id: foundry.utils.randomID(),
        type: 'Trait',
        level: 0,
        configuration: {
          mode: 'default',
          allowReplacements: false,
          grants: raceData.proficiencies.skills.map(skill => skill.toLowerCase()),
          choices: []
        },
        value: {
          chosen: []
        },
        title: 'Skill Proficiency',
        hint: '',
        classRestriction: ''
      });
    }
    
    return advancement;
  }

  _buildDescription(raceData) {
    let html = `<p>${raceData.description}</p>`;
    
    // Add a summary of key features
    html += `<h3>Species Features</h3>`;
    
    if (raceData.creatureType) {
      html += `<p><strong>Creature Type:</strong> ${raceData.creatureType}</p>`;
    }
    
    if (raceData.size) {
      const sizeMap = {
        'tiny': 'Tiny',
        'sm': 'Small', 
        'med': 'Medium',
        'lg': 'Large',
        'huge': 'Huge',
        'grg': 'Gargantuan'
      };
      
      if (raceData.size.options && raceData.size.options.length > 1) {
        html += `<p><strong>Size:</strong> ${raceData.size.options.map(s => sizeMap[s] || s).join(' or ')}</p>`;
      } else {
        html += `<p><strong>Size:</strong> ${sizeMap[raceData.size.value] || raceData.size.value || 'Medium'}</p>`;
      }
    }
    
    if (raceData.movement) {
      const speeds = [];
      if (raceData.movement.walk) speeds.push(`${raceData.movement.walk} ft.`);
      if (raceData.movement.climb) speeds.push(`climb ${raceData.movement.climb} ft.`);
      if (raceData.movement.fly) speeds.push(`fly ${raceData.movement.fly} ft.`);
      if (raceData.movement.swim) speeds.push(`swim ${raceData.movement.swim} ft.`);
      if (raceData.movement.burrow) speeds.push(`burrow ${raceData.movement.burrow} ft.`);
      if (speeds.length > 0) {
        html += `<p><strong>Speed:</strong> ${speeds.join(', ')}</p>`;
      }
    }
    
    if (raceData.senses) {
      const senses = [];
      if (raceData.senses.darkvision) senses.push(`Darkvision ${raceData.senses.darkvision} ft.`);
      if (raceData.senses.blindsight) senses.push(`Blindsight ${raceData.senses.blindsight} ft.`);
      if (raceData.senses.tremorsense) senses.push(`Tremorsense ${raceData.senses.tremorsense} ft.`);
      if (raceData.senses.truesight) senses.push(`Truesight ${raceData.senses.truesight} ft.`);
      if (senses.length > 0) {
        html += `<p><strong>Senses:</strong> ${senses.join(', ')}</p>`;
      }
    }
    
    if (raceData.languages) {
      if (raceData.languages.value && raceData.languages.value.length > 0) {
        const langs = raceData.languages.value.map(l => l.charAt(0).toUpperCase() + l.slice(1));
        html += `<p><strong>Languages:</strong> ${langs.join(', ')}`;
        if (raceData.languages.custom) {
          html += `, ${raceData.languages.custom}`;
        }
        html += `</p>`;
      }
    }
    
    // Note about traits being granted
    if (raceData.traits && raceData.traits.length > 0) {
      html += `<p><em>This species grants ${raceData.traits.length} racial trait${raceData.traits.length > 1 ? 's' : ''}: ${raceData.traits.map(t => t.name).join(', ')}. These are added automatically when you select this species.</em></p>`;
    }
    
    return html;
  }

  _buildGenericData(raceData) {
    const description = this._buildDescription(raceData);
    
    return {
      name: raceData.name,
      type: 'race',
      img: 'icons/svg/mystery-man.svg',
      system: {
        description: {
          value: description
        }
      }
    };
  }

  _showStatus(type, message) {
    const status = this.element.find('.race-importer-status');
    status.removeClass('success error info').addClass(type).addClass('visible');
    status.text(message);
    
    if (type === 'success' || type === 'error') {
      setTimeout(() => {
        status.removeClass('visible');
      }, 5000);
    }
  }
}
