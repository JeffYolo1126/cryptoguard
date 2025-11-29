import React, { useState, useRef } from 'react';
import { TradeRecord, Stats } from '../types';
import { TrendingUp, TrendingDown, RefreshCcw, Plus, X, Download, Upload } from 'lucide-react';

interface Props {
  trades: TradeRecord[];
  onReset: () => void;
  onAddTrade: (trade: Omit<TradeRecord, 'id' | 'timestamp'>) => void;
  onDeleteTrade: (id: string) => void;
  onImportTrades: (trades: TradeRecord[]) => void;
}

export const TradeStats: React.FC<Props> = ({ trades, onReset, onAddTrade, onDeleteTrade, onImportTrades }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTrade, setNewTrade] = useState<Partial<TradeRecord>>({ direction: 'Long' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Calculate Stats
  const wins = trades.filter((t) => t.pnl > 0).length;
  const total = trades.length;
  const winRate = total > 0 ? ((wins / total) * 100).toFixed(1) : '0.0';
  const totalPnL = trades.reduce((acc, curr) => acc + curr.pnl, 0).toFixed(2);

  const handleSaveTrade = () => {
    if (newTrade.symbol && newTrade.entryPrice && newTrade.exitPrice && newTrade.direction) {
      const entry = Number(newTrade.entryPrice);
      const exit = Number(newTrade.exitPrice);
      
      onAddTrade({
        symbol: newTrade.symbol,
        direction: newTrade.direction as 'Long' | 'Short',
        entryPrice: entry,
        exitPrice: exit,
        pnl: Number(newTrade.pnl) || 0,
        roi: Number(newTrade.roi) || 0,
      });
      setShowAddModal(false);
      setNewTrade({ direction: 'Long' });
    }
  };

  const handleExportCSV = () => {
    if (trades.length === 0) {
      alert("没有可导出的交易记录");
      return;
    }

    const headers = ['Symbol,Direction,EntryPrice,ExitPrice,PnL,ROI,Timestamp'];
    const rows = trades.map(t => 
      `${t.symbol},${t.direction},${t.entryPrice},${t.exitPrice},${t.pnl},${t.roi},${t.timestamp}`
    );

    const csvContent = [headers, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `cryptoguard_trades_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportCSV = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (!text) return;

      try {
        const rows = text.split('\n').map(row => row.trim()).filter(row => row);
        
        // Basic validation: Header + at least one row
        if (rows.length < 2) {
          alert("CSV 文件内容为空或格式不正确");
          return;
        }

        const header = rows[0].split(',');
        if (header[0] !== 'Symbol' || header[4] !== 'PnL') {
           alert("CSV 表头格式不匹配。请确保导入的是本应用导出的文件。");
           return;
        }

        const parsedTrades: TradeRecord[] = rows.slice(1).map(row => {
          const cols = row.split(',');
          // Minimal error handling for row parsing
          if (cols.length < 7) throw new Error("Row data missing");
          
          return {
            id: crypto.randomUUID(), // Generate new ID to avoid collisions
            symbol: cols[0],
            direction: cols[1] as 'Long' | 'Short',
            entryPrice: Number(cols[2]),
            exitPrice: Number(cols[3]),
            pnl: Number(cols[4]),
            roi: Number(cols[5]),
            timestamp: Number(cols[6]) || Date.now(),
          };
        });

        onImportTrades(parsedTrades);
        alert(`成功导入 ${parsedTrades.length} 条交易记录`);

      } catch (err) {
        console.error("Import failed", err);
        alert("导入失败，文件格式可能已损坏。");
      }
    };
    reader.readAsText(file);
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-6">
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleImportCSV} 
        className="hidden" 
        accept=".csv"
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
          <div className="text-slate-400 text-xs uppercase font-bold mb-1">总交易次数</div>
          <div className="text-2xl font-mono text-white">{total}</div>
        </div>
        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
          <div className="text-slate-400 text-xs uppercase font-bold mb-1">胜率</div>
          <div className={`text-2xl font-mono ${Number(winRate) >= 50 ? 'text-emerald-400' : 'text-amber-400'}`}>
            {winRate}%
          </div>
        </div>
        <div className="col-span-2 bg-slate-800 p-4 rounded-xl border border-slate-700 relative overflow-hidden">
             <div className="absolute right-0 top-0 p-4 opacity-10">
                <TrendingUp className="w-16 h-16 text-white" />
             </div>
          <div className="text-slate-400 text-xs uppercase font-bold mb-1">累计盈亏 (USDT)</div>
          <div className={`text-3xl font-mono font-bold ${Number(totalPnL) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {Number(totalPnL) > 0 ? '+' : ''}{totalPnL}
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h3 className="text-lg font-bold text-white">交易历史</h3>
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4 mr-1" /> 记录交易
          </button>
          
          <button 
            onClick={handleExportCSV}
            className="flex items-center px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-sm font-medium transition-colors"
            title="导出为 CSV"
          >
            <Download className="w-4 h-4 mr-1" /> 导出
          </button>
          
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-sm font-medium transition-colors"
            title="从 CSV 导入"
          >
            <Upload className="w-4 h-4 mr-1" /> 导入
          </button>

          <button 
            onClick={onReset}
            className="flex items-center px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-sm font-medium transition-colors"
          >
            <RefreshCcw className="w-4 h-4 mr-1" /> 重置
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-300">
            <thead className="text-xs text-slate-400 uppercase bg-slate-900/50">
              <tr>
                <th className="px-6 py-3">币种</th>
                <th className="px-6 py-3">方向</th>
                <th className="px-6 py-3">开仓价</th>
                <th className="px-6 py-3">平仓价</th>
                <th className="px-6 py-3">盈亏</th>
                <th className="px-6 py-3">回报率</th>
                <th className="px-6 py-3 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {trades.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-500 italic">
                    暂无交易记录
                  </td>
                </tr>
              ) : (
                trades.map((trade) => (
                  <tr key={trade.id} className="hover:bg-slate-700/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-white">{trade.symbol}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${trade.direction === 'Long' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                        {trade.direction === 'Long' ? '做多' : '做空'}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono">{trade.entryPrice}</td>
                    <td className="px-6 py-4 font-mono">{trade.exitPrice}</td>
                    <td className={`px-6 py-4 font-mono font-bold ${trade.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {trade.pnl > 0 ? '+' : ''}{trade.pnl}
                    </td>
                     <td className={`px-6 py-4 font-mono ${trade.roi >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {trade.roi}%
                    </td>
                    <td className="px-6 py-4 text-right">
                        <button onClick={() => onDeleteTrade(trade.id)} className="text-slate-500 hover:text-rose-400">
                            <X className="w-4 h-4" />
                        </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Trade Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-800 w-full max-w-md p-6 rounded-xl border border-slate-700 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-4">记录已平仓交易</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">币种 (Symbol)</label>
                <input 
                  type="text" 
                  placeholder="如 BTCUSDT"
                  className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  value={newTrade.symbol || ''}
                  onChange={e => setNewTrade({...newTrade, symbol: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                   <label className="block text-xs font-bold text-slate-400 mb-1">方向</label>
                   <select 
                     className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                     value={newTrade.direction}
                     onChange={e => setNewTrade({...newTrade, direction: e.target.value as any})}
                   >
                     <option value="Long">做多 (Long)</option>
                     <option value="Short">做空 (Short)</option>
                   </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">回报率 (ROI %)</label>
                  <input 
                    type="number" 
                    placeholder="25"
                    className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                    value={newTrade.roi || ''}
                    onChange={e => setNewTrade({...newTrade, roi: parseFloat(e.target.value)})}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">开仓价 (Entry)</label>
                  <input 
                    type="number" 
                    className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                    value={newTrade.entryPrice || ''}
                    onChange={e => setNewTrade({...newTrade, entryPrice: parseFloat(e.target.value)})}
                  />
                 </div>
                 <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">平仓价 (Exit)</label>
                  <input 
                    type="number" 
                    className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                    value={newTrade.exitPrice || ''}
                    onChange={e => setNewTrade({...newTrade, exitPrice: parseFloat(e.target.value)})}
                  />
                 </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">实际盈亏 (USDT)</label>
                <input 
                  type="number" 
                  placeholder="-50.00"
                  className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  value={newTrade.pnl || ''}
                  onChange={e => setNewTrade({...newTrade, pnl: parseFloat(e.target.value)})}
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button onClick={() => setShowAddModal(false)} className="px-4 py-2 text-sm text-slate-400 hover:text-white">取消</button>
              <button onClick={handleSaveTrade} className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded font-medium">保存记录</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};