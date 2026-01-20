import { SpeciesStrategy } from './strategies/species-strategy.js';
import { ClassStrategy } from './strategies/class-strategy.js';
import { SubclassStrategy } from './strategies/subclass-strategy.js';
import { SpellStrategy } from './strategies/spell-strategy.js';
import { MonsterStrategy } from './strategies/monster-strategy.js';

export class RaceImporterApp extends Application {
  constructor(options = {}) {
    super(options);
    this.activeTab = 'text';
    
    // Initialize available strategies
    this.strategies = {
      'species': new SpeciesStrategy(),
      'class': new ClassStrategy(),
      'subclass': new SubclassStrategy(),
      'spell': new SpellStrategy(),
      'monster': new MonsterStrategy()
    };
    
    // Default to species
    this.currentStrategy = this.strategies['species'];
  }

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: 'race-importer',
      title: game.i18n.localize('RACE_IMPORTER.Title') || "Chronicle Keeper",
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
    
    // Retrieve settings
    data.ollamaUrl = game.settings.get('chronicle-keeper-compendium', 'ollamaUrl');
    data.ollamaModel = game.settings.get('chronicle-keeper-compendium', 'ollamaModel');
    data.systemType = game.settings.get('chronicle-keeper-compendium', 'systemType');
    
    // Populate the dropdown with all supported types
    data.importTypes = [
      { value: 'species', label: 'Race / Species' },
      { value: 'class', label: 'Class' },
      { value: 'subclass', label: 'Subclass' },
      { value: 'spell', label: 'Spell' },
      { value: 'monster', label: 'Monster / NPC' }
    ];
    
    // Get list of Item compendiums for the settings dropdown
    data.compendiums = game.packs
      .filter(pack => pack.documentName === 'Item')
      .map(pack => ({
        id: pack.collection,
        name: pack.title
      }));
    
    data.selectedCompendium = game.settings.get('chronicle-keeper-compendium', 'targetCompendium');
    data.activeTab = this.activeTab;
    
    return data;
  }

  activateListeners(html) {
    super.activateListeners(html);
    
    // Tab Navigation
    html.find('.race-importer-tab').click(this._onTabClick.bind(this));
    
    // Strategy Switcher (Dropdown)
    html.find('#import-type-select').change(this._onTypeChange.bind(this));

    // Main Action Buttons
    html.find('#import-text-btn').click(this._onImportFromText.bind(this));
    html.find('#test-connection-btn').click(this._onTestConnection.bind(this));
    
    // Settings Changes
    html.find('#ollama-url').change(this._onSettingChange.bind(this));
    html.find('#ollama-model').change(this._onSettingChange.bind(this));
    html.find('#target-compendium').change(this._onSettingChange.bind(this));
  }

  /* -------------------------------------------- */
  /* Event Handlers                              */
  /* -------------------------------------------- */

  _onTabClick(event) {
    event.preventDefault();
    const tab = $(event.currentTarget).data('tab');
    this.activeTab = tab;
    const html = this.element;
    
    // Visual tab switching
    html.find('.race-importer-tab').removeClass('active');
    html.find(`.race-importer-tab[data-tab="${tab}"]`).addClass('active');
    html.find('.race-importer-content').removeClass('active');
    html.find(`#${tab}-content`).addClass('active');
  }

  _onTypeChange(event) {
    const type = event.currentTarget.value;
    if (this.strategies[type]) {
      this.currentStrategy = this.strategies[type];
      console.log(`Chronicle Keeper | Switched strategy to: ${type}`);
    } else {
      console.error(`Chronicle Keeper | Unknown strategy type: ${type}`);
    }
  }

  async _onImportFromText(event) {
    event.preventDefault();
    const content = this.element.find('#race-text').val().trim();
    if (!content) { 
      ui.notifications.warn('Please enter information to import.'); 
      return; 
    }
    
    const button = $(event.currentTarget);
    button.prop('disabled', true);
    
    try {
      this._showStatus('info', `Parsing ${this.currentStrategy.key} with Ollama AI...`);
      
      // 1. Get the specific prompt for the current strategy
      const prompt = this.currentStrategy.getPrompt(content);
      
      // 2. Send prompt to Ollama (Generic logic)
      const jsonData = await this._callOllama(prompt);
      
      // 3. Validate data using the strategy's rules
      const validatedData = this.currentStrategy.validate(jsonData);
      
      // 4. Create the items in Foundry using the strategy's logic
      this._showStatus('info', "Creating Foundry document...");
      await this.currentStrategy.create(validatedData);
      
      this._showStatus('success', `Done!`);
      // ui.notifications.info is handled inside some strategies, but good to have a fallback here if needed
      if (!validatedData.suppressNotification) { 
          ui.notifications.info(`✅ Successfully imported ${validatedData.name}!`);
      }
      
    } catch (error) {
      console.error('Import error:', error);
      ui.notifications.error(`Import Error: ${error.message}`);
      this._showStatus('error', `Error: ${error.message}`);
    } finally {
      button.prop('disabled', false);
    }
  }

  async _onTestConnection(event) {
    event.preventDefault();
    const button = $(event.currentTarget);
    const ollamaUrl = game.settings.get('chronicle-keeper-compendium', 'ollamaUrl');
    
    button.prop('disabled', true);
    ui.notifications.info('Testing connection to Ollama...');
    
    try {
      const response = await fetch(`${ollamaUrl}/api/tags`);
      if (response.ok) {
        ui.notifications.info("✅ Successfully connected to Ollama!");
        this._showStatus('success', "Connected!");
      } else {
        ui.notifications.warn("⚠️ Connected, but Ollama returned an error.");
      }
    } catch (error) {
      ui.notifications.error(`❌ Could not connect to Ollama at ${ollamaUrl}`);
      this._showStatus('error', "Connection failed");
    } finally {
      button.prop('disabled', false);
    }
  }

  async _onSettingChange(event) {
    const setting = $(event.currentTarget).attr('id');
    const value = $(event.currentTarget).val();
    const settingMap = {
      'ollama-url': 'ollamaUrl',
      'ollama-model': 'ollamaModel',
      'target-compendium': 'targetCompendium'
    };
    
    if (settingMap[setting]) {
      await game.settings.set('chronicle-keeper-compendium', settingMap[setting], value);
    }
  }

  /* -------------------------------------------- */
  /* Internal Methods                            */
  /* -------------------------------------------- */

  async _callOllama(prompt) {
    const ollamaUrl = game.settings.get('chronicle-keeper-compendium', 'ollamaUrl');
    const ollamaModel = game.settings.get('chronicle-keeper-compendium', 'ollamaModel');
    
    const response = await fetch(`${ollamaUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        model: ollamaModel, 
        prompt: prompt, 
        stream: false, 
        format: 'json' 
      })
    });
    
    if (!response.ok) throw new Error(`Ollama API error: ${response.status}`);
    const result = await response.json();
    
    try {
      return JSON.parse(result.response);
    } catch (e) {
      throw new Error("Ollama returned invalid JSON. Try a larger model.");
    }
  }

  _showStatus(type, message) {
    const status = this.element.find('.race-importer-status');
    status.removeClass('success error info').addClass(type).addClass('visible');
    status.text(message);
    if (type !== 'info') setTimeout(() => status.removeClass('visible'), 5000);
  }
}