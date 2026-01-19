# Troubleshooting Guide

Complete solutions for common issues with the Race Importer module.

## Table of Contents

1. [Ollama Connection Issues](#ollama-connection-issues)
2. [Import Failures](#import-failures)
3. [Data Quality Issues](#data-quality-issues)
4. [Performance Issues](#performance-issues)
5. [Foundry Integration Issues](#foundry-integration-issues)
6. [URL Fetching Issues](#url-fetching-issues)

---

## Ollama Connection Issues

### ❌ "Could not connect to Ollama"

**Symptoms:**
- Error message when testing connection
- Import fails immediately
- Status shows Ollama error

**Solutions:**

**1. Check if Ollama is Running**
```bash
# Visit in browser:
http://localhost:11434

# You should see: "Ollama is running"
```

**2. Start Ollama Manually**
```bash
# On most systems:
ollama serve

# Or just run a model:
ollama run llama3.1
```

**3. Check Ollama URL in Settings**
- Default should be: `http://localhost:11434`
- No trailing slash
- Include `http://`

**4. Firewall Issues**
```bash
# Windows: Allow Ollama through firewall
# Mac: Check System Preferences > Security
# Linux: Check iptables/ufw settings
```

**5. Port Already in Use**
```bash
# Change Ollama port:
export OLLAMA_PORT=11435
ollama serve

# Update module settings to: http://localhost:11435
```

### ❌ "Model not found"

**Solutions:**

**1. Check Installed Models**
```bash
ollama list
```

**2. Install the Model**
```bash
# If model not listed:
ollama run llama3.1
```

**3. Check Model Name in Settings**
- Should match exactly: `llama3.1`
- Not: `llama3` or `llama-3.1`
- Case-sensitive on Linux

**4. Pull Model Manually**
```bash
ollama pull llama3.1
```

---

## Import Failures

### ❌ "Failed to parse with Ollama"

**Symptoms:**
- Import starts but fails during parsing
- Status shows parsing error
- No race created

**Solutions:**

**1. Content Too Long**
```bash
# Use a smaller excerpt
# Limit to 2000-3000 words
# Focus on the race description section
```

**2. Try Different Model**
```bash
# Some models are better at parsing
ollama run qwen2.5:14b
# Update model in settings
```

**3. Check Content Quality**
- Remove advertisements/navigation
- Keep only race-relevant text
- Remove excessive formatting

**4. Add More Context**
```text
# If content is too minimal, add structure:
"This is a race for D&D 5e:

[paste content here]"
```

### ❌ "Validation Error"

**Symptoms:**
- Ollama responds but data is rejected
- Console shows validation error
- No race created

**Solutions:**

**1. Check Console for Details**
```javascript
// Press F12 and look for:
"Missing race name"
"Invalid JSON from Ollama"
```

**2. Retry with More Detail**
- Provide complete race information
- Include at least name and description
- Add ability scores if available

**3. Manual Editing**
```javascript
// In console after error:
RaceImporter._lastResponse
// See what Ollama returned
```

### ❌ "No compendium selected"

**Solutions:**

**1. Select Compendium**
- Go to Settings tab
- Choose from dropdown
- Must be an Item compendium

**2. Create New Compendium**
- In Foundry: Compendium tab
- Create Compendium
- Type: Item
- Select it in module settings

**3. Check Permissions**
- Must be GM
- World must allow compendium creation
- Check module permissions

---

## Data Quality Issues

### ⚠️ Imported race is missing information

**Solutions:**

**1. Improve Source Quality**
- Use more detailed source text
- Include all sections
- Format clearly

**2. Use Better Model**
```bash
# Switch to more accurate model:
ollama run qwen2.5:14b
```

**3. Manual Review**
- Always review imported races
- Edit in Foundry after import
- Add missing details manually

**4. Provide Structured Input**
```text
# Use clear headers:
Race Name: Dwarf
Ability Scores: Constitution +2
Size: Medium
Speed: 25 feet
Traits:
- Darkvision: Can see in darkness
- Dwarven Resilience: Resistant to poison
```

### ⚠️ Wrong ability scores or numbers

**Solutions:**

**1. Check Source Formatting**
- Use "+2" format, not "2" or "plus 2"
- Spell out numbers consistently
- Be explicit: "Constitution increases by 2"

**2. Verify After Import**
- Always check the created race
- Edit any incorrect values
- Report patterns to improve prompts

**3. Use Explicit Format**
```text
Ability Score Increase: Your Strength score increases by 2, and your Charisma score increases by 1.
```

### ⚠️ Traits not properly formatted

**Solutions:**

**1. Review in Foundry**
- Edit the race item
- Check traits section
- Reformat if needed

**2. Provide Clear Trait Structure**
```text
Darkvision: You can see in dim light within 60 feet as if it were bright light.

Keen Senses: You have proficiency in the Perception skill.
```

---

## Performance Issues

### 🐌 Import takes too long

**Solutions:**

**1. Use Faster Model**
```bash
# 3B models are much faster:
ollama run llama3.2
```

**2. Check System Resources**
```bash
# Monitor while importing:
# - CPU usage should be high
# - Ollama should be using resources
# - If not, restart Ollama
```

**3. Reduce Content Length**
- Paste only relevant sections
- Remove fluff/lore
- Focus on mechanical details

**4. Close Other Applications**
- Free up RAM
- Close browser tabs
- Stop background processes

### 🐌 Ollama uses too much memory

**Solutions:**

**1. Use Smaller Model**
```bash
ollama rm llama3.1:70b
ollama run llama3.2
```

**2. Configure Ollama Memory**
```bash
# Limit context window:
export OLLAMA_NUM_CTX=2048
ollama serve
```

**3. Restart Ollama**
```bash
# Kill and restart:
killall ollama
ollama serve
```

---

## Foundry Integration Issues

### ❌ Race appears but is empty

**Solutions:**

**1. Check System Compatibility**
- Verify you selected correct system in settings
- D&D 5e requires dnd5e system
- Generic works with any system

**2. Update System**
- Make sure game system is current
- Check system compatibility
- Try "generic" system type

**3. Review Item Structure**
```javascript
// In console:
game.items.getName("RaceName")
// Check if data exists
```

### ❌ Can't find imported race

**Solutions:**

**1. Refresh Compendium**
- Right-click compendium
- Click "Refresh"
- Look again

**2. Check Correct Compendium**
- Verify selected compendium in settings
- Look in all Item compendiums
- Search by name

**3. Check Console for Errors**
```javascript
// Press F12, look for:
"Permission denied"
"Creation failed"
```

### ❌ Duplicate races created

**Solutions:**

**1. Check Before Importing**
- Search compendium first
- Delete duplicates manually
- Import only once per race

**2. Name Conflicts**
- Each import creates new item
- Even if same name
- Manually delete extras

---

## URL Fetching Issues

### ❌ "Failed to fetch URL"

**Symptoms:**
- URL fetch button fails
- CORS error in console
- Can't preview content

**Solutions:**

**1. CORS Restrictions**
```text
Most websites block cross-origin requests.
This is normal and expected.

Workaround:
1. Copy the page text manually
2. Use "From Text" tab
3. Paste and import
```

**2. Use Browser to Get Content**
```text
1. Visit the URL in your browser
2. Select all text (Ctrl+A)
3. Copy (Ctrl+C)
4. Paste in "From Text" tab
```

**3. Use Browser Extension**
```text
Install a "Copy as Markdown" extension
1. Visit the page
2. Use extension to copy
3. Paste in module
```

**4. PDF URLs**
```text
PDFs cannot be fetched directly.

Solution:
1. Open PDF
2. Copy text
3. Use "From Text" tab
```

### ⚠️ Fetched content is messy

**Solutions:**

**1. Clean Up Manually**
- Remove navigation text
- Remove ads
- Keep only race content

**2. Select Specific Section**
- Don't copy entire page
- Copy only race description
- Avoid comments/sidebars

**3. Use Reader Mode**
```text
1. Open URL in browser
2. Enable Reader Mode (F9 in Firefox)
3. Copy clean text
4. Paste in module
```

---

## General Debugging

### Check Console Logs

```javascript
// Press F12 in Foundry
// Look for errors in red
// Check for:
"Race Importer |" messages
```

### Enable Debug Mode

```javascript
// In browser console:
CONFIG.debug.hooks = true

// See all Foundry hooks
```

### Test Ollama Directly

```bash
# Test if Ollama works:
curl http://localhost:11434/api/tags

# Should return list of models
```

### Check Module Files

```bash
# Verify module is installed:
ls "FoundryVTT/Data/modules/race-importer-ollama"

# Should see:
# - module.json
# - scripts/
# - templates/
# - styles/
```

### Reset Settings

```javascript
// In Foundry console:
game.settings.set('race-importer-ollama', 'ollamaUrl', 'http://localhost:11434')
game.settings.set('race-importer-ollama', 'ollamaModel', 'llama3.1')
```

---

## Still Having Issues?

### Collect Information

Before asking for help, collect:

1. **Error messages** (exact text)
2. **Console logs** (F12 → Console)
3. **Module version** (from module.json)
4. **Foundry version**
5. **Game system** and version
6. **Ollama model** being used
7. **Steps to reproduce**

### Common Solutions Checklist

- [ ] Ollama is running (`http://localhost:11434`)
- [ ] Model is installed (`ollama list`)
- [ ] Compendium is selected
- [ ] You are the GM
- [ ] Module is enabled
- [ ] Settings are correct
- [ ] Foundry is up to date
- [ ] No console errors (F12)

### Quick Reset

If all else fails:

```bash
# 1. Restart Ollama
killall ollama
ollama serve

# 2. Reload Foundry (F5)

# 3. Try again with simple race text
```

---

## Success Indicators

You know it's working when:

✅ Test Connection shows "Successfully connected"
✅ Status shows "Processing..." then "Success"
✅ New race appears in compendium
✅ Race has data when opened
✅ No errors in console (F12)

---

## Prevention Tips

**Before Importing:**
1. Test connection first
2. Select compendium
3. Use example text to test
4. Verify settings
5. Start with simple races

**During Import:**
1. Wait for completion
2. Don't click multiple times
3. Watch status messages
4. Check console for errors

**After Import:**
1. Review the race
2. Check all fields
3. Edit if needed
4. Save changes

---

Need more help? Check the README.md for detailed documentation.
