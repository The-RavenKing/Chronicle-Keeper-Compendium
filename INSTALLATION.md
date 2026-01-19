# Installation Guide

Complete step-by-step installation instructions.

## Prerequisites

Before installing the module, you need:

1. **Foundry VTT** (v11 or higher)
2. **Ollama** ([ollama.com](https://ollama.com))
3. An AI model downloaded in Ollama
4. 8GB+ RAM recommended
5. Internet connection (for initial setup)

## Part 1: Install Ollama

### Windows

1. Download from [ollama.com/download](https://ollama.com/download)
2. Run the installer
3. Ollama will start automatically
4. Open Command Prompt and run:
   ```cmd
   ollama run llama3.1
   ```
5. Wait for download (about 4-5 GB)
6. You should see a prompt after download completes

### macOS

1. Download from [ollama.com/download](https://ollama.com/download)
2. Open the .dmg file
3. Drag Ollama to Applications
4. Launch Ollama from Applications
5. Open Terminal and run:
   ```bash
   ollama run llama3.1
   ```
6. Wait for download
7. You should see a prompt after completion

### Linux

1. Open terminal
2. Run the installation command:
   ```bash
   curl -fsSL https://ollama.com/install.sh | sh
   ```
3. After installation:
   ```bash
   ollama run llama3.1
   ```
4. Wait for download
5. Ollama will start automatically on boot

### Verify Ollama Installation

Open a web browser and visit:
```
http://localhost:11434
```

You should see: **"Ollama is running"**

If not, start Ollama:
```bash
ollama serve
```

## Part 2: Install the Module

### Method 1: Manual Installation (Recommended)

1. **Download the Module**
   - Download the `race-importer-ollama` folder
   - Or download as ZIP and extract

2. **Locate Foundry Data Folder**
   
   **Windows:**
   ```
   %localappdata%\FoundryVTT\Data\modules
   ```
   
   **macOS:**
   ```
   ~/Library/Application Support/FoundryVTT/Data/modules
   ```
   
   **Linux:**
   ```
   ~/.local/share/FoundryVTT/Data/modules
   ```

3. **Copy Module**
   - Copy the `race-importer-ollama` folder
   - Paste into the `modules` folder
   - The path should be: `.../modules/race-importer-ollama/module.json`

4. **Restart Foundry VTT**
   - Close Foundry completely
   - Relaunch Foundry VTT

### Method 2: Via Manifest URL (When Available)

1. Open Foundry VTT
2. Go to "Add-on Modules"
3. Click "Install Module"
4. Paste manifest URL in the field
5. Click "Install"
6. Wait for installation

## Part 3: Enable the Module

1. **Launch Your World**
   - Open or create a world
   - Must be using D&D 5e or compatible system

2. **Enable Module**
   - Click "Manage Modules"
   - Find "Race Importer with Ollama"
   - Check the checkbox
   - Click "Save Module Settings"

3. **Verify Installation**
   - Go to Compendium tab
   - You should see "Import Race/Species" button
   - Or press F12 and type: `RaceImporter.open()`

## Part 4: Initial Configuration

1. **Open the Importer**
   - Click "Import Race/Species" button
   - Or use `RaceImporter.open()` in console

2. **Go to Settings Tab**

3. **Configure Ollama Settings**
   - **Ollama URL**: `http://localhost:11434` (default)
   - **Ollama Model**: `llama3.1` (or whichever you installed)
   - **Game System**: Select your system (e.g., "D&D 5th Edition")

4. **Test Connection**
   - Click "Test Connection" button
   - Should show: "Successfully connected to Ollama!"
   - If not, see [Troubleshooting](#troubleshooting)

5. **Select Compendium**
   - Create a new compendium (if needed):
     - Go to Compendium tab in Foundry
     - Click "Create Compendium"
     - Name: "Imported Races"
     - Type: "Item"
     - Create
   - Return to Race Importer
   - Select your compendium from dropdown

6. **Save Settings**
   - Settings auto-save on change
   - Verify selections are saved

## Part 5: First Import Test

1. **Go to "From Text" Tab**

2. **Paste Example Race**
   ```
   HALFLING
   
   Size: Small
   Speed: 25 feet
   Ability Score Increase: Dexterity +2
   
   Lucky: When you roll a 1 on attack, ability check, or saving throw, you can reroll the die.
   
   Brave: You have advantage on saving throws against being frightened.
   
   Halfling Nimbleness: You can move through the space of creatures larger than you.
   
   Languages: Common, Halfling
   ```

3. **Click "Import to Foundry"**

4. **Wait for Processing**
   - Status will show "Processing..."
   - Then "Parsing with Ollama AI..."
   - Then "Creating Foundry document..."
   - Finally "Successfully imported Halfling!"

5. **Verify Import**
   - Open your compendium
   - Find "Halfling"
   - Open it to verify data

## Troubleshooting

### Module Not Showing in Foundry

**Check:**
- Module folder is in correct location
- Folder is named `race-importer-ollama`
- `module.json` file exists in folder
- Restart Foundry completely

### Test Connection Fails

**Solutions:**

1. **Verify Ollama is Running**
   ```bash
   # Visit in browser:
   http://localhost:11434
   
   # Should see: "Ollama is running"
   ```

2. **Start Ollama**
   ```bash
   ollama serve
   ```

3. **Check Model**
   ```bash
   ollama list
   
   # Should show llama3.1 or similar
   ```

4. **Reinstall Model**
   ```bash
   ollama pull llama3.1
   ```

### Import Fails

**Check:**
- Ollama is running
- Model name is correct
- Compendium is selected
- You are the GM
- Content is valid race data

See [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for detailed help.

## System Requirements

### Minimum (Will Work)
- **CPU**: 2-4 cores
- **RAM**: 8 GB
- **Storage**: 10 GB free
- **OS**: Windows 10, macOS 11, Ubuntu 20.04+

### Recommended (Smooth Experience)
- **CPU**: 4-8 cores
- **RAM**: 16 GB
- **Storage**: 20 GB free
- **OS**: Windows 11, macOS 12+, Ubuntu 22.04+

### Optional (Best Performance)
- **CPU**: 8+ cores
- **RAM**: 32 GB
- **GPU**: Not required but helps
- **SSD**: Faster than HDD

## Uninstallation

### Remove Module

1. Close Foundry VTT
2. Navigate to modules folder
3. Delete `race-importer-ollama` folder
4. Restart Foundry

### Remove Ollama (Optional)

**Windows:**
- Control Panel → Uninstall Programs → Ollama

**macOS:**
```bash
rm -rf /Applications/Ollama.app
rm -rf ~/.ollama
```

**Linux:**
```bash
sudo systemctl stop ollama
sudo systemctl disable ollama
sudo rm /usr/local/bin/ollama
rm -rf ~/.ollama
```

## Next Steps

After installation:

1. Read [QUICKSTART.md](QUICKSTART.md) for quick tutorial
2. Try [EXAMPLES.md](EXAMPLES.md) for test data
3. Check [MODELS.md](MODELS.md) for model recommendations
4. Keep [TROUBLESHOOTING.md](TROUBLESHOOTING.md) handy

## Support

- **Issues**: Check TROUBLESHOOTING.md first
- **Questions**: Read README.md
- **Bugs**: Report via GitHub Issues
- **Help**: Ask in Foundry VTT Discord

## Updates

To update the module:

1. Download new version
2. Replace old folder with new
3. Restart Foundry
4. Check for breaking changes in changelog

Ollama updates:
```bash
# Update Ollama itself:
curl -fsSL https://ollama.com/install.sh | sh

# Update models:
ollama pull llama3.1
```

---

**Installation complete! Ready to import races! 🎲**
