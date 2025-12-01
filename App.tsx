
import React, { useState, useEffect, useRef, useCallback } from 'react';
import ControlPanel from './components/ControlPanel';
import AIModal from './components/AIModal';
import { AppSettings, DEFAULT_SETTINGS } from './types';
import { processImage } from './utils/imageProcessing';
import { generateLabelText } from './services/geminiService';
import { Layout } from 'lucide-react';

const STORAGE_KEY = 'dot_matrix_lab_settings_v1.4';

const App: React.FC = () => {
  // Initialize settings from localStorage if available, otherwise use defaults
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        // Merge saved settings with DEFAULT_SETTINGS to ensure backward compatibility
        return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.warn("Failed to load settings from storage:", e);
    }
    return DEFAULT_SETTINGS;
  });

  const [sourceImage, setSourceImage] = useState<HTMLImageElement | null>(null);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  
  // Refs for canvases
  const sourceCanvasRef = useRef<HTMLCanvasElement>(null);
  const destCanvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    }, 500); // Debounce to prevent excessive writing during slider dragging
    return () => clearTimeout(timeoutId);
  }, [settings]);

  // Load initial demo image
  useEffect(() => {
    const img = new Image();
    img.src = 'https://picsum.photos/800/800'; // Placeholder
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      setSourceImage(img);
    };
  }, []);

  // Processing Effect
  useEffect(() => {
    if (sourceImage && sourceCanvasRef.current && destCanvasRef.current) {
      setIsProcessing(true);
      // Small timeout to allow UI to update to "processing" state if heavy
      setTimeout(() => {
        // Draw image to source canvas first
        const sCanvas = sourceCanvasRef.current!;
        const ctx = sCanvas.getContext('2d');
        if (ctx) {
           sCanvas.width = sourceImage.width;
           sCanvas.height = sourceImage.height;
           ctx.drawImage(sourceImage, 0, 0);
           
           processImage(sCanvas, destCanvasRef.current!, settings);
        }
        setIsProcessing(false);
      }, 10);
    }
  }, [sourceImage, settings]);

  const handleUpdateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => setSourceImage(img);
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleAIImageGenerated = (dataUrl: string) => {
    const img = new Image();
    img.onload = () => setSourceImage(img);
    img.src = dataUrl;
  };

  const handleDownload = () => {
    if (destCanvasRef.current) {
      const link = document.createElement('a');
      link.download = `label-art-${Date.now()}.png`;
      link.href = destCanvasRef.current.toDataURL('image/png');
      link.click();
    }
  };

  const handleGenerateText = async () => {
    const txt = await generateLabelText("a generic cool retro product");
    handleUpdateSettings({ text: txt });
  };
  
  // Drag and Drop handlers
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
       const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => setSourceImage(img);
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(e.dataTransfer.files[0]);
    }
  }, []);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#BCCDCB]">
      {/* Hidden File Input */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileUpload} 
        className="hidden" 
        accept="image/*"
      />
      
      {/* Left Control Panel */}
      <ControlPanel 
        settings={settings}
        updateSettings={handleUpdateSettings}
        onDownload={handleDownload}
        onOpenAIModal={() => setIsAIModalOpen(true)}
        onUploadClick={() => fileInputRef.current?.click()}
        onGenerateText={handleGenerateText}
        isProcessing={isProcessing}
      />

      {/* Main Preview Area */}
      <main 
        className="flex-1 flex flex-col relative"
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        {/* Top Bar */}
        <div className="h-12 bg-[#BCCDCB] border-b border-[#AAB9B7] flex items-center justify-between px-6 text-[#1A1A1A] font-mono text-xs">
            <span className="flex items-center gap-2 uppercase tracking-widest font-bold">
               <Layout size={14}/> WORKSPACE_VIEW
            </span>
            <span className="opacity-50">CANVAS_ID: {Math.floor(Math.random() * 9999)}</span>
        </div>

        {/* Canvas Container */}
        <div className="flex-1 overflow-auto p-8 flex items-center justify-center relative bg-[radial-gradient(#AAB9B7_1px,transparent_1px)] [background-size:20px_20px]">
           
           {/* Drop Zone Overlay */}
           {dragActive && (
              <div className="absolute inset-0 bg-emerald-500/20 z-50 flex items-center justify-center border-4 border-emerald-500 border-dashed m-4 rounded">
                  <p className="text-2xl font-bold text-emerald-900 bg-white/50 px-4 py-2">DROP IMAGE HERE</p>
              </div>
           )}

           <div className="shadow-2xl bg-white p-4 max-w-full max-h-full overflow-auto border-2 border-stone-800">
              {/* Product Info Header Mockup - simplified now that text is in canvas */}
              <div className="flex justify-between items-end border-b-2 border-black pb-2 mb-4 font-mono">
                  <div>
                      <h2 className="text-xl font-bold uppercase">PREVIEW</h2>
                      <p className="text-xs">RES: {settings.outputWidth}x{settings.outputHeight}px</p>
                  </div>
                  <div className="text-right">
                      <div className="w-8 h-8 bg-black"></div>
                  </div>
              </div>

              {/* The Result Canvas */}
              <canvas ref={destCanvasRef} className="block max-w-full mx-auto" style={{imageRendering: 'pixelated'}} />
              
              {/* Footer Mockup */}
              <div className="mt-4 pt-2 border-t border-black flex justify-between text-[10px] font-mono uppercase">
                  <span>/nonastery_of_truth</span>
                  <span>IMP-24</span>
              </div>
           </div>
        </div>

        {/* Hidden Source Canvas for processing */}
        <canvas ref={sourceCanvasRef} className="hidden" />
      </main>

      {/* AI Modal */}
      <AIModal 
        isOpen={isAIModalOpen}
        onClose={() => setIsAIModalOpen(false)}
        onImageGenerated={handleAIImageGenerated}
      />
    </div>
  );
};

export default App;
