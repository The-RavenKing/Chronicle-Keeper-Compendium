# Quick Start Guide

## 5-Minute Setup

### 1. Install Ollama (2 minutes)

Visit [ollama.com](https://ollama.com) and download the installer for your OS.

**Run this command after installation:**
```bash
ollama run llama3
```

This downloads the AI model (about 4GB). Wait for it to complete.

### 2. Install the Module (1 minute)

1. Download this module
2. Extract to `FoundryVTT/Data/modules/race-importer-ollama`
3. Launch Foundry VTT
4. Enable "Race Importer with Ollama" in your world

### 3. Configure (1 minute)

1. In Foundry, go to Compendium tab
2. Click "Import Race/Species" button
3. Go to Settings tab
4. Click "Test Connection" - you should see success
5. Select or create a compendium from the dropdown

### 4. Import Your First Race (1 minute)

**Option A - From URL:**
1. Go to "From URL" tab
2. Paste a URL (e.g., a D&D Beyond race page)
3. Click "Fetch from URL"
4. Click "Import to Foundry"

**Option B - From Text:**
1. Go to "From Text" tab
2. Copy race text from any source
3. Paste it in the text box
4. Click "Import to Foundry"

Done! Check your compendium for the imported race.

## Example Sources

### D&D 5e
- D&D Beyond race pages
- D&D Wiki
- Homebrew race documents

### Pathfinder 2e
- Archives of Nethys
- Pathfinder Wiki
- Homebrew ancestries

### Any System
- PDF text
- Wiki articles
- Homebrew documents
- Published content (for personal use)

## Common Issues

**"Could not connect to Ollama"**
- Make sure Ollama is running: Visit http://localhost:11434 in browser
- If not running, open terminal and run: `ollama serve`

**"No compendium selected"**
- Go to Settings tab
- Select a compendium from dropdown
- Or create a new one in Foundry first

**URL fetch failed**
- Some sites block automated requests
- Solution: Copy the text manually and use "From Text" tab

## Tips

- Use smaller models (llama3:7b) for faster imports
- Larger models (70b+) are more accurate but slower
- You can edit the imported race after creation
- Test with simple races first
- Keep Ollama running in the background

## What's Next?

- Import all your favorite races
- Share your compendium with players
- Try importing homebrew content
- Experiment with different models

**Need help? Check the full README.md**
