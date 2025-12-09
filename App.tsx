
import React, { useState, useMemo, useRef } from 'react';
import { parseText } from './utils/textParser';
import { PreviewArea, StyleConfig, VerseBracketType } from './components/PreviewArea';
import { Copy, Eraser, Settings, FileDown, Plus, X, Palette, Layout, UserRound, Printer, RotateCcw } from 'lucide-react';

const DEFAULT_NAMES = [
  "الدكتور رشيد",
  "دكتور رشيد",
  "د. رشيد",
  "مصطفى",
  "زكريا"
];

// Aesthetic Default Styles using Point (pt) system
const DEFAULT_STYLE: StyleConfig = {
  standardSize: 14, // 14pt is standard for readable Arabic documents
  standardColor: '#1c1917', // Stone 900
  nameSize: 16, // 16pt for emphasis
  nameColor: '#C41E3A', // Cardinal Red
  quranSize: 14, // 14pt matches body
  quranColor: '#002147', // Oxford Blue
  verseBrackets: 'curly', // Default brackets
  lineHeight: 1.3, // Tightened default
  paragraphSpacing: 2 // Reduced default spacing
};

const SAMPLE_TEXT = `مرحباً بكم في البرنامج المطور.
قال **مصطفى** لصديقه: هل قرأت الآية {الله نور السماوات والأرض}؟
[النور: 35]

أجاب زكريا : نعم، وقد شرحها **د. رشيد:** في المحاضرة السابقة.
*ملاحظة: هذا النص يدعم الماركدون الآن.*

ثم علق الدكتور رشيد قائلاً: إنها آية عظيمة.`;

// Minimalist Logo Component using Negative Space
const Logo = () => (
  <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-stone-200 shrink-0">
    <path fillRule="evenodd" clipRule="evenodd" d="M10 0C4.47715 0 0 4.47715 0 10V30C0 35.5228 4.47715 40 10 40H30C35.5228 40 40 35.5228 40 30V10C40 4.47715 35.5228 0 30 0H10ZM13 14C12.4477 14 12 14.4477 12 15V17C12 17.5523 12.4477 18 13 18H27C27.5523 18 28 17.5523 28 17V15C28 14.4477 27.5523 14 27 14H13ZM12 23C12 22.4477 12.4477 22 13 22H21C21.5523 22 22 22.4477 22 23V25C22 25.5523 21.5523 26 21 26H13C12.4477 26 12 25.5523 12 25V23Z" fill="currentColor"/>
  </svg>
);

