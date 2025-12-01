import React, { useState } from 'react';
import { X, Loader2, Sparkles } from 'lucide-react';
import { generateAIImage } from '../services/geminiService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onImageGenerated: (dataUrl: string) => void;
}

const AIModal: React.FC<Props> = ({ isOpen, onClose, onImageGenerated }) => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setError('');
    
    try {
      const dataUrl = await generateAIImage(prompt);
      onImageGenerated(dataUrl);
      onClose();
    } catch (e: any) {
      setError(e.message || "Failed to generate image. Check API Key.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-stone-900 border border-stone-600 w-full max-w-md shadow-2xl relative">
        <button onClick={onClose} className="absolute top-2 right-2 text-stone-500 hover:text-white">
          <X size={20} />
        </button>
        
        <div className="p-6">
            <h2 className="text-xl font-mono font-bold text-emerald-500 mb-1 flex items-center gap-2">
                <Sparkles size={18}/> NEURAL_IMAGER
            </h2>
            <p className="text-xs text-stone-400 mb-6">Generates high-contrast assets optimized for thermal printing.</p>

            <div className="space-y-4">
                <div>
                    <label className="block text-xs font-bold text-stone-300 mb-2">PROMPT INPUT</label>
                    <textarea 
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="e.g. A cybernetic skull, a vintage coffee pot, a geometric cat..."
                        className="w-full h-24 bg-stone-950 border border-stone-700 text-stone-200 p-3 text-sm focus:border-emerald-500 focus:outline-none font-mono resize-none"
                    />
                </div>

                {error && (
                    <div className="p-2 bg-red-900/20 border border-red-800 text-red-400 text-xs">
                        ERROR: {error}
                    </div>
                )}

                <button 
                    onClick={handleGenerate}
                    disabled={loading || !prompt}
                    className="w-full py-3 bg-emerald-700 hover:bg-emerald-600 disabled:bg-stone-800 disabled:text-stone-600 text-white font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all"
                >
                    {loading ? <Loader2 className="animate-spin" size={16} /> : 'INITIALIZE GENERATION'}
                </button>
            </div>
        </div>
        
        <div className="bg-stone-950 p-3 border-t border-stone-800 text-[10px] text-stone-600 text-center font-mono">
            POWERED BY GEMINI 2.5 FLASH / 3 PRO
        </div>
      </div>
    </div>
  );
};

export default AIModal;