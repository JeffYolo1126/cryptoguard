import React from 'react';
import { AnalysisResult, SignalType } from '../types';
import { AlertTriangle, ArrowUpCircle, ArrowDownCircle, MinusCircle, Target, Shield, Crosshair } from 'lucide-react';

interface Props {
  data: AnalysisResult | null;
  isLoading: boolean;
}

const SignalBadge: React.FC<{ signal: SignalType }> = ({ signal }) => {
  const styles = {
    LONG: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50',
    SHORT: 'bg-rose-500/20 text-rose-400 border-rose-500/50',
    WAIT: 'bg-amber-500/20 text-amber-400 border-amber-500/50',
  };

  const labels = {
    LONG: '做多 (LONG)',
    SHORT: '做空 (SHORT)',
    WAIT: '观望 (WAIT)',
  };

  const icons = {
    LONG: <ArrowUpCircle className="w-5 h-5 mr-2" />,
    SHORT: <ArrowDownCircle className="w-5 h-5 mr-2" />,
    WAIT: <MinusCircle className="w-5 h-5 mr-2" />,
  };

  return (
    <div className={`flex items-center justify-center px-4 py-2 rounded-full border ${styles[signal]} font-bold tracking-wider`}>
      {icons[signal]}
      {labels[signal]}
    </div>
  );
};

export const AnalysisResultCard: React.FC<Props> = ({ data, isLoading }) => {
  if (isLoading) {
    return (
      <div className="w-full h-96 bg-slate-800 rounded-xl border border-slate-700 p-6 animate-pulse flex flex-col items-center justify-center space-y-4">
        <div className="h-4 w-3/4 bg-slate-700 rounded"></div>
        <div className="h-4 w-1/2 bg-slate-700 rounded"></div>
        <div className="h-32 w-full bg-slate-700 rounded mt-8"></div>
        <span className="text-slate-500 font-mono text-sm animate-pulse">正在分析市场结构...</span>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="w-full h-full bg-slate-800 rounded-xl border border-slate-700 border-dashed flex items-center justify-center p-8 text-slate-500">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>准备就绪。请上传图表或输入市场数据。</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-slate-800 rounded-xl border border-slate-700 overflow-hidden shadow-xl">
      <div className="p-6 border-b border-slate-700 flex justify-between items-center bg-slate-900/50">
        <h2 className="text-xl font-bold text-white flex items-center">
          <span className="w-2 h-6 bg-blue-500 rounded-sm mr-3"></span>
          技术分析结果
        </h2>
        <SignalBadge signal={data.signal} />
      </div>

      <div className="p-6 space-y-6">
        {/* Summary */}
        <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700/50">
          <h3 className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-2">市场结构摘要</h3>
          <p className="text-slate-300 leading-relaxed font-mono text-sm">{data.summary}</p>
        </div>

        {/* Trade Plan - Only if Signal is not WAIT */}
        {data.signal !== 'WAIT' && data.plan && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-900/80 p-4 rounded-lg border border-slate-700/50 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/10 rounded-bl-full -mr-8 -mt-8 transition-all group-hover:bg-blue-500/20"></div>
              <div className="flex items-center mb-2">
                <Crosshair className="w-4 h-4 text-blue-400 mr-2" />
                <span className="text-xs uppercase text-slate-400 font-bold">入场区间</span>
              </div>
              <p className="text-xl font-mono text-white tracking-tight">{data.plan.entry}</p>
            </div>

            <div className="bg-slate-900/80 p-4 rounded-lg border border-slate-700/50 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-16 h-16 bg-rose-500/10 rounded-bl-full -mr-8 -mt-8 transition-all group-hover:bg-rose-500/20"></div>
              <div className="flex items-center mb-2">
                <Shield className="w-4 h-4 text-rose-400 mr-2" />
                <span className="text-xs uppercase text-slate-400 font-bold">止损位 (SL)</span>
              </div>
              <p className="text-xl font-mono text-white tracking-tight">{data.plan.sl}</p>
            </div>

            <div className="col-span-1 md:col-span-2 bg-slate-900/80 p-4 rounded-lg border border-slate-700/50 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/10 rounded-bl-full -mr-8 -mt-8 transition-all group-hover:bg-emerald-500/20"></div>
              <div className="flex items-center mb-2">
                <Target className="w-4 h-4 text-emerald-400 mr-2" />
                <span className="text-xs uppercase text-slate-400 font-bold">止盈目标 (TP)</span>
              </div>
              <div className="flex justify-between items-center">
                 <div className="flex flex-col">
                    <span className="text-xs text-slate-500">目标 1 (减仓)</span>
                    <span className="text-lg font-mono text-emerald-300">{data.plan.tp1}</span>
                 </div>
                 <div className="h-8 w-px bg-slate-700"></div>
                 <div className="flex flex-col text-right">
                    <span className="text-xs text-slate-500">目标 2 (清仓)</span>
                    <span className="text-lg font-mono text-emerald-300">{data.plan.tp2}</span>
                 </div>
              </div>
            </div>
          </div>
        )}

        {/* Logic */}
        {data.plan?.logic && (
          <div className="text-sm text-slate-400 italic border-l-2 border-slate-600 pl-4 py-1">
            "{data.plan.logic}"
          </div>
        )}
      </div>
    </div>
  );
};