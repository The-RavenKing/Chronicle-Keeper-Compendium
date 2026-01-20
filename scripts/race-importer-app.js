export class RaceImporterApp extends Application {
  constructor(options = {}) {
    super(options);
    this.activeTab = 'url';
  }

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: 'race-importer',
      title: game.i18n.localize('RACE_IMPORTER.Title') || "Race Importer",
      // IMPORTANT: This path matches the new folder name
      template: 'modules/chronicle-keeper-compendium/templates/race-importer.html',
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
    
    data.ollamaUrl = game.settings.get('chronicle-keeper-compendium', 'ollamaUrl');
    data.ollamaModel = game.settings.get('chronicle-keeper-compendium', 'ollamaModel');
    data.systemType = game.settings.get('chronicle-keeper-compendium', 'systemType');
    
    data.compendiums = game.packs
      .filter(pack => pack.documentName === 'Item')
      .map(pack => ({
        id: pack.collection,
        name: pack.title
      }));
    
    data.selectedCompendium = game.settings.get('chronicle-keeper-compendium', 'targetCompendium');
    data.selectedTraitsCompendium = game.settings.get('chronicle-keeper-compendium', 'traitsCompendium');
    data.activeTab = this.activeTab;
    
    return data;
  }

  activateListeners(html) {
    super.activateListeners(html);
    html.find('.race-importer-tab').click(this._onTabClick.bind(this));
    html.find('#fetch-url-btn').click(this._onFetchURL.bind(this));
    html.find('#import-url-btn').click(this._onImportFromURL.bind(this));
    html.find('#import-text-btn').click(this._onImportFromText.bind(this));
    html.find('#test-connection-btn').click(this._onTestConnection.bind(this));
    html.find('#relink-compendiums-btn').click(this._onRelinkCompendiums.bind(this));
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
      await game.settings.set('chronicle-keeper-compendium', settingMap[setting], value);
    }
  }

  async _onRelinkCompendiums(event) {
    event.preventDefault();
    const btn = $(event.currentTarget);
    const icon = btn.find('i');
    btn.prop('disabled', true);
    icon.addClass('fa-spin');
    
    try {
      const speciesPack = game.packs.get("world.chronicle-keeper-species");
      const traitsPack = game.packs.get("world.chronicle-keeper-traits");
      let found = 0;

      if (speciesPack) {
        await game.settings.set('chronicle-keeper-compendium', 'targetCompendium', speciesPack.collection);
        found++;
      }
      if (traitsPack) {
        await game.settings.set('chronicle-keeper-compendium', 'traitsCompendium', traitsPack.collection);
        found++;
      }

      if (found > 0) {
        ui.notifications.info(`Chronicle Keeper: Successfully relinked ${found} compendiums!`);
        this.render(true);
      } else {
        ui.notifications.warn("Chronicle Keeper: Could not find default compendiums.");
      }
    } catch (error) {
      console.error(error);
      ui.notifications.error("Error relinking compendiums.");
    } finally {
      btn.prop('disabled', false);
      icon.removeClass('fa-spin');
    }
  }

  async _onTestConnection(event) {
    event.preventDefault();
    const button = $(event.currentTarget);
    const ollamaUrl = game.settings.get('chronicle-keeper-compendium', 'ollamaUrl');
    button.prop('disabled', true);
    this._showStatus('info', 'Testing connection...');
    try {
      const response = await fetch(`${ollamaUrl}/api/tags`);
      if (response.ok) {
        this._showStatus('success', "Successfully connected to Ollama!");
      } else {
        this._showStatus('error', "Connected, but Ollama returned an error.");
      }
    } catch (error) {
      this._showStatus('error', `Could not connect to Ollama at ${ollamaUrl}`);
    } finally {
      button.prop('disabled', false);
    }
  }

  async _onFetchURL(event) {
    event.preventDefault();
    const button = $(event.currentTarget);
    const url = this.element.find('#race-url').val().trim();
    if (!url) { this._showStatus('error', 'Please enter a URL'); return; }
    button.prop('disabled', true);
    this._showStatus('info', "Fetching content...");
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
    if (!content) { this._showStatus('error', 'No content to import.'); return; }
    await this._importRace(content);
  }

  async _onImportFromText(event) {
    event.preventDefault();
    const content = this.element.find('#race-text').val().trim();
    if (!content) { this._showStatus('error', 'Please enter race information'); return; }
    await this._importRace(content);
  }

  async _fetchURL(url) {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const html = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      doc.querySelectorAll('script, style, nav, footer, header').forEach(el => el.remove());
      return doc.body.textContent || doc.body.innerText || '';
    } catch (error) {
      throw new Error(`Failed to fetch URL: ${error.message}`);
    }
  }

  async _importRace(content) {
    const button = this.element.find('button:contains("Import")');
    button.prop('disabled', true);
    try {
      this._showStatus('info', "Parsing with Ollama AI...");
      const raceData = await this._parseWithOllama(content);
      this._showStatus('info', "Creating Foundry document...");
      await this._createRaceDocument(raceData);
      this._showStatus('success', `Successfully imported ${raceData.name}!`);
    } catch (error) {
      console.error('Race import error:', error);
      this._showStatus('error', `Error: ${error.message}`);
    } finally {
      button.prop('disabled', false);
    }
  }

  async _parseWithOllama(content) {
    const ollamaUrl = game.settings.get('chronicle-keeper-compendium', 'ollamaUrl');
    const ollamaModel = game.settings.get('chronicle-keeper-compendium', 'ollamaModel');
    const systemType = game.settings.get('chronicle-keeper-compendium', 'systemType');
    const prompt = this._buildOllamaPrompt(content, systemType);
    console.log('Chronicle Keeper | Sending to Ollama...');
    try {
      const response = await fetch(`${ollamaUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: ollamaModel, prompt: prompt, stream: false, format: 'json' })
      });
      if (!response.ok) throw new Error(`Ollama API error: ${response.status}`);
      const result = await response.json();
      const jsonData = JSON.parse(result.response);
      const validated = this._validateRaceData(jsonData);
      return validated;
    } catch (error) {
      console.error('Chronicle Keeper | Parse error:', error);
      throw new Error(`Failed to parse with Ollama: ${error.message}`);
    }
  }

  _buildOllamaPrompt(content, systemType) {
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

  _validateRaceData(data) {
    if (!data.name) throw new Error('Missing race name');
    
    // SAFETY NET: Manual scan for missed skills (Fixes the "skillCount: 0" issue)
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

  async _createRaceDocument(raceData) {
    const speciesCompendiumId = game.settings.get('chronicle-keeper-compendium', 'targetCompendium');
    const traitsCompendiumId = game.settings.get('chronicle-keeper-compendium', 'traitsCompendium');
    
    if (!speciesCompendiumId) throw new Error("Species compendium not found");
    const speciesPack = game.packs.get(speciesCompendiumId);
    if (!speciesPack) throw new Error("Species compendium pack not found");
    const traitsPack = traitsCompendiumId ? game.packs.get(traitsCompendiumId) : speciesPack;
    
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
  }

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

    // LOGIC: Add Skill Choice Advancement directly to the TRAIT
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
        description: { value: this._buildDescription(raceData) },
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

  _buildDescription(data) {
    return `<p>${data.description}</p>`;
  }

  _showStatus(type, message) {
    const status = this.element.find('.race-importer-status');
    status.removeClass('success error info').addClass(type).addClass('visible');
    status.text(message);
    if (type !== 'info') setTimeout(() => status.removeClass('visible'), 5000);
  }
}