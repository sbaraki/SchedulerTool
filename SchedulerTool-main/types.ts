import * as fs from 'fs';

const filePath = './index.tsx';
let code = fs.readFileSync(filePath, 'utf-8');

const replacements = [
  // shadows
  [/shadow-\[-4px_0_0_0_rgba\(0,0,0,1\)\]/g, 'shadow-2xl'],
  [/shadow-\[2px_2px_0_0_rgba\(0,0,0,1\)\]/g, 'shadow-sm hover:shadow-md'],
  [/shadow-\[3px_3px_0_0_rgba\(0,0,0,1\)\]/g, 'shadow-md hover:shadow-lg'],
  [/shadow-\[4px_4px_0_0_rgba\(0,0,0,1\)\]/g, 'shadow-lg'],
  [/shadow-\[8px_8px_0_0_rgba\(0,0,0,1\)\]/g, 'shadow-2xl'],
  [/shadow-\[1px_1px_0_0_rgba\(0,0,0,1\)\]/g, 'shadow-sm'],
  [/shadow-\[2px_0_10px_rgba\(0,0,0,0\.02\)\]/g, 'shadow-sm'],
  
  // borders
  [/border-2 border-black/g, 'border border-slate-300 rounded-md'],
  [/border-b-2 border-black/g, 'border-b border-slate-200'],
  [/border-t-2 border-black/g, 'border-t border-slate-200'],
  [/border-r-2 border-black/g, 'border-r border-slate-200'],
  [/border-l-2 border-black/g, 'border-l border-slate-200'],
  [/border-l-2 border-dashed border-orange-500\/50/g, 'border-l border-dashed border-slate-300'],
  [/border-b-2 border-black\/5/g, 'border-b border-slate-100'],
  [/border-b-2 border-black\/10/g, 'border-b border-slate-200'],
  [/border-r-2 border-black\/5/g, 'border-r border-slate-100'],
  [/border-t-4 border-black/g, 'border-t border-slate-200'],
  [/border-4 border-black/g, 'border border-slate-100 rounded-2xl'],
  [/border-\[1\.5px\] border-black/g, 'border border-slate-300 rounded'],
  [/border-b-\[3px\] border-slate-800/g, 'border-b border-slate-200'],
  [/border border-black\/10/g, 'border border-slate-200'],
  [/border-2 border-red-500\/50/g, 'border border-red-300 bg-red-50 rounded text-red-600'],

  // Focus rings
  [/focus:ring-black/g, 'focus:ring-blue-500/50'],
  [/focus:bg-yellow-50/g, 'focus:bg-white focus:border-blue-500 focus:ring-blue-500/50 focus:shadow-sm'],
  [/bg-slate-50\/50/g, 'bg-white'],
  [/bg-slate-50/g, 'bg-white'],
  [/focus-within:bg-yellow-50\/10/g, ''],
  
  // Specific buttons
  [/hover:bg-slate-800/g, 'hover:bg-slate-700'],
  [/hover:text-white transition-colors/g, 'hover:text-slate-900 transition-all duration-200'],
  [/bg-black text-white px-3 py-1\.5 text-\[10px\] font-black uppercase/g, 'bg-black text-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-tight rounded'],
  [/bg-white border text-slate-700 px-3 py-1\.5 text-\[10px\] font-bold uppercase rounded/g, 'bg-white border border-slate-300 text-slate-700 px-3 py-1.5 text-[10px] font-bold uppercase rounded hover:bg-slate-50'],

  // Typography
  [/font-black uppercase/g, 'font-bold uppercase tracking-tight'],
  [/text-xs font-black uppercase/g, 'text-xs font-bold uppercase tracking-tight'],
  [/font-black text-\[10px\] uppercase/g, 'font-semibold text-[10px] uppercase'],

  // Phase bars inline editing style softening
  [/hover:translate-x-0\.5 hover:translate-y-0\.5 hover:shadow-none/g, 'hover:-translate-y-0.5'],
  [/active:translate-x-0\.5 active:translate-y-0\.5 active:shadow-none/g, 'active:scale-95'],
  [/border-l-2 border-r-2 border-dashed border-red-500\/50/g, 'border-l border-r border-dashed border-red-300 bg-red-500/5'],
  
  // Overlaps & other specific details
  [/drop-shadow-\[1px_1px_0_rgba\(0,0,0,1\)\]/g, 'drop-shadow-sm'],
  [/bg-white\/95 backdrop-blur-sm/g, 'bg-white'],
];

for (const [regex, newStr] of replacements) {
    code = code.replace(regex, newStr);
}

// Cleanup double-roundeds
code = code.replace(/rounded-md rounded-md/g, 'rounded-md');
code = code.replace(/rounded rounded-md/g, 'rounded-md');

fs.writeFileSync(filePath, code);
console.log("Regex replacements finished.");
