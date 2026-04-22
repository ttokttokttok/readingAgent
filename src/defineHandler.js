// Dictionary webhook handler: fetches from Free Dictionary API and formats result

const DICTIONARY_API = "https://api.dictionaryapi.dev/api/v2/entries/en";

/**
 * Fetch and format a word definition from the Free Dictionary API.
 * @param {string} word
 * @returns {Promise<{ result: string }>}
 */
async function defineWord(word) {
  if (!word || !word.trim()) {
    throw new Error("word parameter is required");
  }

  let response;
  try {
    response = await fetch(`${DICTIONARY_API}/${encodeURIComponent(word.trim())}`, {
      signal: AbortSignal.timeout(5000),
    });
  } catch (err) {
    // Network error or timeout
    return {
      result:
        "The dictionary service is temporarily unavailable. Please try again in a moment.",
    };
  }

  if (response.status === 404) {
    return {
      result: `I couldn't find a definition for '${word}'. Could you check the spelling?`,
    };
  }

  if (response.status >= 500) {
    return {
      result:
        "The dictionary service is temporarily unavailable. Please try again in a moment.",
    };
  }

  let data;
  try {
    data = await response.json();
  } catch {
    return {
      result:
        "The dictionary service is temporarily unavailable. Please try again in a moment.",
    };
  }

  // Extract fields from the first entry
  const entry = Array.isArray(data) ? data[0] : data;
  const wordLabel =
    entry.word
      ? entry.word.charAt(0).toUpperCase() + entry.word.slice(1)
      : word.charAt(0).toUpperCase() + word.slice(1);

  const meaning = entry.meanings && entry.meanings[0];
  const partOfSpeech = meaning ? meaning.partOfSpeech : null;
  const definitionObj = meaning && meaning.definitions && meaning.definitions[0];
  const definition = definitionObj ? definitionObj.definition : null;
  const example = definitionObj ? definitionObj.example || null : null;
  const etymology = entry.origin || null;

  if (!definition) {
    return {
      result: `I couldn't find a definition for '${word}'. Could you check the spelling?`,
    };
  }

  // Build result string — instruction prefix tells the LLM to read this verbatim and stop
  const header = partOfSpeech
    ? `${wordLabel} (${partOfSpeech}): ${definition}`
    : `${wordLabel}: ${definition}`;

  const originClause = etymology ? ` Origin: ${etymology}.` : "";
  const exampleClause = example ? ` Example: ${example}.` : "";

  const definition_text = `${header}.${originClause}${exampleClause}`;
  return { result: definition_text };
}

module.exports = { defineWord };
