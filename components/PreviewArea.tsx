
import React, { forwardRef } from 'react';
import { ParsedParagraph, TokenType } from '../utils/textParser';

export type VerseBracketType = 'curly' | 'round' | 'square' | 'angle' | 'quranic';

export interface StyleConfig {
  nameColor: string;
  nameSize: number;
  quranColor: string;
  quranSize: number;
  verseBrackets: VerseBracketType;
  standardColor: string;
  standardSize: number;
  lineHeight: number;
  paragraphSpacing: number;
}

interface PreviewAreaProps {
  paragraphs: ParsedParagraph[];
  styleConfig: StyleConfig;
}

const getBrackets = (type: VerseBracketType): [string, string] => {
  switch (type) {
    case 'round': return ['(', ')'];
    case 'square': return ['[', ']'];
    case 'angle': return ['«', '»'];
    case 'quranic': return ['﴿', '﴾'];
    case 'curly': 
    default: return ['{', '}'];
  }
};

export const PreviewArea = forwardRef<HTMLDivElement, PreviewAreaProps>(({ paragraphs, styleConfig }, ref) => {
  return (
    <div 
      className="w-full h-full p-12 md:p-24 bg-[#e7e5e4] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] overflow-y-auto min-h-[700px] transition-all duration-700 ease-in-out"
      dir="rtl"
    >
      <div 
        ref={ref}
        className="w-full"
      >
        {paragraphs.map((paragraph) => (
          <div 
            key={paragraph.id}
            style={{
              marginBottom: `${styleConfig.paragraphSpacing}pt`,
              lineHeight: styleConfig.lineHeight,
              minHeight: `${styleConfig.standardSize}pt`
            }}
            className="whitespace-pre-wrap"
          >
            {paragraph.tokens.length === 0 ? (
              <span>&nbsp;</span>
            ) : (
              paragraph.tokens.map((token) => {
                // Shared base style
                const baseStyle = {
                  fontFamily: '"Calibri Light", "Calibri", sans-serif',
                  fontSize: `${styleConfig.standardSize}pt`,
                  color: styleConfig.standardColor,
                };

                if (token.type === TokenType.NAME) {
                  return (
                    <span
                      key={token.id}
                      style={{
                        ...baseStyle,
                        fontSize: `${styleConfig.nameSize}pt`,
                        color: styleConfig.nameColor,
                        fontWeight: 'bold',
                      }}
                    >
                      {token.text}
                    </span>
                  );
                }

                if (token.type === TokenType.BOLD) {
                  return (
                    <span
                      key={token.id}
                      style={{
                        ...baseStyle,
                        fontWeight: 'bold',
                      }}
                    >
                      {token.text}
                    </span>
                  );
                }

                if (token.type === TokenType.ITALIC) {
                  return (
                    <span
                      key={token.id}
                      style={{
                        ...baseStyle,
                        fontStyle: 'italic',
                      }}
                    >
                      {token.text}
                    </span>
                  );
                }

                if (token.type === TokenType.QURAN) {
                  // Handle Standalone Citation [Text]
                  if (token.text.startsWith('[') && token.text.endsWith(']')) {
                    return (
                      <span
                        key={token.id}
                        style={{
                           ...baseStyle,
                           fontSize: `${styleConfig.quranSize * 0.9}pt`,
                           fontWeight: 'normal',
                           color: styleConfig.quranColor,
                        }}
                      >
                        {token.text}
                      </span>
                    );
                  }

                  // The token text might include a citation: "﴿Verse﴾ [Citation]"
                  const verseMatch = token.text.match(/^((?:\{[^}]+\}|﴿[^﴾]+﴾))(\s*\[[^\]]+\])?$/);
                   
                  let verseContentRaw = token.text;
                  let citationContent = '';
                   
                  if (verseMatch) {
                    verseContentRaw = verseMatch[1];
                    citationContent = verseMatch[2] || '';
                  }

                  // Strip original wrapper brackets from verse content
                  let content = verseContentRaw;
                  if ((content.startsWith('{') && content.endsWith('}')) || 
                      (content.startsWith('﴿') && content.endsWith('﴾'))) {
                    content = content.slice(1, -1);
                  }
                  
                  const [leftBracket, rightBracket] = getBrackets(styleConfig.verseBrackets);

                  return (
                    <span
                      key={token.id}
                      style={{
                        color: styleConfig.quranColor,
                      }}
                    >
                      <span
                        style={{
                          // Using Amiri font specifically for Quran
                          fontFamily: '"Amiri", "Traditional Arabic", serif',
                          fontSize: `${styleConfig.quranSize}pt`,
                          fontWeight: 'bold',
                        }}
                      >
                        {leftBracket}{content}{rightBracket}
                      </span>
                      {citationContent && (
                        <span
                          style={{
                             ...baseStyle,
                             fontSize: `${styleConfig.quranSize * 0.9}pt`,
                             fontWeight: 'normal',
                             color: styleConfig.quranColor,
                          }}
                        >
                          {citationContent}
                        </span>
                      )}
                    </span>
                  );
                }

                // Standard
                return (
                  <span
                    key={token.id}
                    style={{
                      ...baseStyle,
                      fontWeight: 'normal',
                    }}
                  >
                    {token.text}
                  </span>
                );
              })
            )}
          </div>
        ))}
      </div>
    </div>
  );
});

PreviewArea.displayName = "PreviewArea";
