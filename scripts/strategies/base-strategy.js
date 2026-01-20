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
}