const App: React.FC = () => {
  const [inputText, setInputText] = useState<string>(SAMPLE_TEXT);
  const [customNames, setCustomNames] = useState<string[]>(DEFAULT_NAMES);
  const [styleConfig, setStyleConfig] = useState<StyleConfig>(DEFAULT_STYLE);
  const [namesAtStartOnly, setNamesAtStartOnly] = useState<boolean>(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [newNameInput, setNewNameInput] = useState("");
  
  const previewRef = useRef<HTMLDivElement>(null);

  // Memoize parsing
  const paragraphs = useMemo(() => {
    return parseText(inputText, customNames, namesAtStartOnly);
  }, [inputText, customNames, namesAtStartOnly]);

  // Calculate stats
  const stats = useMemo(() => {
    const text = inputText.trim();
    if (!text) return { chars: 0, words: 0, paras: 0 };
    return {
      chars: text.length,
      words: text.split(/\s+/).length,
      paras: paragraphs.length
    };
  }, [inputText, paragraphs]);

  const handleAddName = () => {
    if (newNameInput.trim() && !customNames.includes(newNameInput.trim())) {
      setCustomNames([...customNames, newNameInput.trim()]);
      setNewNameInput("");
    }
  };

  const removeName = (nameToRemove: string) => {
    setCustomNames(customNames.filter(n => n !== nameToRemove));
  };

  const handleResetDefaults = () => {
    setStyleConfig(DEFAULT_STYLE);
    setCustomNames(DEFAULT_NAMES);
    setNamesAtStartOnly(true);
  };

  const handleCopy = async () => {
    if (!previewRef.current) return;
    try {
      const htmlContent = previewRef.current.innerHTML;
      const textContent = previewRef.current.innerText || inputText;
      
      const fullHtml = `
        <div dir="rtl" style="font-family: 'Calibri Light', 'Calibri', sans-serif; text-align: right; color: ${styleConfig.standardColor};">
          ${htmlContent}
        </div>
      `;
      
      const blobHtml = new Blob([fullHtml], { type: 'text/html' });
      const blobText = new Blob([textContent], { type: 'text/plain' });
      const data = [new ClipboardItem({ ['text/html']: blobHtml, ['text/plain']: blobText })];
      await navigator.clipboard.write(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDownloadWord = () => {
    if (!previewRef.current) return;
    
    const htmlContent = previewRef.current.innerHTML;
    
    // Microsoft Word specific XML for footer page numbers
    const fileContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset="utf-8">
        <title>Document</title>
        <style>
          @page {
            mso-page-orientation: portrait;
            margin: 1in;
            mso-footer: f1;
          }
          body { font-family: 'Calibri Light', 'Calibri', sans-serif; direction: rtl; text-align: right; }
          p, div { margin: 0; padding: 0; }
          
          /* Footer Definition */
          div.footer {
            display: none;
            mso-element: footer;
            margin: 0;
            text-align: center;
            font-size: 10pt;
          }
        </style>
      </head>
      <body>
        ${htmlContent}
        
        <div class="footer" id="f1">
          <p align="center">
            <span style='mso-field-code:" PAGE "'></span>
          </p>
        </div>
      </body>
      </html>
    `;
    
    const blob = new Blob(['\ufeff', fileContent], {
        type: 'application/msword'
    });
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `document-${Date.now()}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintPdf = () => {
    if (!previewRef.current) return;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const htmlContent = previewRef.current.innerHTML;
    
    const printDocument = `
      <!DOCTYPE html>
      <html dir="rtl">
      <head>
        <title>طباعة المستند</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Amiri:ital,wght@0,400;0,700;1,400&family=Noto+Naskh+Arabic:wght@300;400;500&display=swap');
          @font-face {
            font-family: 'Calibri Light';
            src: local('Calibri Light'), local('Calibri');
          }
          body {
            margin: 0;
            padding: 20mm;
            font-family: 'Calibri Light', 'Calibri', sans-serif;
          }
          /* Ensure styles are printed exactly as seen */
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          /* Page numbering for print */
          @page {
            margin: 20mm;
            @bottom-center {
              content: counter(page);
              font-family: 'Calibri', sans-serif;
              font-size: 10pt;
              color: #666;
            }
          }
        </style>
      </head>
      <body>
        ${htmlContent}
        <script>
          window.onload = function() {
            window.print();
            window.close();
          }
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(printDocument);
    printWindow.document.close();
  };

  return (
    <div className="min-h-screen flex flex-col font-calibri text-stone-300 bg-[#0c0a09]" dir="rtl">
      
      {/* Invisible Header */}
      <header className="px-8 py-8 flex items-center justify-between sticky top-0 z-10 bg-[#0c0a09]/80 backdrop-blur-sm transition-all">
        <div className="flex items-center gap-4">
          <Logo />
          <h1 className="text-2xl text-stone-200 font-amiri opacity-80">منسق النصوص</h1>
        </div>
        <div className="flex items-center gap-4">
           <button
              onClick={() => setIsSettingsOpen(true)}
              className="text-stone-500 hover:text-stone-100 transition-colors p-2"
              title="الإعدادات"
           >
              <Settings strokeWidth={1.5} size={24} />
           </button>
           <button
              onClick={handleDownloadWord}
              className="text-stone-500 hover:text-stone-100 transition-colors p-2"
              title="تصدير Word"
           >
              <FileDown strokeWidth={1.5} size={24} />
           </button>
           <button
              onClick={handlePrintPdf}
              className="text-stone-500 hover:text-stone-100 transition-colors p-2"
              title="تصدير PDF"
           >
              <Printer strokeWidth={1.5} size={24} />
           </button>
        </div>
      </header>

      {/* Main Content - Floating Layout */}
      <main className="flex-1 w-full max-w-[1800px] mx-auto px-6 md:px-12 py-4 grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-start pb-20">
        
        {/* Editor Side: Minimalist Dark */}
        <div className="flex flex-col gap-6 h-[calc(100vh-150px)] sticky top-32">
          <div className="flex items-center justify-between opacity-0 hover:opacity-100 transition-opacity duration-500">
             <span className="text-xs text-stone-600 font-medium tracking-widest uppercase">النص الأصلي (يدعم الماركدون)</span>
             <button 
              onClick={() => setInputText('')}
              className="text-stone-600 hover:text-red-500 transition-colors"
            >
              <Eraser strokeWidth={1.5} size={18} />
            </button>
          </div>
          {/* Changed font-calibri to font-amiri to ensure user can READ the complex script in input even before decoding */}
          <textarea
            className="flex-1 w-full h-full bg-transparent border-none focus:ring-0 resize-none outline-none text-xl leading-loose font-amiri text-stone-300 placeholder:text-stone-700 placeholder:font-light custom-scrollbar"
            placeholder="ابدأ الكتابة هنا... (يمكنك استخدام **نص عريض** أو *مائل*)"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            dir="rtl"
            spellCheck="false"
          />
        </div>

        {/* Preview Side: Paper Aesthetic (Dimmed) */}
        <div className="flex flex-col gap-6 h-full pb-12">
           <div className="flex items-center justify-between opacity-0 hover:opacity-100 transition-opacity duration-500">
             <span className="text-xs text-stone-600 font-medium tracking-widest uppercase">النتيجة</span>
             <button 
                onClick={handleCopy}
                className="text-stone-600 hover:text-stone-200 flex items-center gap-2 transition-colors text-xs font-medium tracking-widest uppercase"
              >
                <Copy strokeWidth={1.5} size={14} />
                <span>نسخ التنسيق</span>
              </button>
          </div>
          <div className="flex-1">
            <PreviewArea 
              paragraphs={paragraphs} 
              ref={previewRef} 
              styleConfig={styleConfig}
            />
          </div>
        </div>

      </main>

      {/* Minimalist Counters Footer */}
      <div className="fixed bottom-6 left-8 z-20 flex items-center gap-6 text-stone-400 font-mono text-xs tracking-wider select-none bg-[#0c0a09]/50 backdrop-blur px-4 py-2 rounded-full border border-stone-800/50">
        <div className="flex items-center gap-2" title="عدد الحروف">
          <span className="text-white font-amiri">ح</span>
          <span>{stats.chars}</span>
        </div>
        <div className="w-px h-3 bg-stone-700"></div>
        <div className="flex items-center gap-2" title="عدد الكلمات">
          <span className="text-white font-amiri">ك</span>
          <span>{stats.words}</span>
        </div>
        <div className="w-px h-3 bg-stone-700"></div>
        <div className="flex items-center gap-2" title="عدد الفقرات">
          <span className="text-white font-amiri">ف</span>
          <span>{stats.paras}</span>
        </div>
      </div>

      {/* Elegant Settings Modal - Single Window View */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setIsSettingsOpen(false)}></div>
          
          <div className="relative bg-[#1c1917] w-full max-w-5xl rounded-xl shadow-2xl shadow-black border border-stone-800 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-300">
            
            <div className="px-8 py-6 flex items-center justify-between border-b border-stone-800/50">
              <h2 className="text-2xl font-amiri text-stone-200">التخصيص</h2>
              <div className="flex items-center gap-4">
                <button 
                  onClick={handleResetDefaults} 
                  className="text-stone-500 hover:text-stone-200 transition-colors flex items-center gap-2 group"
                  title="استعادة الافتراضيات"
                >
                  <RotateCcw strokeWidth={1.5} size={20} className="group-hover:-rotate-180 transition-transform duration-500" />
                  <span className="text-sm">استعادة</span>
                </button>
                <div className="w-px h-6 bg-stone-800"></div>
                <button 
                  onClick={() => setIsSettingsOpen(false)} 
                  className="text-stone-500 hover:text-stone-200 transition-colors"
                >
                  <X strokeWidth={1.5} size={24} />
                </button>
              </div>
            </div>
            
            <div className="p-8 grid grid-cols-1 lg:grid-cols-5 gap-8">
              
              {/* Column 1: Visuals & Layout (Takes up more space now) */}
              <div className="flex flex-col gap-8 lg:col-span-3">
                
                {/* Style Controls */}
                <div className="space-y-5">
                  <div className="flex items-center gap-3 text-stone-200 mb-2">
                    <Palette strokeWidth={1.5} size={20} />
                    <span className="text-sm font-medium tracking-widest uppercase text-stone-500">النمط</span>
                  </div>

                  {/* Standard */}
                  <div className="flex items-center justify-between group">
                    <label className="text-base text-stone-400 font-calibri">النص الأساسي</label>
                    <div className="flex items-center gap-4">
                      <div className="h-8 w-8 relative rounded-full shadow-sm ring-1 ring-stone-700 overflow-hidden shrink-0 cursor-pointer hover:scale-110 transition-transform">
                         <input type="color" className="absolute inset-0 w-[150%] h-[150%] -top-1/4 -left-1/4 cursor-pointer opacity-0" value={styleConfig.standardColor} onChange={(e) => setStyleConfig({...styleConfig, standardColor: e.target.value})} />
                         <div className="w-full h-full" style={{backgroundColor: styleConfig.standardColor}}></div>
                      </div>
                      <div className="w-16 flex items-center justify-center bg-stone-900 rounded px-2 py-1 border border-stone-800">
                        <input 
                          type="number" 
                          className="w-full bg-transparent text-sm text-center outline-none text-stone-300" 
                          value={styleConfig.standardSize} 
                          onChange={(e) => setStyleConfig({...styleConfig, standardSize: Number(e.target.value)})} 
                        />
                      </div>
                    </div>
                  </div>

                  {/* Names */}
                  <div className="flex items-center justify-between group">
                    <label className="text-base text-stone-400 font-calibri">الأسماء</label>
                    <div className="flex items-center gap-4">
                       <div className="h-8 w-8 relative rounded-full shadow-sm ring-1 ring-stone-700 overflow-hidden shrink-0 cursor-pointer hover:scale-110 transition-transform">
                         <input type="color" className="absolute inset-0 w-[150%] h-[150%] -top-1/4 -left-1/4 cursor-pointer opacity-0" value={styleConfig.nameColor} onChange={(e) => setStyleConfig({...styleConfig, nameColor: e.target.value})} />
                         <div className="w-full h-full" style={{backgroundColor: styleConfig.nameColor}}></div>
                      </div>
                      <div className="w-16 flex items-center justify-center bg-stone-900 rounded px-2 py-1 border border-stone-800">
                        <input 
                          type="number" 
                          className="w-full bg-transparent text-sm text-center outline-none text-stone-300" 
                          value={styleConfig.nameSize} 
                          onChange={(e) => setStyleConfig({...styleConfig, nameSize: Number(e.target.value)})} 
                        />
                      </div>
                    </div>
                  </div>

                  {/* Quran */}
                  <div className="flex flex-col gap-3 group">
                    <div className="flex items-center justify-between">
                      <label className="text-base text-stone-400 font-calibri">الآيات القرآنية</label>
                      <div className="flex items-center gap-4">
                         <div className="h-8 w-8 relative rounded-full shadow-sm ring-1 ring-stone-700 overflow-hidden shrink-0 cursor-pointer hover:scale-110 transition-transform">
                           <input type="color" className="absolute inset-0 w-[150%] h-[150%] -top-1/4 -left-1/4 cursor-pointer opacity-0" value={styleConfig.quranColor} onChange={(e) => setStyleConfig({...styleConfig, quranColor: e.target.value})} />
                           <div className="w-full h-full" style={{backgroundColor: styleConfig.quranColor}}></div>
                        </div>
                        <div className="w-16 flex items-center justify-center bg-stone-900 rounded px-2 py-1 border border-stone-800">
                          <input 
                            type="number" 
                            className="w-full bg-transparent text-sm text-center outline-none text-stone-300" 
                            value={styleConfig.quranSize} 
                            onChange={(e) => setStyleConfig({...styleConfig, quranSize: Number(e.target.value)})} 
                          />
                        </div>
                      </div>
                    </div>
                    
                    {/* Bracket Style Selector */}
                    <div className="flex items-center justify-end gap-2">
                       <span className="text-xs text-stone-600">شكل الأقواس:</span>
                       <div className="flex bg-stone-900 rounded-md border border-stone-800 overflow-hidden">
                          {[
                            { id: 'curly', label: '{ }' },
                            { id: 'quranic', label: '﴿ ﴾' },
                            { id: 'round', label: '( )' },
                            { id: 'angle', label: '« »' },
                          ].map((b) => (
                             <button
                                key={b.id}
                                onClick={() => setStyleConfig({...styleConfig, verseBrackets: b.id as VerseBracketType})}
                                className={`px-3 py-1 text-xs font-serif transition-colors ${styleConfig.verseBrackets === b.id ? 'bg-stone-700 text-white' : 'text-stone-500 hover:text-stone-300'}`}
                             >
                               {b.label}
                             </button>
                          ))}
                       </div>
                    </div>
                  </div>
                </div>

                <div className="w-full h-px bg-stone-800/50"></div>

                {/* Layout Controls */}
                <div>
                   <div className="flex items-center gap-3 text-stone-200 mb-4">
                    <Layout strokeWidth={1.5} size={20} />
                    <span className="text-sm font-medium tracking-widest uppercase text-stone-500">المسافات</span>
                  </div>
                  <div className="space-y-6 px-1">
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm text-stone-500 mb-1">
                          <span>تباعد الأسطر</span>
                          <span>{styleConfig.lineHeight.toFixed(1)}</span>
                        </div>
                         {/* Segmented Control */}
                        <div className="flex p-1 bg-stone-900 rounded-lg mb-3 border border-stone-800">
                          {[
                            { label: 'ضيق', value: 1.3 },
                            { label: 'عادي', value: 1.6 },
                            { label: 'واسع', value: 2.2 }
                          ].map((preset) => (
                            <button
                              key={preset.label}
                              onClick={() => setStyleConfig({...styleConfig, lineHeight: preset.value})}
                              className={`flex-1 py-1 text-sm rounded-md transition-all duration-200 ${
                                styleConfig.lineHeight === preset.value 
                                  ? 'bg-[#292524] text-stone-200 font-medium shadow-sm' 
                                  : 'text-stone-500 hover:text-stone-300'
                              }`}
                            >
                              {preset.label}
                            </button>
                          ))}
                        </div>
                        <input 
                          type="range" 
                          min="1.0" 
                          max="3.0" 
                          step="0.1" 
                          value={styleConfig.lineHeight} 
                          onChange={(e) => setStyleConfig({...styleConfig, lineHeight: parseFloat(e.target.value)})} 
                          className="w-full" 
                        />
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm text-stone-500">
                          <span>تباعد الفقرات</span>
                          <span>{styleConfig.paragraphSpacing}pt</span>
                        </div>
                        <input type="range" min="0" max="40" step="2" value={styleConfig.paragraphSpacing} onChange={(e) => setStyleConfig({...styleConfig, paragraphSpacing: parseInt(e.target.value)})} className="w-full" />
                      </div>
                    </div>
                </div>

              </div>

              {/* Column 2: Keywords (Reduced width) */}
              <div className="flex flex-col h-full lg:col-span-2">
                <div className="flex items-center gap-3 text-stone-200 mb-4">
                  <UserRound strokeWidth={1.5} size={20} />
                  <span className="text-sm font-medium tracking-widest uppercase text-stone-500">الأسماء المعرفة</span>
                </div>
                
                <div className="flex items-center gap-2 mb-4 border-b border-stone-800 pb-2">
                  <input
                    type="text"
                    value={newNameInput}
                    onChange={(e) => setNewNameInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddName()}
                    placeholder="أضف اسماً جديداً..."
                    className="flex-1 bg-transparent text-stone-200 placeholder-stone-600 outline-none text-lg"
                  />
                  <button onClick={handleAddName} className="text-stone-500 hover:text-stone-200 transition-colors">
                    <Plus strokeWidth={1.5} size={24} />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar content-start mb-6 bg-stone-900/30 rounded-lg p-2 border border-stone-800/50 min-h-[150px]">
                  <div className="flex flex-wrap gap-2">
                    {customNames.map(name => (
                      <span key={name} className="inline-flex items-center gap-2 bg-stone-900 px-3 py-1.5 rounded text-sm text-stone-400 border border-stone-800 animate-in fade-in zoom-in duration-200">
                        {name}
                        <button onClick={() => removeName(name)} className="text-stone-600 hover:text-red-400 transition-colors"><X size={14} /></button>
                      </span>
                    ))}
                    {customNames.length === 0 && (
                      <span className="text-stone-600 text-sm italic p-2">لا توجد أسماء مضافة حالياً.</span>
                    )}
                  </div>
                </div>

                <div className="mt-auto pt-4 border-t border-stone-800/50">
                  <label className="flex items-center gap-3 cursor-pointer group select-none">
                    <div className={`w-5 h-5 border rounded transition-all duration-300 flex items-center justify-center shrink-0 ${namesAtStartOnly ? 'bg-stone-600 border-stone-600' : 'border-stone-700 bg-transparent'}`}>
                      {namesAtStartOnly && <div className="w-2 h-2 bg-white rounded-[1px]" />}
                    </div>
                    <input type="checkbox" className="sr-only" checked={namesAtStartOnly} onChange={() => setNamesAtStartOnly(!namesAtStartOnly)} />
                    <span className="text-sm text-stone-400 group-hover:text-stone-300 transition-colors leading-tight">تمييز الاسم عند أول ذكر في الفقرة فقط</span>
                  </label>
                </div>

              </div>
            </div>
            
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
