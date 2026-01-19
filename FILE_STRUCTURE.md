# Module File Structure

Complete overview of all files in the Race Importer module.

```
race-importer-ollama/
│
├── module.json                    # Module manifest (required by Foundry)
├── LICENSE                        # MIT License
│
├── Documentation/
│   ├── README.md                  # Main documentation
│   ├── QUICKSTART.md              # 5-minute setup guide
│   ├── INSTALLATION.md            # Detailed install instructions
│   ├── TROUBLESHOOTING.md         # Problem solving guide
│   ├── EXAMPLES.md                # Example race data for testing
│   └── MODELS.md                  # Ollama model recommendations
│
├── lang/                          # Localization
│   └── en.json                    # English translations
│
├── scripts/                       # JavaScript code
│   ├── main.js                    # Module initialization
│   └── race-importer-app.js       # Main application logic
│
├── styles/                        # CSS styling
│   └── race-importer.css          # UI styles
│
└── templates/                     # HTML templates
    └── race-importer.html         # UI template
```

## File Descriptions

### Core Files

**module.json**
- Module manifest required by Foundry VTT
- Contains metadata, dependencies, and file references
- Defines compatibility and version

**LICENSE**
- MIT License for open source distribution
- Allows free use, modification, and distribution

### Documentation Files

**README.md**
- Comprehensive module documentation
- Features, usage, troubleshooting
- Main reference document

**QUICKSTART.md**
- 5-minute setup tutorial
- Bare minimum to get started
- For impatient users

**INSTALLATION.md**
- Step-by-step installation guide
- Platform-specific instructions
- Troubleshooting installation issues

**TROUBLESHOOTING.md**
- Common problems and solutions
- Debugging steps
- Error message explanations

**EXAMPLES.md**
- Sample race data for testing
- Different formatting examples
- Copy-paste ready content

**MODELS.md**
- Ollama model recommendations
- Performance comparisons
- Installation commands

### Code Files

**scripts/main.js**
- Module initialization
- Foundry hooks
- Settings registration
- UI button integration

**scripts/race-importer-app.js**
- Main application class
- UI logic and event handling
- Ollama API integration
- Race data parsing and validation
- Foundry document creation

### Styling

**styles/race-importer.css**
- Complete UI styling
- Tab system
- Form elements
- Status messages
- Responsive design

### Templates

**templates/race-importer.html**
- HTML structure for UI
- Three-tab interface (URL, Text, Settings)
- Form fields and buttons
- Handlebars template syntax

### Localization

**lang/en.json**
- English language strings
- UI labels and messages
- Error messages
- Status updates

## File Sizes (Approximate)

```
module.json              ~1 KB
LICENSE                  ~1 KB
README.md               ~15 KB
QUICKSTART.md            ~3 KB
INSTALLATION.md          ~8 KB
TROUBLESHOOTING.md      ~12 KB
EXAMPLES.md              ~5 KB
MODELS.md                ~8 KB
lang/en.json             ~2 KB
scripts/main.js          ~2 KB
scripts/race-importer-app.js  ~15 KB
styles/race-importer.css ~4 KB
templates/race-importer.html  ~4 KB

Total: ~80 KB (excluding node_modules/dependencies)
```

## Required vs Optional Files

### Required (Module Won't Work Without)
- module.json
- scripts/main.js
- scripts/race-importer-app.js
- styles/race-importer.css
- templates/race-importer.html
- lang/en.json

### Optional (Documentation)
- README.md
- QUICKSTART.md
- INSTALLATION.md
- TROUBLESHOOTING.md
- EXAMPLES.md
- MODELS.md
- LICENSE

## Customization Points

### To Change UI Appearance
Edit: `styles/race-importer.css`

### To Modify Functionality
Edit: `scripts/race-importer-app.js`

### To Add Language Support
Create: `lang/[language-code].json`
Update: `module.json` (add language entry)

### To Change Ollama Prompt
Edit: `scripts/race-importer-app.js` → `_buildOllamaPrompt()`

### To Support New Game Systems
Edit: `scripts/race-importer-app.js` → `_buildItemData()`

## Dependencies

### External (Required)
- Foundry VTT v11+
- Ollama (running locally or remotely)
- Downloaded Ollama model

### Internal (Included)
- All scripts, styles, templates included
- No npm packages required
- No build process needed

### Foundry Systems
- Works best with dnd5e
- Basic support for other systems
- Extensible for custom systems

## Installation Paths

### Windows
```
%localappdata%\FoundryVTT\Data\modules\race-importer-ollama\
```

### macOS
```
~/Library/Application Support/FoundryVTT/Data/modules/race-importer-ollama/
```

### Linux
```
~/.local/share/FoundryVTT/Data/modules/race-importer-ollama/
```

## Version Control

Recommended `.gitignore`:
```
node_modules/
.DS_Store
Thumbs.db
*.log
```

## Development Setup

No build process required!

1. Clone/download to modules folder
2. Edit files directly
3. Refresh Foundry (F5) to see changes
4. Check console (F12) for errors

## Testing Files

Use `EXAMPLES.md` for testing:
1. Copy example race text
2. Import using module
3. Verify output
4. Check for errors

## Distribution

To distribute:
1. Zip the entire folder
2. Name: `race-importer-ollama.zip`
3. Share or upload
4. Users extract to modules folder

## Updates

When updating:
1. Replace files
2. Keep user settings (auto-preserved)
3. Clear browser cache if needed
4. Check CHANGELOG for breaking changes

---

This structure keeps code organized and documentation accessible!
