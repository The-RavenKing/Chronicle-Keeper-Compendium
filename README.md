# Race Importer with Ollama for Foundry VTT

A Foundry VTT module that uses Ollama AI to intelligently parse and import race/species data from web URLs or pasted text into your Foundry compendiums.

## Features

- 🤖 **AI-Powered Parsing**: Uses Ollama to intelligently extract race data from any format
- 🌐 **URL Import**: Fetch race information directly from web pages
- 📋 **Text Import**: Paste race data from any source (PDFs, wikis, books)
- 🎮 **Multi-System Support**: Works with D&D 5e, Pathfinder 2e, and generic systems
- 📦 **Compendium Integration**: Automatically creates properly formatted items in your compendiums
- 🎨 **User-Friendly Interface**: Clean, tabbed interface for easy use

## Prerequisites

### 1. Install Ollama

Download and install Ollama from [ollama.com](https://ollama.com)

**Installation:**
- **Windows/Mac**: Download the installer from the website
- **Linux**: Run `curl -fsSL https://ollama.com/install.sh | sh`

### 2. Download a Model

After installing Ollama, download a model (recommended: llama3):

```bash
ollama run llama3
```

Other good options:
- `ollama run mistral`
- `ollama run llama3.1`
- `ollama run qwen2.5`

### 3. Start Ollama Server

Ollama runs as a server on `http://localhost:11434` by default. On most systems, it starts automatically.

To verify it's running, open a browser and visit: `http://localhost:11434`

You should see "Ollama is running"

## Installation

### Method 1: Manual Installation

1. Download this module
2. Extract it to your Foundry `Data/modules` folder
3. The folder should be named `race-importer-ollama`
4. Restart Foundry VTT
5. Enable the module in your world

### Method 2: Manifest URL

In Foundry VTT:
1. Go to Add-on Modules
2. Click "Install Module"
3. Paste the manifest URL (when available)
4. Click "Install"

## Usage

### Opening the Importer

**The module automatically creates a macro for you!** When you first enable the module, it will:
1. Create a **"Race Importer"** macro in your Macro Directory
2. Show a notification telling you about it
3. You can drag this macro to your hotbar for one-click access

Alternative ways to open:

1. **Via Macro** (Recommended): Drag the "Race Importer" macro to your hotbar
2. **Via Sidebar**: Look for the "Import Race/Species" button in the Compendium tab
3. **Via Console**: Press F12 and type `RaceImporter.open()`

### Configuration (Settings Tab)

1. **Ollama Server URL**: Default is `http://localhost:11434`
2. **Ollama Model**: The model you downloaded (e.g., `llama3`, `mistral`)
3. **Game System**: Select your game system (D&D 5e, Pathfinder 2e, Generic)
4. **Target Compendium**: Select where to save imported races

**Important**: Test your connection using the "Test Connection" button before importing!

### Importing from URL

1. Go to the "From URL" tab
2. Enter a URL to a race page (e.g., D&D Beyond, wiki, homebrew site)
3. Click "Fetch from URL" to preview the content
4. Review the fetched text
5. Click "Import to Foundry"
6. Wait for Ollama to process and create the race

**Example URLs:**
- `https://www.dndbeyond.com/races/...`
- `https://www.d20pfsrd.com/races/...`
- Any wiki or homebrew site with race information

### Importing from Text

1. Go to the "From Text" tab
2. Copy race information from any source:
   - PDF text
   - Wiki articles
   - Homebrew documents
   - Book excerpts
3. Paste it into the text area
4. Click "Import to Foundry"

**Example Text Format:**
```
Dragonborn

Ability Score Increase: Your Strength score increases by 2, and your Charisma score increases by 1.

Age: Young dragonborn grow quickly. They walk hours after hatching, attain the size and development of a 10-year-old human child by the age of 3, and reach adulthood by 15.

Size: Dragonborn are taller and heavier than humans, standing well over 6 feet tall and averaging almost 250 pounds. Your size is Medium.

Speed: Your base walking speed is 30 feet.

Draconic Ancestry: You have draconic ancestry. Choose one type of dragon from the Draconic Ancestry table...
```

### What Gets Imported

The module intelligently extracts:

- **Name**: Race/species name
- **Description**: Full text description
- **Size**: Size category
- **Speed**: Walking, flying, swimming, climbing speeds
- **Ability Score Increases**: Stat bonuses
- **Traits**: All racial traits and features
- **Languages**: Known languages
- **Proficiencies**: Skills, weapons, armor, tools
- **Resistances/Immunities**: Damage and condition resistances
- **Senses**: Darkvision, blindsight, etc.

## How It Works

1. **Content Acquisition**: The module fetches content from URL or accepts pasted text
2. **AI Processing**: Sends content to Ollama with a structured prompt
3. **JSON Parsing**: Ollama returns structured JSON data
4. **Validation**: The module validates the data
5. **Document Creation**: Creates a properly formatted Foundry item
6. **Compendium Storage**: Saves to your selected compendium

## Supported Systems

### D&D 5th Edition (dnd5e)
- Full support for advancement system
- Ability score improvements
- Racial traits
- Standard 5e formatting

### Pathfinder 2nd Edition (pf2e)
- Basic support
- Formatted for PF2e data structure

### Generic/Other Systems
- Creates basic race items
- Works with any system that supports items

## Troubleshooting

### "Could not connect to Ollama"

**Solutions:**
1. Make sure Ollama is running: `ollama serve`
2. Check the URL in settings (default: `http://localhost:11434`)
3. Visit `http://localhost:11434` in your browser to verify
4. If using a different port, update the Ollama URL in settings

### "Failed to parse with Ollama"

**Solutions:**
1. Make sure you have a model installed: `ollama list`
2. Try a different model (llama3, mistral, etc.)
3. Check that the content is actually race-related
4. Try with simpler/cleaner text

### CORS Errors When Fetching URLs

**Solutions:**
1. Some websites block cross-origin requests
2. Use the "From Text" tab instead
3. Manually copy the content and paste it
4. Use a browser extension to fetch the content first

### Race Not Appearing in Compendium

**Solutions:**
1. Make sure you selected a compendium in Settings
2. Refresh the compendium (right-click → Refresh)
3. Check the Foundry console (F12) for errors
4. Verify the compendium allows item creation

### Ollama Using Too Much Memory

**Solutions:**
1. Use a smaller model: `ollama run llama3:7b` instead of larger models
2. Close other applications
3. Adjust Ollama settings (see Ollama documentation)

## Advanced Usage

### Custom Prompts

If you want to modify how the AI parses data, you can edit the prompt in `scripts/race-importer-app.js` in the `_buildOllamaPrompt` method.

### Supporting Other Systems

To add support for additional game systems:

1. Edit `scripts/race-importer-app.js`
2. Add a new case in `_buildItemData` method
3. Create a system-specific builder method
4. Update the system choices in `scripts/main.js`

### Running Ollama Remotely

You can run Ollama on a different machine:

1. Start Ollama with: `OLLAMA_HOST=0.0.0.0 ollama serve`
2. Update the Ollama URL in settings to point to your server
3. Example: `http://192.168.1.100:11434`

## Performance Tips

- **Model Selection**: Smaller models (7B parameters) are faster but less accurate
- **Larger models** (70B+): More accurate but slower and require more RAM
- **Recommended**: llama3:8b or mistral:7b for best speed/accuracy balance

## Privacy & Data

- All processing happens **locally** on your machine
- No data is sent to external servers (except the URL you provide)
- Ollama runs entirely offline
- Your race data never leaves your computer

## Examples

### Example 1: Importing from D&D Beyond
1. Navigate to a race page on D&D Beyond
2. Copy the URL
3. Paste in "From URL" tab
4. Click "Fetch from URL"
5. Click "Import to Foundry"

### Example 2: Importing Homebrew
1. Copy your homebrew race text from a document
2. Go to "From Text" tab
3. Paste the content
4. Click "Import to Foundry"

### Example 3: Batch Importing
1. Create a compendium for your races
2. Set it as the target in Settings
3. Import multiple races one by one
4. Share the compendium with your players

## Technical Details

### File Structure
```
race-importer-ollama/
├── module.json                 # Module manifest
├── README.md                   # This file
├── lang/
│   └── en.json                 # Localization
├── scripts/
│   ├── main.js                 # Module initialization
│   └── race-importer-app.js    # Main application
├── styles/
│   └── race-importer.css       # Styling
└── templates/
    └── race-importer.html      # UI template
```

### Dependencies
- Foundry VTT v11 or higher
- Ollama (external dependency)
- Compatible game system (tested with dnd5e)

## Contributing

Contributions are welcome! Areas for improvement:

- Additional game system support
- Better parsing accuracy
- UI enhancements
- Error handling improvements
- Support for more content types (classes, items, etc.)

## License

This module is available under the MIT License.

## Credits

- Created for the Foundry VTT community
- Uses Ollama for AI processing
- Inspired by the need for easier homebrew content importing

## Support

- Report issues on GitHub
- Join the discussion on Discord
- Check the Foundry VTT forums

## Changelog

### Version 1.0.0
- Initial release
- URL and text import
- D&D 5e support
- Basic multi-system support
- Ollama integration

## Roadmap

Planned features:
- [ ] Class importer
- [ ] Monster/creature importer
- [ ] Spell importer
- [ ] Item importer
- [ ] Batch import from multiple URLs
- [ ] Image extraction and import
- [ ] Template system for custom parsing
- [ ] Support for more game systems

---

**Enjoy importing races with AI! 🎲🤖**
