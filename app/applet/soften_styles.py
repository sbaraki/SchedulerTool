import sys

file_path = "/app/applet/index.tsx"

with open(file_path, "r") as f:
    code = f.read()

replacements = [
    # Sidebar
    ("border-l-2 border-black z-[100] flex flex-col no-print shadow-[-4px_0_0_0_rgba(0,0,0,1)]", "border-l border-slate-200 z-[100] flex flex-col no-print shadow-2xl"),
    ("border-b-2 border-black flex justify-between items-center bg-slate-50", "border-b border-slate-200 flex justify-between items-center bg-white"),
    ("w-full bg-white border-2 border-black p-2 outline-none focus:bg-yellow-50", "w-full bg-slate-50 border border-slate-200 rounded-md p-2 outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"),
    ("w-10 h-10 bg-black text-white border-2 border-black flex items-center justify-center hover:bg-white hover:text-black transition-colors focus:ring-2 focus:ring-offset-2 focus:ring-black", "w-10 h-10 bg-black text-white rounded-md flex items-center justify-center hover:bg-slate-800 transition-colors focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-sm"),
    ("w-10 h-10 bg-white border-2 border-black text-black flex items-center justify-center hover:bg-black hover:text-white transition-colors focus:ring-2 focus:ring-offset-2 focus:ring-black", "w-10 h-10 bg-white border border-slate-300 rounded-md text-slate-700 flex items-center justify-center hover:bg-slate-50 transition-colors focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-sm"),
    ("w-full font-bold border-2 border-black p-2 outline-none text-sm bg-white text-black focus:bg-yellow-50", "w-full font-semibold border border-slate-300 rounded-md p-2 outline-none text-sm bg-white text-slate-900 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"),
    ("font-bold text-sm uppercase px-2 py-0.5 border-2 border-black inline-block", "font-bold text-xs uppercase px-2 py-1 rounded-md inline-block shadow-sm"),
    ("p-4 border-2 border-black space-y-4 bg-slate-50/50", "p-4 border border-slate-200 rounded-lg space-y-4 bg-white shadow-sm"),
    ("w-full border-2 border-black p-2 text-xs bg-white text-black outline-none focus:bg-yellow-50", "w-full border border-slate-300 rounded-md p-2 text-xs bg-white text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"),
    ("border-t border-black/10", "border-t border-slate-100"),
    ("w-24 border-2 border-black bg-white text-black font-black p-2 outline-none focus:bg-yellow-50", "w-24 border border-slate-300 rounded-md bg-white text-slate-900 font-bold p-2 outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"),
    ("border-b-2 border-black pb-1", "border-b border-slate-200 pb-2"),
    ("border-2 border-black p-3 flex items-start justify-between bg-white shadow-[2px_2px_0_0_rgba(0,0,0,1)] transition-colors", "border border-slate-200 rounded-lg p-3 flex items-start justify-between bg-white shadow-sm hover:shadow-md transition-all"),
    ("font-bold text-xs uppercase border-2 border-black outline-none bg-white text-black focus:bg-yellow-50 w-full p-2", "font-bold text-xs uppercase border border-slate-300 rounded-md outline-none bg-white text-slate-900 focus:ring-2 focus:ring-blue-500/50 w-full p-2 transition-all"),
    ("font-black text-xs uppercase border-2 border-black bg-white text-black outline-none w-20 p-2 text-center focus:bg-yellow-50", "font-bold text-xs uppercase border border-slate-300 rounded-md bg-white text-slate-900 outline-none w-20 p-2 text-center focus:ring-2 focus:ring-blue-500/50 transition-all"),
    ("font-black text-[10px] uppercase border-2 border-black bg-white text-black outline-none p-1.5 focus:bg-yellow-50", "font-bold text-[10px] uppercase border border-slate-300 rounded bg-white text-slate-900 outline-none p-1.5 focus:ring-2 focus:ring-blue-500/50 transition-all"),
    ("bg-black text-white px-3 py-1.5 text-[10px] font-black uppercase flex items-center hover:bg-slate-800 transition-colors shadow-[2px_2px_0_0_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none", "bg-black text-white px-3 py-1.5 rounded text-[10px] font-bold uppercase flex items-center hover:bg-slate-800 transition-all shadow-sm active:scale-95"),
    ("bg-white border-2 border-black text-black px-3 py-1.5 text-[10px] font-black uppercase flex items-center hover:bg-slate-50 transition-colors shadow-[2px_2px_0_0_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none", "bg-white border border-slate-300 rounded text-slate-700 px-3 py-1.5 text-[10px] font-bold uppercase flex items-center hover:bg-slate-50 transition-all shadow-sm active:scale-95"),
    ("text-xs font-black uppercase border-b-2 border-black pb-1 block", "text-xs font-bold uppercase border-b border-slate-200 pb-2 block text-slate-500"),
    ("p-4 border-2 border-black bg-white min-h-[120px] shadow-inner", "p-4 border border-slate-300 rounded-md bg-white min-h-[120px] shadow-sm"),
    ("p-6 border-t-2 border-black flex gap-3 bg-white shrink-0", "p-6 border-t border-slate-200 flex gap-3 bg-slate-50 shrink-0"),
    ("flex-1 py-3 bg-white border-2 border-black font-black uppercase text-xs hover:bg-slate-100 focus:ring-2 focus:ring-black", "flex-1 py-2.5 bg-white border border-slate-300 rounded-md font-bold uppercase text-xs hover:bg-slate-50 focus:ring-2 focus:ring-blue-500/50 shadow-sm transition-all"),
    ("flex-1 py-3 bg-black text-white border-2 border-black font-black uppercase text-xs hover:bg-slate-800 focus:ring-2 focus:ring-black", "flex-1 py-2.5 bg-black text-white rounded-md font-bold uppercase text-xs hover:bg-slate-800 focus:ring-2 focus:ring-blue-500/50 shadow-sm transition-all"),
    ("flex-1 py-3 bg-white border-2 border-black font-black uppercase text-xs flex items-center justify-center hover:bg-red-500 hover:text-white focus:ring-2 focus:ring-red-500 transition-colors", "flex-1 py-2.5 bg-white border border-red-200 text-red-600 rounded-md font-bold uppercase text-xs flex items-center justify-center hover:bg-red-50 focus:ring-2 focus:ring-red-500/50 shadow-sm transition-all"),
    
    # Milestone modal
    ("bg-white border-4 border-black w-full max-w-sm shadow-[8px_8px_0_0_rgba(0,0,0,1)]", "bg-white border border-slate-100 rounded-xl w-full max-w-sm shadow-2xl"),
    ("border-2 border-black p-3 font-black uppercase text-sm outline-none focus:bg-slate-50 transition-colors", "border border-slate-300 rounded-md p-3 font-bold uppercase text-sm outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"),
    ("border-2 border-black p-3 font-bold uppercase text-sm outline-none focus:bg-slate-50 transition-colors", "border border-slate-300 rounded-md p-3 font-bold uppercase text-sm outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"),
    ("px-4 py-2 border-2 transition-colors ${editMilestoneDraft.icon !== 'flag' ? 'border-black bg-slate-50 shadow-[2px_2px_0_0_rgba(0,0,0,1)]' : 'border-black/20 hover:bg-slate-50'}", "px-4 py-2 border rounded-md transition-colors ${editMilestoneDraft.icon !== 'flag' ? 'border-blue-500 ring-1 ring-blue-500 bg-blue-50' : 'border-slate-200 hover:bg-slate-50'}"),
    ("w-3 h-3 bg-white border border-black rotate-45", "w-3 h-3 bg-white border border-slate-400 shadow-sm rotate-45"),
    ("px-4 py-2 border-2 transition-colors ${editMilestoneDraft.icon === 'flag' ? 'border-black bg-slate-50 shadow-[2px_2px_0_0_rgba(0,0,0,1)]' : 'border-black/20 hover:bg-slate-50'}", "px-4 py-2 border rounded-md transition-colors ${editMilestoneDraft.icon === 'flag' ? 'border-blue-500 ring-1 ring-blue-500 bg-blue-50' : 'border-slate-200 hover:bg-slate-50'}"),
    ("border-2 hover:bg-slate-50 transition-colors ${editMilestoneDraft.color === c.value || (!editMilestoneDraft.color && c.value === '#dc2626') ? 'border-black bg-slate-50 shadow-[2px_2px_0_0_rgba(0,0,0,1)]' : 'border-black/20'}", "border rounded-md hover:bg-slate-50 transition-all ${editMilestoneDraft.color === c.value || (!editMilestoneDraft.color && c.value === '#dc2626') ? 'border-blue-500 ring-1 ring-blue-500 bg-slate-50 shadow-sm' : 'border-slate-200'}"),
    ("w-3 h-3 rounded-full border border-black", "w-3 h-3 rounded-full border border-black/10 shadow-sm"),
    ("border-t-2 border-black/10 mt-6", "border-t border-slate-100 mt-6"),
    ("bg-black text-white px-6 py-2.5 border-2 border-black font-black uppercase text-[10px] tracking-widest hover:bg-slate-800 transition-colors shadow-[2px_2px_0_0_rgba(0,0,0,1)] active:shadow-none active:translate-x-0.5 active:translate-y-0.5", "bg-black text-white rounded-md px-6 py-2.5 font-bold uppercase text-[10px] tracking-widest hover:bg-slate-800 shadow-md transition-all active:scale-95"),

    # Main Toolbar
    ("bg-white border-b-2 border-black z-50 shrink-0", "bg-white border-b border-slate-200 shadow-sm z-50 shrink-0"),
    ("w-10 h-10 bg-black flex items-center justify-center text-white border-2 border-black shadow-[3px_3px_0_0_rgba(0,0,0,1)] transition-transform group-hover:translate-x-0.5 group-hover:translate-y-0.5 group-hover:shadow-none", "w-10 h-10 rounded-md bg-black flex items-center justify-center text-white shadow-sm transition-transform group-hover:scale-95"),
    ("border-2 border-black px-2 py-1.5 bg-slate-50", "border border-slate-200 rounded-md shadow-inner px-2 py-1.5 bg-slate-50/50"),
    ("border-2 border-black px-4 py-2 bg-slate-50", "border border-slate-200 rounded-md shadow-sm px-4 py-2 bg-white"),
    ("px-6 py-2.5 bg-black text-white border-2 border-black font-black uppercase text-[10px] hover:bg-slate-800 transition-colors flex items-center", "px-6 py-2 bg-black rounded-md text-white font-bold uppercase text-[10px] hover:bg-slate-800 shadow-md transition-all flex items-center"),
    ("p-2 border-2 border-black bg-white hover:bg-slate-50 transition-colors focus:ring-2 focus:ring-black", "p-2 border border-slate-200 shadow-sm rounded-md bg-white hover:bg-slate-50 text-slate-600 transition-all focus:ring-2 focus:ring-blue-500/50"),
    
    # Main grid & lane headers
    ("w-40 bg-white flex flex-col shrink-0 z-40 border-r-2 border-black shadow-[2px_0_10px_rgba(0,0,0,0.02)]", "w-40 bg-slate-50 flex flex-col shrink-0 z-40 border-r border-slate-200"),
    ("bg-slate-50 border-b-2 border-black flex flex-col justify-end p-4", "bg-slate-50 flex flex-col justify-end p-4"),
    ("sticky top-0 z-[60] border-b-2 border-black flex flex-col bg-white/95 backdrop-blur-sm", "sticky top-0 z-[60] flex flex-col bg-white shadow-sm"),
    ("flex h-[36px] border-b-2 border-black bg-white", "flex h-[36px] border-b border-slate-200 bg-white"),
    ("border-r-2 border-black/5", "border-r border-slate-100"),
    ("flex h-[32px] border-b-2 border-black/5 text-orange-700 bg-orange-50", "flex h-[32px] border-b border-slate-100 text-slate-700 bg-slate-50/50"),
    ("flex h-[28px] border-b-2 border-black/5 bg-slate-50", "flex h-[28px] border-b border-slate-100 bg-white"),
    ("flex h-[28px] bg-white border-b-2 border-black/10", "flex h-[28px] bg-white border-b border-slate-200"),
    
    # Milestone render
    ("bg-white border-[1.5px] border-black rotate-45 shadow-[1px_1px_0_0_rgba(0,0,0,1)]", "bg-white border-[1.5px] border-slate-400 rounded-sm rotate-45 shadow-sm"),
    ("drop-shadow-[1px_1px_0_rgba(0,0,0,1)]", "drop-shadow-sm"),
    ("border border-black shadow-sm opacity-90 transition-opacity hover:opacity-100", "border border-slate-200 rounded text-slate-600 shadow-sm opacity-90 transition-all hover:bg-slate-800 hover:text-white hover:border-slate-800 hover:opacity-100 hover:scale-105"),
    
    # Phase rendering (Timeline grid)
    ("border-l-2 border-dashed border-orange-500/50", "border-l border-dashed border-slate-300"),
    ("absolute border-2 border-black flex items-center px-3 shadow-[2px_2px_0_0_rgba(0,0,0,1)] bg-white transition-transform hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none pointer-events-auto", "absolute rounded flex items-center px-3 shadow-sm bg-white border border-transparent hover:border-slate-300 transition-all hover:shadow-md pointer-events-auto"),
    ("text-[9px] font-black uppercase whitespace-normal break-words leading-none", "text-[10px] font-bold uppercase whitespace-normal break-words leading-none tracking-tight"),
    ("absolute pointer-events-auto border-2 border-black bg-white shadow-[3px_3px_0_0_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all cursor-pointer overflow-hidden flex focus:ring-2 focus:ring-black", "absolute pointer-events-auto border border-slate-200 bg-white rounded-md shadow-sm hover:shadow-md hover:border-blue-400 transition-all cursor-pointer overflow-hidden flex focus:outline-none focus:ring-2 focus:ring-blue-500/50"),
    ("bg-white/95 backdrop-blur-sm", "bg-white"),
    ("border-b-[3px] border-slate-800", "border-b border-slate-200"),
    ("border-b border-black/5", "border-b border-transparent hover:bg-slate-50 transition-colors"),
    ("h-[120px] justify-center border-b-[3px] border-slate-800 relative", "h-[120px] justify-center border-b border-slate-200 relative"),

    # Overlaps
    ("border-2 border-red-500/50", "border border-red-200 rounded"),
    
    # Settings modal bottom
    ("border-t-4 border-black pt-12", "border-t border-slate-200 pt-12"),
    ("border-2 border-black p-6 bg-slate-50 shadow-[4px_4px_0_0_rgba(0,0,0,1)]", "border border-slate-200 rounded-xl p-6 bg-white shadow-xl"),
    ("bg-white border-2 border-black p-3 outline-none uppercase shadow-inner", "bg-white border border-slate-300 rounded-md p-3 outline-none uppercase shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"),
    ("margin-y", "my"),
    ("shadow-[-4px_0_0_0_rgba(0,0,0,1)]", "shadow-xl"),
    ("border-2 border-black bg-white shadow-[2px_2px_0_0_rgba(0,0,0,1)] transition-transform hover:scale-[1.02]", "border border-slate-200 rounded-lg bg-white shadow-sm transition-all hover:shadow-md hover:border-slate-300"),
    ("w-8 h-8 border-2 border-black bg-transparent cursor-pointer", "w-8 h-8 border border-slate-300 rounded cursor-pointer shadow-sm"),
    ("font-bold uppercase text-[10px] outline-none border-b border-transparent focus:border-black bg-transparent", "font-bold uppercase text-[10px] outline-none border-b border-slate-300 focus:border-blue-500 bg-transparent text-slate-700")

]

for old, new in replacements:
    code = code.replace(old, new)

with open(file_path, "w") as f:
    f.write(code)

print("Styles soft-replaced successfully.")
