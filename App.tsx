
import React, { useState, useEffect, useRef } from 'react';
import { analyzeChart } from './services/geminiService';
import { AnalysisResultCard } from './components/AnalysisResultCard';
import { TradeStats } from './components/TradeStats';
import { AnalysisResult, TradeRecord } from './types';
import { Camera, Send, Sparkles, AlertCircle, X, Plus, Trash2, Download, Share, MoreVertical } from 'lucide-react';

const App: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [trades, setTrades] = useState<TradeRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const MAX_IMAGES = 9;

  // Load trades from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem('cryptoGuard_trades');
    if (saved) {
      try {
        setTrades(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load trades", e);
      }
    }
  }, []);

  // Save trades to local storage whenever they change
  useEffect(() => {
    localStorage.setItem('cryptoGuard_trades', JSON.stringify(trades));
  }, [trades]);

  // Check if running in standalone mode (already installed)
  useEffect(() => {
    const checkStandalone = () => {
      const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches ||
                             (window.navigator as any).standalone === true;
      setIsStandalone(isStandaloneMode);
    };
    checkStandalone();
    window.addEventListener('resize', checkStandalone); // Sometimes orientation change triggers mode change
    return () => window.removeEventListener('resize', checkStandalone);
  }, []);

  // Handle PWA Install Prompt (Chrome/Android)
  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setInstallPrompt(e);
      // We don't rely solely on this anymore for button visibility, 
      // but we capture it to trigger the native prompt if available.
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (installPrompt) {
      // If the browser provided a native prompt, use it
      installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;
      if (outcome === 'accepted') {
        setInstallPrompt(null);
      }
    } else {
      // Otherwise (iOS, or Android without prompt ready), show manual instructions
      setShowInstallModal(true);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const currentCount = selectedImages.length;
      const fileArray = Array.from(files) as File[];
      
      if (currentCount + fileArray.length > MAX_IMAGES) {
        setError(`最多只能上传 ${MAX_IMAGES} 张图片。您当前选择了 ${currentCount} 张，尝试上传 ${fileArray.length} 张，超出了限制。`);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        return;
      }
      
      setError(null);

      const promises = fileArray.map(file => {
        return new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
             resolve(reader.result as string);
          };
          reader.readAsDataURL(file);
        });
      });

      Promise.all(promises).then(newImages => {
        setSelectedImages(prev => [...prev, ...newImages]);
      });

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const clearAllImages = () => {
    setSelectedImages([]);
    setError(null);
  };

  const handleAnalyze = async () => {
    if (!inputText && selectedImages.length === 0) return;

    setIsAnalyzing(true);
    setError(null);
    setAnalysisResult(null);

    try {
      const result = await analyzeChart(inputText, selectedImages);
      setAnalysisResult(result);
    } catch (err: any) {
        setError(err.message || "分析失败，请重试。");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const addTrade = (trade: Omit<TradeRecord, 'id' | 'timestamp'>) => {
    const newRecord: TradeRecord = {
      ...trade,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    };
    setTrades([newRecord, ...trades]);
  };

  const handleImportTrades = (importedTrades: TradeRecord[]) => {
    setTrades(prev => [...importedTrades, ...prev]);
  };

  const deleteTrade = (id: string) => {
    setTrades(trades.filter(t => t.id !== id));
  };

  const resetRecords = () => {
    if (confirm("确定要删除所有交易历史记录吗？")) {
      setTrades([]);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 selection:bg-blue-500/30">
      
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-600 rounded-lg shadow-lg shadow-blue-500/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white">
              Crypto<span className="text-blue-500">Guard</span> <span className="text-slate-500 font-normal hidden sm:inline">智能分析师</span>
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Install Button - Visible if NOT standalone */}
            {!isStandalone && (
              <button
                onClick={handleInstallClick}
                className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center shadow-lg shadow-blue-500/20 animate-pulse"
              >
                <Download className="w-3 h-3 mr-1.5" />
                安装应用
              </button>
            )}
            <div className="text-xs text-slate-500 font-mono hidden sm:block">
              Gemini 2.5 Flash • 在线
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Input & Analysis (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Input Area */}
            <div className="bg-slate-900 rounded-xl border border-slate-800 p-1 shadow-lg">
              <div className="p-4 space-y-4">
                 
                 {/* Image Preview Grid */}
                 {selectedImages.length > 0 && (
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between items-center text-xs text-slate-400 px-1">
                      <span>已选图片 ({selectedImages.length}/{MAX_IMAGES})</span>
                      <button 
                        onClick={clearAllImages}
                        className="text-slate-500 hover:text-rose-400 transition-colors flex items-center"
                        title="移除所有图片"
                      >
                        <Trash2 className="w-3 h-3 mr-1" /> 清空
                      </button>
                    </div>
                    <div className={`grid gap-2 ${selectedImages.length === 1 ? 'grid-cols-1' : 'grid-cols-3'}`}>
                      {selectedImages.map((img, index) => (
                        <div key={index} className={`relative rounded-lg overflow-hidden border border-slate-800 group ${selectedImages.length === 1 ? 'h-64' : 'h-24'}`}>
                          <img src={img} alt={`Chart ${index + 1}`} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors pointer-events-none" />
                          <button 
                            onClick={() => removeImage(index)}
                            className="absolute top-1 right-1 bg-black/50 hover:bg-rose-500 text-white p-1.5 rounded-full backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                            title="移除此图片"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                      {/* Add Button in Grid if < MAX_IMAGES */}
                      {selectedImages.length < MAX_IMAGES && (
                        <button 
                          onClick={() => fileInputRef.current?.click()}
                          className="h-full min-h-[6rem] rounded-lg border border-dashed border-slate-700 hover:border-blue-500/50 hover:bg-slate-800/50 flex flex-col items-center justify-center text-slate-500 hover:text-blue-400 transition-all"
                        >
                          <Plus className="w-6 h-6 mb-1" />
                          <span className="text-xs">添加</span>
                        </button>
                      )}
                    </div>
                  </div>
                 )}

                 <textarea
                  className="w-full bg-transparent text-slate-200 placeholder-slate-600 focus:outline-none resize-none font-mono text-sm h-24"
                  placeholder="粘贴市场数据，描述图表，或上传截图（最多9张）..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                 />

                 <div className="flex justify-between items-center pt-2 border-t border-slate-800">
                    <div className="flex items-center space-x-2">
                       <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept="image/*"
                        multiple // Allow multiple file selection
                        onChange={handleFileChange}
                       />
                       <button 
                        onClick={() => fileInputRef.current?.click()}
                        className={`p-2 hover:bg-slate-800 rounded-lg transition-colors tooltip flex items-center gap-2 ${selectedImages.length >= MAX_IMAGES ? 'text-slate-600 cursor-not-allowed' : 'text-slate-400 hover:text-blue-400'}`}
                        title="上传图表截图"
                        disabled={selectedImages.length >= MAX_IMAGES}
                       >
                         <Camera className="w-5 h-5" />
                         <span className="text-xs font-mono">{selectedImages.length}/{MAX_IMAGES}</span>
                       </button>
                    </div>
                    <button
                      onClick={handleAnalyze}
                      disabled={isAnalyzing || (!inputText && selectedImages.length === 0)}
                      className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-600 text-white px-4 py-2 rounded-lg font-medium transition-all shadow-lg shadow-blue-500/20 disabled:shadow-none"
                    >
                      {isAnalyzing ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          <span>分析中...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>开始分析</span>
                        </>
                      )}
                    </button>
                 </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 px-4 py-3 rounded-lg flex items-center">
                 <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                 <span>{error}</span>
              </div>
            )}

            {/* Result Display */}
            <AnalysisResultCard data={analysisResult} isLoading={isAnalyzing} />

          </div>

          {/* Right Column: History & Stats (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <TradeStats 
              trades={trades} 
              onReset={resetRecords} 
              onAddTrade={addTrade}
              onDeleteTrade={deleteTrade}
              onImportTrades={handleImportTrades}
            />
            
            {/* Disclaimer */}
            <div className="text-xs text-slate-600 text-center leading-relaxed px-4">
              <p>免责声明：CryptoGuard 智能分析基于模式识别和既定约束。合约交易风险极高，本分析不构成财务建议。</p>
            </div>
          </div>

        </div>
      </main>

      {/* Manual Install Instruction Modal */}
      {showInstallModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-slate-800 rounded-xl max-w-sm w-full p-6 border border-slate-700 relative shadow-2xl">
            <button 
              onClick={() => setShowInstallModal(false)} 
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-bold text-white mb-4 flex items-center">
              <Download className="w-5 h-5 mr-2 text-blue-500" />
              如何安装应用
            </h3>
            
            <div className="space-y-6">
              {/* iOS Instructions */}
              <div className="space-y-2">
                 <div className="flex items-center text-slate-200 font-medium">
                   <span className="bg-slate-700 px-2 py-0.5 rounded text-xs mr-2 text-slate-300">iOS (Safari)</span>
                 </div>
                 <ol className="text-sm text-slate-400 space-y-2 list-decimal list-inside pl-1">
                   <li>点击底部导航栏的 <Share className="w-4 h-4 inline mx-1 text-blue-400" /> <span className="text-slate-300">分享按钮</span></li>
                   <li>向下滑动并选择 <span className="text-white font-bold bg-slate-700/50 px-1 rounded">添加到主屏幕</span></li>
                   <li>点击右上角的 <span className="text-white font-bold">添加</span></li>
                 </ol>
              </div>

              <div className="h-px bg-slate-700/50"></div>

              {/* Android Instructions */}
              <div className="space-y-2">
                 <div className="flex items-center text-slate-200 font-medium">
                   <span className="bg-slate-700 px-2 py-0.5 rounded text-xs mr-2 text-slate-300">Android (Chrome)</span>
                 </div>
                 <ol className="text-sm text-slate-400 space-y-2 list-decimal list-inside pl-1">
                   <li>点击浏览器右上角的 <MoreVertical className="w-4 h-4 inline mx-1 text-blue-400" /> <span className="text-slate-300">菜单按钮</span></li>
                   <li>选择 <span className="text-white font-bold bg-slate-700/50 px-1 rounded">安装应用</span> 或 <span className="text-white font-bold bg-slate-700/50 px-1 rounded">添加到主屏幕</span></li>
                 </ol>
              </div>
            </div>
            
            <button 
              onClick={() => setShowInstallModal(false)} 
              className="w-full mt-6 bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-lg font-bold transition-colors"
            >
              明白了
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
