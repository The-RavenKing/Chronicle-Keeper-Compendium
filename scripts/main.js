import { RaceImporterApp } from './race-importer-app.js';

// 1. INITIALIZATION & SETTINGS
Hooks.once('init', () => {
  const ID = 'chronicle-keeper-compendium';
  console.log('Chronicle Keeper | Initializing');
  
  // -- Server Settings --
  game.settings.register(ID, 'ollamaUrl', {
    name: 'Ollama Server URL',
    hint: 'The URL where your Ollama server is running (e.g., http://localhost:11434)',
    scope: 'world',
    config: false,
    type: String,
    default: 'http://localhost:11434'
  });
  
  game.settings.register(ID, 'ollamaModel', {
    name: 'Ollama Model',
    hint: 'The Ollama model to use for parsing (e.g., llama3, mistral, etc.)',
    scope: 'world',
    config: false,
    type: String,
    default: 'llama3'
  });
  
  // -- Target Compendiums (Defaults) --
  // We keep these generic so the strategies can fallback to them if needed
  game.settings.register(ID, 'targetCompendium', {
    scope: 'world', config: false, type: String, default: ''
  });
  
  game.settings.register(ID, 'traitsCompendium', {
    scope: 'world', config: false, type: String, default: ''
  });
  
  // -- System --
  game.settings.register(ID, 'systemType', {
    name: 'Game System',
    scope: 'world',
    config: false,
    type: String,
    default: 'dnd5e',
    choices: { 'dnd5e': 'D&D 5th Edition', 'pf2e': 'Pathfinder 2nd Edition', 'generic': 'Generic/Other' }
  });

  // -- Sidebar Button Settings --
  game.settings.register(ID, 'openButton', {
    name: "Open Race Importer",
    hint: "Click to open the Race Importer",
    scope: "world",
    config: true,
    type: Boolean,
    default: false,
    onChange: value => {
      if (value) {
        new RaceImporterApp().render(true);
        game.settings.set(ID, 'openButton', false);
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
      <i class="fas fa-download"></i> Import Content
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

// 3. READY HOOK - Setup Compendiums
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
    const ID = 'chronicle-keeper-compendium';
    const folderName = "Chronicle Keeper";
    
    // 1. Create the Folder to organize them
    let folder = game.folders.find(f => f.type === "Compendium" && f.name === folderName);
    if (!folder) {
      folder = await Folder.create({ name: folderName, type: "Compendium", color: "#8b4513" });
    }

    // 2. Define ALL Compendiums needed
    const packs = [
      // Race / Species
      { name: "chronicle-keeper-species", label: "Species", type: "Item" },
      { name: "chronicle-keeper-traits", label: "Species Traits", type: "Item" },
      
      // Classes & Subclasses
      { name: "chronicle-keeper-classes", label: "Classes", type: "Item" },
      { name: "chronicle-keeper-subclasses", label: "Subclasses", type: "Item" },
      { name: "chronicle-keeper-features", label: "Class Features", type: "Item" }, // <-- For Feats inside classes
      
      // Spells
      { name: "chronicle-keeper-spells", label: "Spells", type: "Item" },
      
      // Items (Magical & Mundane)
      { name: "chronicle-keeper-items", label: "Items & Equipment", type: "Item" },
      
      // Monsters (Actors)
      { name: "chronicle-keeper-monsters", label: "Monsters (NPCs)", type: "Actor" } // <-- Important: Type is Actor
    ];

    // 3. Loop and Create
    for (const p of packs) {
      const packId = `world.${p.name}`;
      let pack = game.packs.get(packId);
      
      if (!pack) {
        console.log(`Chronicle Keeper | Creating Compendium: ${p.label}`);
        pack = await CompendiumCollection.createCompendium({
          label: p.label,
          name: p.name,
          type: p.type,
          package: "world"
        });
      }
      
      // Organize into the folder
      if (folder && pack.folder?.id !== folder.id) {
        await pack.configure({ folder: folder.id });
      }
    }

    // 4. Ensure Default Links exist
    // We default to Species just to have *something* selected, but the user can change it
    const currentTarget = game.settings.get(ID, 'targetCompendium');
    if (!currentTarget) {
      await game.settings.set(ID, 'targetCompendium', `world.chronicle-keeper-species`);
    }
    
    const currentTraits = game.settings.get(ID, 'traitsCompendium');
    if (!currentTraits) {
      await game.settings.set(ID, 'traitsCompendium', `world.chronicle-keeper-traits`);
    }
    
  } catch (error) {
    console.error('Chronicle Keeper | Compendium setup error:', error);
  }
}