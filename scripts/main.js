import { RaceImporterApp } from './race-importer-app.js';

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
  
  game.settings.register('race-importer-ollama', 'targetCompendium', {
    name: 'Species Compendium',
    hint: 'The compendium where imported species will be stored',
    scope: 'world',
    config: false,
    type: String,
    default: ''
  });
  
  game.settings.register('race-importer-ollama', 'traitsCompendium', {
    name: 'Traits Compendium',
    hint: 'The compendium where racial traits will be stored (leave empty to use same as species)',
    scope: 'world',
    config: false,
    type: String,
    default: ''
  });
  
  game.settings.register('race-importer-ollama', 'systemType', {
    name: 'Game System',
    hint: 'The game system to format races for',
    scope: 'world',
    config: false,
    type: String,
    default: 'dnd5e',
    choices: {
      'dnd5e': 'D&D 5th Edition',
      'pf2e': 'Pathfinder 2nd Edition',
      'generic': 'Generic/Other'
    }
  });
});

// Add a console command for easy access
window.RaceImporter = {
  open: () => new RaceImporterApp().render(true),
  app: RaceImporterApp
};

Hooks.once('ready', async () => {
  console.log('Race Importer | Ready');
  
  // Store reference for other code to access
  game.modules.get('race-importer-ollama').api = {
    open: () => new RaceImporterApp().render(true),
    RaceImporterApp: RaceImporterApp
  };
  
  // Create the macro automatically if it doesn't exist (only for GMs)
  if (game.user.isGM) {
    // Wait a bit for everything to initialize
    setTimeout(async () => {
      // Check if macro already exists
      const existingMacro = game.macros.find(m => 
        m.name === "Race Importer" && 
        (m.command.includes("RaceImporterApp") || m.command.includes("RaceImporter"))
      );
      
      if (!existingMacro) {
        try {
          const macro = await Macro.create({
            name: "Race Importer",
            type: "script",
            img: "icons/svg/book.svg",
            command: "game.modules.get('race-importer-ollama').api.open();",
            folder: null,
            sort: 0,
            ownership: {
              default: 0,
              [game.user.id]: 3
            },
            flags: {
              "race-importer-ollama": {
                auto_created: true,
                version: "1.3.1"
              }
            }
          });
          
          console.log('Race Importer | Created macro automatically:', macro.name);
          ui.notifications.info("Race Importer: A macro has been added to your Macro Directory. Drag it to your hotbar for easy access!");
        } catch (error) {
          console.error('Race Importer | Could not create macro:', error);
          console.log('Race Importer | You can manually create a macro with this command:');
          console.log("game.modules.get('race-importer-ollama').api.open();");
        }
      } else {
        console.log('Race Importer | Macro already exists:', existingMacro.name);
      }
    }, 2000); // Wait 2 seconds for everything to be ready
  }
  
  // Add button to compendium directory when it renders
  Hooks.on('renderCompendiumDirectory', (app, html) => {
    console.log('Race Importer | Compendium Directory rendered, adding button');
    
    // Remove any existing button first
    html.find('.race-importer-sidebar-button').remove();
    
    // Create the import button
    const button = $(`
      <button class="race-importer-sidebar-button">
        <i class="fas fa-download"></i> Import Race/Species
      </button>
    `);
    
    // Add click handler
    button.on('click', (e) => {
      e.preventDefault();
      console.log('Race Importer | Button clicked, opening app');
      new RaceImporterApp().render(true);
    });
    
    // Try multiple insertion points
    const header = html.find('.directory-header');
    const headerActions = html.find('.header-actions');
    const createButton = html.find('button[data-action="createCompendium"]');
    
    if (headerActions.length > 0) {
      console.log('Race Importer | Adding to header-actions');
      headerActions.prepend(button);
    } else if (createButton.length > 0) {
      console.log('Race Importer | Adding before create button');
      createButton.before(button);
    } else if (header.length > 0) {
      console.log('Race Importer | Adding to directory-header');
      header.append(button);
    } else {
      console.log('Race Importer | Adding to top of directory');
      html.find('.directory-list').before(button);
    }
    
    console.log('Race Importer | Button added successfully');
  });
  
  // Also add to the game settings/tools menu as backup
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
  
  console.log('Race Importer | Loaded. Use RaceImporter.open() or game.modules.get("race-importer-ollama").api.open() to open the importer.');
});

// Add a console command for easy access
window.RaceImporter = {
  open: () => new RaceImporterApp().render(true)
};

console.log('Race Importer | Loaded. Use RaceImporter.open() to open the importer.');
