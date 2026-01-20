import { RaceImporterApp } from './race-importer-app.js';

// 1. INITIALIZATION & SETTINGS
Hooks.once('init', () => {
  console.log('Race Importer | Initializing');
  
  // Register module settings
  game.settings.register('race-importer-ollama', 'ollamaUrl', {
    name: 'Ollama Server URL',
    hint: 'The URL where your Ollama server is running (e.g., http://localhost:11434)',
    scope: 'world',
    config: false,
    type: String,
    default: 'http://localhost:11434'
  });
  
  game.settings.register('race-importer-ollama', 'ollamaModel', {
    name: 'Ollama Model',
    hint: 'The Ollama model to use for parsing (e.g., llama3, mistral, etc.)',
    scope: 'world',
    config: false,
    type: String,
    default: 'llama3'
  });
  
  // Hidden settings for Compendium Linking
  game.settings.register('race-importer-ollama', 'targetCompendium', {
    scope: 'world', config: false, type: String, default: ''
  });
  
  game.settings.register('race-importer-ollama', 'traitsCompendium', {
    scope: 'world', config: false, type: String, default: ''
  });
  
  game.settings.register('race-importer-ollama', 'systemType', {
    name: 'Game System',
    scope: 'world',
    config: false,
    type: String,
    default: 'dnd5e',
    choices: { 'dnd5e': 'D&D 5th Edition', 'pf2e': 'Pathfinder 2nd Edition', 'generic': 'Generic/Other' }
  });

  // Settings Menu Button
  game.settings.register('race-importer-ollama', 'openButton', {
    name: "Open Race Importer",
    hint: "Click to open the Race Importer",
    scope: "world",
    config: true,
    type: Boolean,
    default: false,
    onChange: value => {
      if (value) {
        new RaceImporterApp().render(true);
        game.settings.set('race-importer-ollama', 'openButton', false);
      }
    }
  });
});

// 2. COMPENDIUM SIDEBAR BUTTON (Moved OUT of 'ready' to ensure it loads)
Hooks.on('renderCompendiumDirectory', (app, html) => {
  if (!game.user.isGM) return;

  // Use jQuery wrapper
  const $html = $(html);
  $html.find('.race-importer-sidebar-button').remove();
  
  // Create button
  const $button = $(`
    <button class="race-importer-sidebar-button">
      <i class="fas fa-download"></i> Import Race/Species
    </button>
  `);
  
  $button.on('click', (e) => {
    e.preventDefault();
    new RaceImporterApp().render(true);
  });
  
  // Inject button
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

// 3. TOKEN LAYER BUTTON (Backup)
Hooks.on('getSceneControlButtons', (controls) => {
  if (!game.user.isGM) return;
  if (!Array.isArray(controls)) return;

  const tokenControls = controls.find(c => c.name === 'token');
  if (tokenControls && tokenControls.tools) {
    tokenControls.tools.push({
      name: 'race-importer',
      title: 'Import Race/Species',
      icon: 'fas fa-book-dead',
      onClick: () => new RaceImporterApp().render(true),
      button: true
    });
  }
});

// 4. READY HOOK (Compendium Setup & Macro)
Hooks.once('ready', async () => {
  console.log('Race Importer | Ready');

  // Auto-setup Compendiums
  if (game.user.isGM) {
    await setupCompendiumStructure();
  }
  
  // Global API
  game.modules.get('race-importer-ollama').api = {
    open: () => new RaceImporterApp().render(true),
    RaceImporterApp: RaceImporterApp
  };
  window.RaceImporter = game.modules.get('race-importer-ollama').api;
  
  // Create Macro
  if (game.user.isGM) {
    setTimeout(async () => {
      const existingMacro = game.macros.find(m => 
        m.name === "Race Importer" && 
        (m.command.includes("RaceImporterApp") || m.command.includes("RaceImporter"))
      );
      
      if (!existingMacro) {
        try {
          await Macro.create({
            name: "Race Importer",
            type: "script",
            img: "icons/svg/book.svg",
            command: "game.modules.get('race-importer-ollama').api.open();",
            ownership: { default: 0, [game.user.id]: 3 }
          });
          console.log('Race Importer | Created macro automatically');
        } catch (error) {
          console.error('Race Importer | Could not create macro:', error);
        }
      }
    }, 2000);
  }
});

/**
 * Creates folder and compendiums automatically, then links them.
 */
async function setupCompendiumStructure() {
  try {
    const folderName = "Chronicle Keeper";
    
    // 1. Create Folder
    let folder = game.folders.find(f => f.type === "Compendium" && f.name === folderName);
    if (!folder) {
      folder = await Folder.create({ name: folderName, type: "Compendium", color: "#8b4513" });
    }

    // 2. Ensure Compendiums
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

    // 3. Link Settings
    const currentSpeciesTarget = game.settings.get('race-importer-ollama', 'targetCompendium');
    if (!currentSpeciesTarget && speciesPack) {
      await game.settings.set('race-importer-ollama', 'targetCompendium', speciesPack.collection);
    }
    const currentTraitsTarget = game.settings.get('race-importer-ollama', 'traitsCompendium');
    if (!currentTraitsTarget && traitsPack) {
      await game.settings.set('race-importer-ollama', 'traitsCompendium', traitsPack.collection);
    }
    
  } catch (error) {
    console.error('Race Importer | Compendium setup error:', error);
  }
}