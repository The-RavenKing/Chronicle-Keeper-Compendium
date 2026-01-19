# Race Importer - Easy Access Methods

Having trouble finding the import button? Here are **three ways** to open the Race Importer:

## Method 1: Console Command (Always Works)

1. Press **F12** to open the browser console
2. Type: `RaceImporter.open()`
3. Press **Enter**

The importer window will open instantly.

## Method 2: Create a Macro (Recommended!)

This adds a button to your hotbar:

1. Go to the **Macro Directory** (scroll icon in sidebar)
2. Click **"Create Macro"**
3. Fill in:
   - **Name**: Race Importer
   - **Type**: Script
   - **Command**:
   ```javascript
   new RaceImporterApp().render(true);
   ```
4. **Save**
5. **Drag the macro** to your hotbar at the bottom

Now you can click it anytime to open the importer! 🎯

## Method 3: Module Settings

If the button still doesn't appear in the Compendium Directory:

1. Go to **Settings** (gear icon)
2. Click **"Module Settings"**
3. Find **"Race Importer with Ollama"**
4. Click the **"Open Button"** (there's a button in the settings)

## Method 4: Compendium Directory Button

The button **should** appear at the top of the Compendium Directory, but if it doesn't:

1. Go to **Compendium Directory** (book icon)
2. Look for a red **"Import Race/Species"** button at the top
3. If you don't see it, check the browser console (F12) for errors

## Troubleshooting: Button Not Appearing

If the button doesn't show up, check console logs:

1. Press **F12**
2. Look for these messages:
   ```
   Race Importer | Ready
   Race Importer | Compendium Directory rendered, adding button
   Race Importer | Button added successfully
   ```

If you don't see these messages, the hook might not be firing. In that case:

1. **Use the Macro method** (most reliable)
2. Or use the **Console command**

## Why the Button Might Not Appear

- **UI scaling/zoom**: Your browser zoom affects Foundry's UI
- **Module conflicts**: Another module might be interfering
- **Foundry version**: Different versions have different UI structures
- **Theme/CSS**: Some themes override default styling

## Best Solution: Use a Macro!

The macro method is:
- ✅ Always visible
- ✅ Works regardless of Foundry version
- ✅ Not affected by zoom/scaling
- ✅ Can't be hidden by other modules
- ✅ One-click access

Just create the macro once and you're good to go! 🚀

## Quick Reference

**Macro Code** (copy and paste):
```javascript
new RaceImporterApp().render(true);
```

**Console Command**:
```javascript
RaceImporter.open()
```

Choose whichever method works best for you!
