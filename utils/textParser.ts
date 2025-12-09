
export enum TokenType {
  STANDARD = 'STANDARD',
  NAME = 'NAME',
  QURAN = 'QURAN',
  BOLD = 'BOLD',
  ITALIC = 'ITALIC',
}

export interface TextToken {
  id: string;
  text: string;
  type: TokenType;
}

export interface ParsedParagraph {
  id: string;
  tokens: TextToken[];
}

/**
 * Escapes special regex characters in a string.
 */
function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Tokenizes a single string line into typed tokens.
 */
const tokenizeLine = (text: string, customNames: string[], lineIndex: number, namesAtStartOnly: boolean): TextToken[] => {
  if (!text) return [];

  const sortedNames = [...customNames].sort((a, b) => b.length - a.length);
  
  let namesRegexPart = '';
  if (sortedNames.length > 0) {
    namesRegexPart = sortedNames.map(name => escapeRegExp(name)).join('|');
  }
  
  // Regex Patterns:
  // 1. Quran: {Verse} or ﴿Verse﴾ or [Citation]
  const quranPattern = '((?:\\{[^}]+\\}|﴿[^﴾]+﴾)(?:\\s*\\[[^\\]]+\\])?|\\[[^\\]]+\\])';
  
  // 2. Markdown Bold: **text**
  const boldPattern = '(\\*\\*[^\\*]+\\*\\*)';
  
  // 3. Markdown Italic: *text* or _text_
  const italicPattern = '(\\*[^\\*]+\\*|_[^_]+_)';

  // Build Master Regex
  // Order matters: Quran > Bold > Italic > Names
  const patternString = [
    quranPattern,
    boldPattern,
    italicPattern,
    namesRegexPart ? `(${namesRegexPart})` : null
  ].filter(Boolean).join('|');

  const masterRegex = new RegExp(patternString, 'g');
  
  // Split text by the master regex. 
  const parts = text.split(masterRegex);
  const tokens: TextToken[] = [];
  
  let currentCursor = 0;

  parts.forEach((part, index) => {
    // split with capturing groups can return undefined for unmatched groups
    if (part === undefined || part === '') return;

    let type = TokenType.STANDARD;
    let finalText = part;

    // 1. Check Quran
    if (part.startsWith('{') || part.startsWith('﴿') || part.startsWith('[')) {
      type = TokenType.QURAN;
    } 
    // 2. Check Markdown Bold (**...**)
    else if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      const stripped = part.slice(2, -2);
      finalText = stripped;
      
      // Special Rule: If the bolded text *contains* or *starts with* a custom Name, treat it as a NAME.
      // Example input: "**دكتور رشيد:**" -> stripped: "دكتور رشيد:" -> recognized as NAME style.
      const containsName = sortedNames.some(name => stripped.includes(name));
      
      if (containsName) {
        // Check "Start of paragraph" rule relative to the *original* raw text position
        // We consider it a "valid name" if it matches logic.
        // Since we are inside a bold block that contains a name, we likely want to force NAME style
        // regardless of the exact 'start only' logic because the user explicitly formatted it.
        // However, to be consistent:
        if (namesAtStartOnly) {
           const prefix = text.substring(0, currentCursor);
           if (prefix.trim().length === 0) {
             type = TokenType.NAME;
           } else {
             type = TokenType.BOLD; // If name is in middle and restricted, keep it just Bold.
           }
        } else {
           type = TokenType.NAME;
        }
      } else {
        type = TokenType.BOLD;
      }
    }
    // 3. Check Markdown Italic (*...* or _..._)
    else if ((part.startsWith('*') && part.endsWith('*')) || (part.startsWith('_') && part.endsWith('_'))) {
      finalText = part.slice(1, -1);
      type = TokenType.ITALIC;
    }
    // 4. Check Direct Name Match
    else if (customNames.includes(part)) {
      if (namesAtStartOnly) {
        const prefix = text.substring(0, currentCursor);
        if (prefix.trim().length === 0) {
          type = TokenType.NAME;
        } else {
          type = TokenType.STANDARD;
        }
      } else {
        type = TokenType.NAME;
      }
    }

    tokens.push({
      id: `token-${lineIndex}-${index}-${Date.now()}`,
      text: finalText,
      type: type
    });

    currentCursor += part.length;
  });

  return tokens;
}

/**
 * Parses text into paragraphs, each containing tokens.
 */
export const parseText = (text: string, customNames: string[] = [], namesAtStartOnly: boolean = false): ParsedParagraph[] => {
  if (!text) return [];

  // Split by newline to respect paragraphs
  const lines = text.split('\n');

  return lines.map((line, index) => ({
    id: `p-${index}-${Date.now()}`,
    tokens: tokenizeLine(line, customNames, index, namesAtStartOnly)
  }));
};
