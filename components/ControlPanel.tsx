
import React from 'react';
import { AppSettings, DitherMethod, DotShape } from '../types';
import { RefreshCcw, Download, Image as ImageIcon, Zap, Type, AlignLeft } from 'lucide-react';

interface Props {
  settings: AppSettings;
  updateSettings: (s: Partial<AppSettings>) => void;
  onDownload: () => void;
  onOpenAIModal: () => void;
  onUploadClick: () => void;
  onGenerateText: () => void;
  isProcessing: boolean;
}

const ControlPanel: React.FC<Props> = ({ 
  settings, 
  updateSettings, 
  onDownload, 
  onOpenAIModal, 
  onUploadClick,
  onGenerateText,
  isProcessing 
}) => {
  
  const fonts = [
      { name: 'Space Mono', value: 'Space Mono' },
      { name: 'Courier Prime', value: 'Courier Prime' },
      { name: 'Press Start 2P', value: 'Press Start 2P' },
      { name: 'Inter', value: 'Inter' },
      { name: 'Playfair Display', value: 'Playfair Display' },
  ];

  return (
    <div className="w-full md:w-80 bg-stone-900 text-stone-300 border-r border-stone-700 flex flex-col h-full overflow-y-auto custom-scrollbar">
      {/* Header */}
      <div className="p-6 border-b border-stone-700 bg-stone-950 sticky top-0 z-10">
        <h1 className="text-xl font-bold tracking-tighter text-emerald-500 font-mono">
          DOT_MATRIX_LAB
        </h1>
        <p className="text-xs text-stone-500 mt-1">v.1.4.0 // INK_BLEED_ENABLED</p>
      </div>

      <div className="p-6 space-y-8">
        
        {/* Actions */}
        <div className="grid grid-cols-2 gap-2">
           <button 
            onClick={onUploadClick}
            className="flex items-center justify-center gap-2 p-3 bg-stone-800 hover:bg-stone-700 border border-stone-600 rounded-sm text-xs font-bold transition-all"
          >
            <ImageIcon size={14} /> UPLOAD IMG
          </button>
          <button 
            onClick={onOpenAIModal}
            className="flex items-center justify-center gap-2 p-3 bg-emerald-900/30 hover:bg-emerald-900/50 border border-emerald-700 text-emerald-400 rounded-sm text-xs font-bold transition-all"
          >
            <Zap size={14} /> AI GENERATE
          </button>
        </div>

        {/* Sliders */}
        <div className="space-y-4">
          <label className="text-xs font-bold uppercase text-stone-500">Canvas & Image</label>
           
           <div className="grid grid-cols-2 gap-2">
             <div className="space-y-1">
              <label className="text-[10px] font-mono block">WIDTH (PX)</label>
              <input 
                type="number" min="100" max="2000"
                value={settings.outputWidth}
                onChange={(e) => updateSettings({ outputWidth: parseInt(e.target.value) || 100 })}
                className="w-full bg-stone-800 border border-stone-600 p-1 text-xs font-mono focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div className="space-y-1">
               <label className="text-[10px] font-mono block">HEIGHT (PX)</label>
               <input 
                type="number" min="100" max="2000"
                value={settings.outputHeight}
                onChange={(e) => updateSettings({ outputHeight: parseInt(e.target.value) || 100 })}
                className="w-full bg-stone-800 border border-stone-600 p-1 text-xs font-mono focus:border-emerald-500 focus:outline-none"
              />
            </div>
           </div>

          <div className="space-y-1">
            <div className="flex justify-between text-xs font-mono">
              <span>CONTRAST</span>
              <span>{settings.contrast.toFixed(1)}</span>
            </div>
            <input 
              type="range" min="0" max="3" step="0.1"
              value={settings.contrast}
              onChange={(e) => updateSettings({ contrast: parseFloat(e.target.value) })}
              className="w-full accent-emerald-500 h-1 bg-stone-700 rounded-lg appearance-none cursor-pointer"
            />
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-mono">
              <span>BRIGHTNESS</span>
              <span>{settings.brightness.toFixed(1)}</span>
            </div>
            <input 
              type="range" min="-1" max="1" step="0.1"
              value={settings.brightness}
              onChange={(e) => updateSettings({ brightness: parseFloat(e.target.value) })}
              className="w-full accent-emerald-500 h-1 bg-stone-700 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>

        {/* Text Tools */}
        <div className="space-y-3 pt-4 border-t border-stone-800">
           <div className="flex justify-between items-center">
             <label className="text-xs font-bold uppercase text-stone-500 flex items-center gap-2">
                <AlignLeft size={12}/> Text Overlay
             </label>
             <input 
                type="checkbox" 
                checked={settings.showText} 
                onChange={(e) => updateSettings({ showText: e.target.checked })}
                className="w-4 h-4 accent-emerald-500 bg-stone-800 border-stone-600 rounded"
              />
           </div>

           {settings.showText && (
             <div className="space-y-3 p-3 bg-stone-800/30 rounded border border-stone-700">
                <textarea 
                  value={settings.text}
                  onChange={(e) => updateSettings({ text: e.target.value })}
                  className="w-full h-16 bg-stone-900 border border-stone-600 text-[10px] p-2 text-stone-300 font-mono resize-none focus:border-emerald-500 focus:outline-none"
                  placeholder="Enter text here..."
                />

                <div className="space-y-1">
                    <label className="text-[10px] block">FONT FAMILY</label>
                    <select 
                        value={settings.fontFamily}
                        onChange={(e) => updateSettings({ fontFamily: e.target.value })}
                        className="w-full bg-stone-900 border border-stone-600 p-1 text-[10px] font-mono focus:border-emerald-500 focus:outline-none"
                    >
                        {fonts.map(f => (
                            <option key={f.value} value={f.value}>{f.name}</option>
                        ))}
                    </select>
                </div>
                
                <div className="space-y-2">
                   <div className="flex items-center justify-between text-[10px]">
                      <span>SIZE: {settings.textSize}px</span>
                      <input 
                        type="range" min="8" max="200" 
                        value={settings.textSize}
                        onChange={(e) => updateSettings({ textSize: parseInt(e.target.value) })}
                        className="w-20 accent-emerald-500 h-1 bg-stone-600 rounded cursor-pointer"
                      />
                   </div>
                   <div className="flex items-center justify-between text-[10px]">
                      <span>POS X: {settings.textX}</span>
                      <input 
                        type="range" min="0" max={settings.outputWidth} 
                        value={settings.textX}
                        onChange={(e) => updateSettings({ textX: parseInt(e.target.value) })}
                        className="w-20 accent-emerald-500 h-1 bg-stone-600 rounded cursor-pointer"
                      />
                   </div>
                   <div className="flex items-center justify-between text-[10px]">
                      <span>POS Y: {settings.textY}</span>
                      <input 
                        type="range" min="0" max={settings.outputHeight} 
                        value={settings.textY}
                        onChange={(e) => updateSettings({ textY: parseInt(e.target.value) })}
                        className="w-20 accent-emerald-500 h-1 bg-stone-600 rounded cursor-pointer"
                      />
                   </div>
                   <div className="flex items-center justify-between text-[10px] pt-1">
                      <span>TEXT COLOR</span>
                      <button 
                         onClick={() => updateSettings({ textDark: !settings.textDark })}
                         className={`px-2 py-0.5 border ${settings.textDark ? 'bg-black text-white border-stone-500' : 'bg-white text-black border-white'} text-[9px] uppercase`}
                      >
                         {settings.textDark ? 'DARK' : 'LIGHT'}
                      </button>
                   </div>
                </div>

                <button 
                  onClick={onGenerateText}
                  className="w-full py-1 text-[9px] border border-stone-600 hover:border-emerald-500 hover:text-emerald-500 transition-colors flex items-center justify-center gap-1"
                >
                   <Type size={10}/> AI GENERATE LABEL
                </button>
             </div>
           )}
        </div>

        {/* Dither Settings */}
        <div className="space-y-3 pt-4 border-t border-stone-800">
          <label className="text-xs font-bold uppercase text-stone-500">Methodology</label>
          <div className="space-y-2">
             <div className="space-y-1">
                <div className="flex justify-between text-xs font-mono">
                  <span>DOT_SIZE / GAP</span>
                  <span>{settings.pixelSize}px / {settings.gap}px</span>
                </div>
                <div className="flex gap-2">
                    <input 
                    type="range" min="2" max="30" step="1"
                    title="Dot Size"
                    value={settings.pixelSize}
                    onChange={(e) => updateSettings({ pixelSize: parseInt(e.target.value) })}
                    className="w-full accent-emerald-500 h-1 bg-stone-700 rounded-lg appearance-none cursor-pointer"
                    />
                     <input 
                    type="range" min="0" max="10" step="1"
                    title="Gap"
                    value={settings.gap}
                    onChange={(e) => updateSettings({ gap: parseInt(e.target.value) })}
                    className="w-1/3 accent-emerald-500 h-1 bg-stone-700 rounded-lg appearance-none cursor-pointer"
                    />
                </div>
              </div>

              <select 
                value={settings.ditherMethod}
                onChange={(e) => updateSettings({ ditherMethod: e.target.value as DitherMethod })}
                className="w-full bg-stone-800 border border-stone-600 p-2 text-xs font-mono focus:border-emerald-500 focus:outline-none"
              >
                {Object.values(DitherMethod).map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
          </div>
        </div>

        {/* Style Options */}
        <div className="space-y-3">
          <label className="text-xs font-bold uppercase text-stone-500">Geometry</label>
           <div className="grid grid-cols-4 gap-1">
            {Object.values(DotShape).map((shape) => (
              <button
                key={shape}
                onClick={() => updateSettings({ dotShape: shape })}
                className={`text-[9px] py-2 border ${settings.dotShape === shape ? 'bg-emerald-900/40 border-emerald-500 text-emerald-400' : 'border-stone-700 hover:bg-stone-800'}`}
                title={shape}
              >
                {shape === 'ASCII' ? 'ASC' : shape.slice(0, 4)}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
           <label className="text-xs font-bold uppercase text-stone-500">Appearance</label>
           
           <div className="space-y-1">
            <div className="flex justify-between text-xs font-mono">
              <span className="flex items-center gap-1"><Zap size={10}/> INK BLEED (FUSION)</span>
              <span>{settings.inkBleed}px</span>
            </div>
            <input 
              type="range" min="0" max="15" step="0.5"
              value={settings.inkBleed}
              onChange={(e) => updateSettings({ inkBleed: parseFloat(e.target.value) })}
              className="w-full accent-emerald-500 h-1 bg-stone-700 rounded-lg appearance-none cursor-pointer"
            />
            <p className="text-[9px] text-stone-500">Set > 0 for liquid/gooey fusion effect.</p>
          </div>

           <div className="flex flex-col gap-2 pt-2">
              <div className="flex items-center gap-2">
                <input 
                    type="checkbox" 
                    id="inv" 
                    checked={settings.inverted} 
                    onChange={(e) => updateSettings({ inverted: e.target.checked })}
                    className="w-4 h-4 accent-emerald-500 bg-stone-800 border-stone-600 rounded"
                />
                <label htmlFor="inv" className="text-xs">INVERT COLORS</label>
              </div>
              <div className="flex items-center gap-2">
                <input 
                    type="checkbox" 
                    id="trans" 
                    checked={settings.transparentBackground} 
                    onChange={(e) => updateSettings({ transparentBackground: e.target.checked })}
                    className="w-4 h-4 accent-emerald-500 bg-stone-800 border-stone-600 rounded"
                />
                <label htmlFor="trans" className="text-xs">TRANSPARENT BG</label>
              </div>
           </div>
           
           <div className="grid grid-cols-2 gap-2 mt-2">
             <div>
               <label className="text-[10px] block mb-1">INK COLOR</label>
               <input 
                  type="color" 
                  value={settings.foregroundColor}
                  onChange={(e) => updateSettings({ foregroundColor: e.target.value })}
                  className="w-full h-8 bg-stone-800 border border-stone-600 p-0"
                />
             </div>
             <div>
               <label className={`text-[10px] block mb-1 ${settings.transparentBackground ? 'text-stone-600' : ''}`}>PAPER COLOR</label>
               <input 
                  type="color" 
                  value={settings.backgroundColor}
                  onChange={(e) => updateSettings({ backgroundColor: e.target.value })}
                  disabled={settings.transparentBackground}
                  className={`w-full h-8 bg-stone-800 border border-stone-600 p-0 ${settings.transparentBackground ? 'opacity-30 cursor-not-allowed' : ''}`}
                />
             </div>
           </div>
        </div>

        {/* Output */}
        <div className="pt-4 border-t border-stone-700">
          <button 
            onClick={onDownload}
            disabled={isProcessing}
            className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-black font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? <RefreshCcw className="animate-spin" size={16} /> : <Download size={16} />}
            EXPORT_LABEL.PNG
          </button>
        </div>

      </div>
    </div>
  );
};

export default ControlPanel;
