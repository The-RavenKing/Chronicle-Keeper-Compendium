import { RaceImporterApp } from './race-importer-app.js';

// 1. INITIALIZATION & SETTINGS
Hooks.once('init', () => {
  console.log('Chronicle Keeper | Initializing');
  
  // Register module settings
  game.settings.register('chronicle-keeper-compendium', 'ollamaUrl', {
    name: 'Ollama Server URL',
    hint: 'The URL where your Ollama server is running (e.g., http://localhost:11434)',
    scope: 'world',
    config: false,
    type: String,
    default: 'http://localhost:11434'
  });
  
  game.settings.register('chronicle-keeper-compendium', 'ollamaModel', {
    name: 'Ollama Model',
    hint: 'The Ollama model to use for parsing (e.g., llama3, mistral, etc.)',
    scope: 'world',
    config: false,
    type: String,
    default: 'llama3'
  });
  
  // Hidden settings for Compendium Linking
  game.settings.register('chronicle-keeper-compendium', 'targetCompendium', {
    scope: 'world', config: false, type: String, default: ''
  });
  
  game.settings.register('chronicle-keeper-compendium', 'traitsCompendium', {
    scope: 'world', config: false, type: String, default: ''
  });
  
  game.settings.register('chronicle-keeper-compendium', 'systemType', {
    name: 'Game System',
    scope: 'world',
    config: false,
    type: String,
    default: 'dnd5e',
    choices: { 'dnd5e': 'D&D 5th Edition', 'pf2e': 'Pathfinder 2nd Edition', 'generic': 'Generic/Other' }
  });

  // Settings Menu Button
  game.settings.register('chronicle-keeper-compendium', 'openButton', {
    name: "Open Race Importer",
    hint: "Click to open the Race Importer",
    scope: "world",
    config: true,
    type: Boolean,
    default: false,
    onChange: value => {
      if (value) {
        new RaceImporterApp().render(true);
        game.settings.set('chronicle-keeper-compendium', 'openButton', false);
      }
    }
  });
});

// 2. COMPENDIUM SIDEBAR BUTTON
Hooks.on('renderCompendiumDirectory', (app, html) => {
  if (!game.user.isGM) return;

  const $html = $(html);
  $html.find('.race-importer-sidebar-button').remove();
  
  const $button = $(`
    <button class="race-importer-sidebar-button">
      <i class="fas fa-download"></i> Import Race/Species
    </button>
  `);
  
  $button.on('click', (e) => {
    e.preventDefault();
    new RaceImporterApp().render(true);
  });
  
  const $headerActions = $html.find('.header-actions');
  const $createButton = $html.find('button[data-action="createCompendium"]');
  
  if ($headerActions.length > 0) {
    $headerActions.prepend($button);
  } else if ($createButton.length > 0) {
    $createButton.before($button);
  } else {
    $html.find('.directory-list').before($button);
  }
});

// 3. READY HOOK
Hooks.once('ready', async () => {
  console.log('Chronicle Keeper | Ready');

  if (game.user.isGM) {
    await setupCompendiumStructure();
  }
  
  // Global API
  const module = game.modules.get('chronicle-keeper-compendium');
  if (module) {
    module.api = {
      open: () => new RaceImporterApp().render(true),
      RaceImporterApp: RaceImporterApp
    };
    window.RaceImporter = module.api;
  }
});

async function setupCompendiumStructure() {
  try {
    const folderName = "Chronicle Keeper";
    
    let folder = game.folders.find(f => f.type === "Compendium" && f.name === folderName);
    if (!folder) {
      folder = await Folder.create({ name: folderName, type: "Compendium", color: "#8b4513" });
    }

    const speciesPackName = "chronicle-keeper-species";
    let speciesPack = game.packs.get(`world.${speciesPackName}`);
    if (!speciesPack) {
      speciesPack = await CompendiumCollection.createCompendium({
        label: "Species", name: speciesPackName, type: "Item", package: "world"
      });
    }
    if (folder && speciesPack.folder?.id !== folder.id) await speciesPack.configure({ folder: folder.id });

    const traitsPackName = "chronicle-keeper-traits";
    let traitsPack = game.packs.get(`world.${traitsPackName}`);
    if (!traitsPack) {
      traitsPack = await CompendiumCollection.createCompendium({
        label: "Traits", name: traitsPackName, type: "Item", package: "world"
      });
    }
    if (folder && traitsPack.folder?.id !== folder.id) await traitsPack.configure({ folder: folder.id });

    const currentSpeciesTarget = game.settings.get('chronicle-keeper-compendium', 'targetCompendium');
    if (!currentSpeciesTarget && speciesPack) {
      await game.settings.set('chronicle-keeper-compendium', 'targetCompendium', speciesPack.collection);
    }
    const currentTraitsTarget = game.settings.get('chronicle-keeper-compendium', 'traitsCompendium');
    if (!currentTraitsTarget && traitsPack) {
      await game.settings.set('chronicle-keeper-compendium', 'traitsCompendium', traitsPack.collection);
    }
    
  } catch (error) {
    console.error('Chronicle Keeper | Compendium setup error:', error);
  }
}