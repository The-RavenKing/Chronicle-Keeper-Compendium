export class BaseStrategy {
  constructor() {
    this.key = "base";
  }

  /**
   * Returns the specific prompt for this content type
   * @param {string} content - The user's pasted text
   */
  getPrompt(content) {
    throw new Error("getPrompt must be implemented");
  }

  /**
   * Validates and cleans the JSON data from Ollama
   * @param {object} data - The raw JSON parsed from Ollama
   */
  validate(data) {
    return data;
  }

  /**
   * Creates the actual documents in Foundry
   * @param {object} data - The validated data
   */
  async create(data) {
    throw new Error("create must be implemented");
  }

  /**
   * Helper to find or create a folder in a compendium pack
   * @param {CompendiumCollection} pack - The pack to search/create in
   * @param {string} folderName - Name of the class
   * @returns {string|null} folderId
   */
  async getOrCreateFolder(pack, folderName) {
    if (!folderName) return null;
    const name = folderName.trim();

    // Find existing folder
    const folders = pack.folders;
    const existing = folders.find(f => f.name.toLowerCase() === name.toLowerCase());
    if (existing) return existing.id;

    // Create new folder
    try {
      const folder = await Folder.create({
        name: name,
        type: "Item",
        pack: pack.collection
      }, { pack: pack.collection });
      console.log(`Chronicle Keeper | Created folder '${name}' in ${pack.collection}`);
      return folder.id;
    } catch (err) {
      console.error(`Chronicle Keeper | Folder creation failed for '${name}':`, err);
      return null;
    }
  }
}