# Update Guide - Version 1.1

## What's New in v1.1

This update **fixes all the major issues** you reported:

### ✅ Fixed Issues

1. **Traits are now real items** - "Cat's Claws" and other traits are created as separate feat items
2. **Movement speeds work** - Walking, climbing, flying, etc. now populate correctly in the species
3. **Senses work** - Darkvision now appears in the senses tab
4. **Ability scores fixed** - Uses D&D 5e 2024 flexible system (you choose which to increase)
5. **No more duplicates** - Traits are only added once, correctly
6. **Size options** - Handles "Small or Medium" choices properly

### 🎯 How It Works Now

When you import a species like Tabaxi:

1. **Main species item** is created with:
   - Proper movement speeds (walk 30, climb 30)
   - Senses (darkvision 60)
   - Size options (Medium or Small)
   - Flexible ability score increases

2. **Trait items** are created separately:
   - Cat's Claws (as a feat with 1d6 slashing damage)
   - Cat's Talent (with Perception and Stealth proficiencies)
   - Feline Agility (with full description)
   - Darkvision (automatically handled in senses)

3. **Advancements** properly link everything:
   - Traits are granted via ItemGrant
   - Ability scores use the 2024 flexible system
   - Skills are granted via Trait advancement

## How to Update

### Option 1: Replace Files (Recommended)

1. **Close Foundry VTT** completely
2. **Navigate to** your modules folder:
   - Windows: `%localappdata%\FoundryVTT\Data\modules\race-importer-ollama\`
   - macOS: `~/Library/Application Support/FoundryVTT/Data/modules/race-importer-ollama/`
   - Linux: `~/.local/share/FoundryVTT/Data/modules/race-importer-ollama/`
3. **Delete** the old `race-importer-ollama` folder
4. **Extract** the new v1.1 zip to the modules folder
5. **Restart** Foundry VTT

### Option 2: Just Replace the Script

If you only want the fixes without documentation updates:

1. Download the new `race-importer-app.js`
2. Replace it in `modules/race-importer-ollama/scripts/`
3. Reload Foundry (F5)

## Testing the Update

Try importing the Tabaxi again with the same text:

1. Open Race Importer (`RaceImporter.open()`)
2. Paste the Tabaxi text again
3. Import to a test compendium

**You should now see:**
- ✅ Tabaxi species with proper movement and senses
- ✅ Separate trait items (Cat's Claws, Cat's Talent, etc.)
- ✅ Flexible ability score increases (not fixed values)
- ✅ No duplicate entries

## Verify It's Working

After importing, check:

1. **Species item** → Details tab:
   - Movement: Walk 30 ft., Climb 30 ft.
   - Senses: Darkvision 60 ft.
   - Size: Medium or Small

2. **Species item** → Advancement tab:
   - Ability Score Improvement (flexible, choose 3 scores)
   - Size (choose Small or Medium)
   - ItemGrant entries for each trait

3. **Compendium** should have:
   - 1 Tabaxi species item
   - 4-5 separate trait items (Cat's Claws, Cat's Talent, Feline Agility, etc.)

## Known Limitations

- The module still can't fetch URLs directly (CORS issue) - use "From Text" tab
- Complex traits may need manual review
- Damage formulas might need adjustment for specific cases
- Some homebrew content may be interpreted differently by the AI

## Troubleshooting

**"Module version still shows 1.0.0"**
- Make sure you completely replaced the folder
- Check module.json - it should say "version": "1.1.0"

**"Still getting wrong ability scores"**
- The AI now understands 2024 rules better
- It should create flexible increases
- You may need to re-import existing species

**"Traits not appearing"**
- Check the compendium for separate feat items
- They should be created before the species item
- Look for items named like "Cat's Claws", "Feline Agility", etc.

## Feedback Welcome

If you find issues with v1.1, please report:
- What you tried to import
- What went wrong
- Console errors (F12)
- Expected vs actual results

---

**Enjoy the improved importer! 🎲✨**
