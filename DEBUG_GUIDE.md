# Debug Guide for v1.3.0

## Issue Checklist

You're experiencing:
- ❌ Macro didn't create automatically
- ❌ Button not showing
- ❌ Creature type not appearing (Humanoid missing)
- ❌ Feline Agility trait not created
- ❌ Ability scores not configured correctly

## Step-by-Step Debugging

### 1. Check Console Logs

Press **F12** and look for these messages:

**Expected:**
```
Race Importer | Initializing
Race Importer | Ready
Race Importer | Created macro automatically: Race Importer
```

**If you see:**
```
Race Importer | Macro already exists
```
Then check your Macro Directory - it might already be there.

**If you see an error**, copy and paste it to me.

### 2. Manually Create the Macro

Since auto-creation isn't working:

1. Go to **Macro Directory** (scroll icon)
2. Click **Create Macro**
3. Fill in:
   - **Name**: `Race Importer`
   - **Type**: `Script`
   - **Command**: 
   ```javascript
   import('/modules/race-importer-ollama/scripts/race-importer-app.js').then(module => {
     new module.RaceImporterApp().render(true);
   });
   ```
4. Save and drag to hotbar

### 3. Check What Ollama Returned

After importing, press F12 and run:

```javascript
// This will show you what the AI extracted
console.log('Last import:', game.modules.get('race-importer-ollama')?._lastImport);
```

### 4. Check the Species Item

Open the Tabaxi species item and check:

**Details Tab:**
- Look for "Type" field - does it show "humanoid"?
- Look for movement - does it show climb 30?

**Advancement Tab:**
- Count the advancements - how many are there?
- What types do you see?

**Description Tab:**
- Does it mention all the traits?

### 5. Check for Missing Traits

In your compendium, search for:
- Cat's Claws ✅ (you said this worked)
- Cat's Talent
- Feline Agility ❌ (you said this is missing)
- Darkvision

### 6. Test Ollama Directly

Let's verify Ollama is parsing correctly. In console:

```javascript
fetch('http://localhost:11434/api/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    model: 'llama3',
    prompt: 'Return JSON with two fields: test: "success", number: 42',
    stream: false,
    format: 'json'
  })
}).then(r => r.json()).then(d => console.log(JSON.parse(d.response)));
```

You should see: `{test: "success", number: 42}`

## Common Issues

### Macro Won't Run

**Symptom:** Clicking macro shows error

**Solution:** The import statement might not work. Try this version instead:

```javascript
game.modules.get('race-importer-ollama').api.open();
```

### Missing Traits

**Symptom:** Some traits don't create

**Possible causes:**
1. Ollama didn't extract them
2. Creation failed partway through
3. They're in a different compendium

**Check:** Look in ALL your Item compendiums, not just the target one

### Creature Type Not Showing

**Where to look:**
- Species item → Details tab → "Type" dropdown
- Should show "humanoid" in the dropdown

**If it's missing:**
- The field exists but might be empty
- Check the raw item data (F12): `game.items.getName("Tabaxi")`

### Ability Scores Wrong

**What's expected:**
- Should show "Ability Score Improvement" advancement
- Configuration should allow choosing which abilities to increase
- Not fixed +2/+1 to specific abilities

**Check advancement tab** for details

## Please Report Back

For each issue, let me know:

1. **Macro creation:**
   - What console logs do you see?
   - Any errors?

2. **Missing traits:**
   - How many trait items were created?
   - Which ones are missing?

3. **Creature type:**
   - Open species Details tab
   - What's in the "Type" dropdown?
   - Is it empty or does it say something?

4. **Ability scores:**
   - What does the ASI advancement show?
   - Screenshot if possible

This will help me pinpoint exactly what's going wrong!
