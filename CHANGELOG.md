# Changelog

All notable changes to the Race Importer module will be documented in this file.

## [1.3.0] - 2025-01-19

### Fixed
- **Damage modifiers work**: Cat's Claws and other attacks now properly add ability modifier (bonus: '@mod')
- **Climb speed extracts correctly**: AI now understands "climbing speed equal to walking speed"
- **Languages are Trait advancement**: Languages now properly use Trait advancement instead of ItemGrant
- **Macro creation fixed**: Removed duplicate ready hook that prevented macro creation
- **Creature type capitalized**: Now properly shows as "Humanoid" not "humanoid"

### Changed
- **Improved Ollama prompt**: Much clearer instructions for movement, creature type, and damage
- **Better language handling**: Supports both fixed languages and "choose one" options
- **Skill proficiencies improved**: Better formatting for Trait advancement

### Added
- Module settings button as backup access method
- Better console logging for debugging macro and button creation
- More detailed prompt instructions for edge cases

## [1.2.2] - 2025-01-19

### Added
- **Auto-created macro**: Module now automatically creates a "Race Importer" macro when first enabled
- Notification when macro is created
- Macro appears in Macro Directory and can be dragged to hotbar
- Works for all users - perfect for sharing the module!

### Changed
- Improved reliability: Macro is the primary access method now
- Better user experience: No need to manually create a macro anymore

## [1.2.1] - 2025-01-19

### Added
- EASY_ACCESS.md guide with multiple ways to open the importer
- Improved button insertion with console logging for debugging
- Better CSS styling for sidebar button

### Fixed
- Button placement attempts multiple insertion points
- More reliable button rendering

## [1.2.0] - 2025-01-19

### Fixed
- **Attack damage now works**: Traits like Cat's Claws now properly create attack activities with damage formulas
- **Import button appears**: Fixed sidebar button rendering in Compendium Directory
- **Better damage parsing**: AI now correctly extracts "1d6 + Strength modifier" as proper damage formula

### Changed
- **Improved Ollama prompt**: Better instructions for extracting attack traits with damage
- **Activity system**: Now uses dnd5e v3 activity system for attacks instead of legacy format
- **Attack traits get weapon icon**: Traits with attacks show a sword icon instead of generic upgrade icon

### Added
- Proper activity-based attacks for weapon traits (claws, bite, etc.)
- Attack ability modifier selection (Strength/Dexterity)
- Damage type and dice properly configured
- Visual distinction for attack vs passive traits

## [1.1.0] - 2025-01-19

### Fixed
- **Proper trait item creation**: Traits like "Cat's Claws" are now created as separate feat items in the compendium
- **Movement speeds**: Walking, climbing, flying, swimming, and burrowing speeds now properly populate the species movement tab
- **Senses**: Darkvision and other senses now correctly populate the senses fields
- **Ability score increases**: Fixed to use D&D 5e 2024 flexible ability score system (choose which scores to increase)
- **Size options**: Properly handles species that can choose between Small and Medium
- **Duplicate traits**: Fixed issue where traits were being added multiple times

### Changed
- **Updated Ollama prompt**: Better extraction of D&D 5e 2024 species data format
- **Improved data structure**: Now uses proper dnd5e system data structures for species, movement, and senses
- **Better descriptions**: Species descriptions no longer duplicate trait information (traits are granted separately)
- **Advancement system**: Properly implements ItemGrant for traits, Size selection, and flexible ability scores

### Added
- Trait items are automatically created with proper attack data (for traits like claws)
- Support for flexible size selection (Small or Medium)
- Support for D&D 5e 2024 ability score increase rules
- Proper creature type field
- Better validation and error handling

## [1.0.0] - 2025-01-18

### Initial Release
- Basic race/species import from URL or text
- Ollama AI integration for parsing
- D&D 5e system support
- Compendium integration
- Multi-tab UI (URL, Text, Settings)
- Connection testing
- Example documentation
