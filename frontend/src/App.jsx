import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import WaveSurfer from 'wavesurfer.js';
import { 
  Music, 
  Upload, 
  Zap,
  Play, 
  Pause,
  Layers,
  Sparkles,
  ChevronRight,
  TrendingUp,
  Files,
  Heart,
  Focus,
  Activity,
  CheckCircle2,
  AlertCircle,
  Mic,
  Globe,
  ThumbsUp,
  ThumbsDown,
  Clock,
  History,
  MessageCircle,
  Send,
  X,
  Bot,
  Database,
  Sun,
  Moon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, AreaChart, Area
} from 'recharts';
const API_BASE = "http://127.0.0.1:8000";
const SpectrogramView = ({ data }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (canvasRef.current && data && data.length > 0) {
      const ctx = canvasRef.current.getContext('2d');
      const width = data[0].length;
      const height = data.length;
      canvasRef.current.width = width;
      canvasRef.current.height = height;
      
      const imgData = ctx.createImageData(width, height);
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = (y * width + x) * 4;
          const val = data[height - 1 - y][x];
          const v = val / 255.0;
          imgData.data[idx] = v < 0.2 ? v * 50 : (v < 0.5 ? 100 + (v-0.2)*400 : 255);
          imgData.data[idx + 1] = v > 0.4 ? (v - 0.4) * 1.5 * 255 : 0;
          imgData.data[idx + 2] = v > 0.7 ? (v - 0.7) * 3 * 255 : (v < 0.3 ? v * 100 : 0);
          imgData.data[idx + 3] = 255;
        }
      }
      ctx.putImageData(imgData, 0, 0);
    }
  }, [data]);

  return (
    <div className="spectrogram-wrapper">
      <div className="freq-axis">
        <span>High</span>
        <span>Freq</span>
        <span>Low</span>
      </div>
      <div className="spectrogram-card" style={{ flex: 1 }}>
        <canvas ref={canvasRef} className="spectrogram-canvas" />
      </div>
    </div>
  );
};

const InteractivePitchChart = ({ data }) => {
  if (!data || data.length === 0) return <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}>No Pitch Data Extracted</div>;
  
  const step = Math.ceil(data.length / 400);
  const plotData = data.filter((_, i) => i % step === 0).map((val, i) => ({
    time: (i * step * 1024 / 22050).toFixed(1),
    frequency: val > 0 ? parseFloat(val.toFixed(1)) : null
  }));

  return (
    <div style={{ width: '100%', height: 250, marginTop: '1rem' }}>
      <ResponsiveContainer>
        <AreaChart data={plotData}>
          <defs>
            <linearGradient id="colorFreq" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis 
            dataKey="time" 
            tick={{ fill: '#666', fontSize: 10 }} 
            axisLine={{ stroke: '#333' }}
            label={{ value: 'Time (s)', position: 'insideBottomRight', offset: -5, fill: '#444', fontSize: 10 }}
          />
          <YAxis 
            tick={{ fill: '#666', fontSize: 10 }} 
            axisLine={{ stroke: '#333' }}
            domain={['auto', 'auto']}
            label={{ value: 'Hz', angle: -90, position: 'insideLeft', fill: '#444', fontSize: 10 }}
          />
          <Tooltip 
            contentStyle={{ background: '#1e1f22', border: '1px solid #f59e0b', borderRadius: '8px', fontSize: '12px' }}
            itemStyle={{ color: '#f59e0b' }}
            formatter={(value) => [`${value} Hz`, 'Frequency']}
          />
          <Area type="monotone" dataKey="frequency" stroke="#f59e0b" fillOpacity={1} fill="url(#colorFreq)" dot={false} strokeWidth={2} connectNulls={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

const InteractiveSwaraChart = ({ distribution }) => {
  if (!distribution) return null;
  const swaraOrder = ["Sa", "re", "Re", "ga", "Ga", "Ma", "Ma'", "Pa", "dha", "Dha", "ni", "Ni"];
  const plotData = swaraOrder.map(s => ({
    name: s,
    value: parseFloat(((distribution[s] || 0) * 100).toFixed(2))
  }));

  return (
    <div style={{ width: '100%', height: 250, marginTop: '1rem' }}>
      <ResponsiveContainer>
        <BarChart data={plotData}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis dataKey="name" tick={{ fill: '#aaa', fontWeight: 700, fontSize: 11 }} axisLine={{ stroke: '#333' }} />
          <YAxis tick={{ fill: '#666', fontSize: 10 }} axisLine={{ stroke: '#333' }} />
          <Tooltip 
            formatter={(value) => [`${value}%`, 'Energy Prominence']}
            contentStyle={{ background: '#1e1f22', border: '1px solid #4db8ff', borderRadius: '8px', fontSize: '12px' }}
          />
          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
            {plotData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.value > 5 ? '#f59e0b' : '#2b2d31'} stroke={entry.value > 5 ? '#f59e0b' : '#4db8ff'} strokeWidth={1} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

const CyberLoader = () => {
  const [progress, setProgress] = useState(0);
  const hudRef = useRef(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 99) return prev;
        let increment = 1;
        if (prev < 40) increment = Math.floor(Math.random() * 3) + 2;
        else if (prev < 80) increment = Math.floor(Math.random() * 2) + 1;
        else increment = 0.2; 
        
        const next = prev + increment;
        return next > 99 ? 99 : next;
      });
    }, 250);
    return () => clearInterval(interval);
  }, []);

  const getProcessText = (p) => {
    if (p < 15) return "INITIALIZING SYSTEM";
    if (p < 30) return "AUDIO CHUNKING";
    if (p < 50) return "FEATURE EXTRACTION";
    if (p < 70) return "SPECTRAL ANALYSIS";
    if (p < 90) return "NEURAL PROCESSING";
    return "FINALIZING RESULTS";
  };

  return (
    <motion.div 
      className="cyber-loader-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ 
        scale: 3, 
        opacity: 0, 
        filter: 'blur(30px)',
        transition: { duration: 0.7, ease: "easeIn" }
      }}
    >
      <style>{`
        .cyber-loader-overlay {
          position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
          background: radial-gradient(circle at center, rgba(2, 11, 16, 0.98) 0%, #01080b 100%);
          display: flex; justify-content: center; align-items: center;
          z-index: 9999; overflow: hidden;
        }
        .hud-container {
          position: relative; width: 350px; height: 350px;
          display: flex; justify-content: center; align-items: center;
        }
        .ring-outer {
          position: absolute; width: 300px; height: 300px; border-radius: 50%;
          border: 1px solid rgba(0, 242, 255, 0.1);
          border-top: 4px solid #00f2ff;
          border-bottom: 4px solid #00f2ff;
          animation: rotate 3s cubic-bezier(0.4, 0, 0.2, 1) infinite;
          filter: drop-shadow(0 0 20px #00f2ff);
        }
        .ring-inner {
          position: absolute; width: 240px; height: 240px; border-radius: 50%;
          border: 1px dashed rgba(0, 242, 255, 0.3);
          animation: rotate 10s linear infinite reverse;
        }
        .core {
          position: relative; width: 200px; height: 200px;
          display: flex; flex-direction: column;
          justify-content: center; align-items: center; color: #00f2ff;
          text-shadow: 0 0 20px rgba(0, 242, 255, 0.8);
          font-family: 'Inter', monospace;
        }
        .percent-display { font-size: 3.5rem; font-weight: 900; letter-spacing: -2px; line-height: 1; }
        .process-title { 
          font-size: 0.7rem; letter-spacing: 5px; text-transform: uppercase; 
          margin-top: 15px; font-weight: 500; opacity: 0.9;
          background: rgba(0, 242, 255, 0.1); padding: 4px 12px; border-radius: 4px;
        }
        @keyframes rotate { 100% { transform: rotate(360deg); } }
      `}</style>
      <div className="hud-container" ref={hudRef}>
        <div className="ring-outer"></div>
        <div className="ring-inner"></div>
        <div className="core">
          <div className="percent-display">
            {Math.floor(progress)}<span style={{fontSize: '1.5rem', marginLeft: '2px'}}>%</span>
          </div>
          <motion.div 
            className="process-title"
            key={getProcessText(progress)}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {getProcessText(progress)}
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

const BulkResultsView = ({ data, files, handleDownloadPDF, pdfLoading, handleProcessPDF, processingStatus, indexingProgress, chunkCount, openChat, onReset }) => {
  const dayCount = data.filter(r => r.prediction.includes('Day')).length;
  const nightCount = data.filter(r => r.prediction.includes('Night')).length;
  const [expandedIndex, setExpandedIndex] = useState(null);
  const [viewMode, setViewMode] = useState('narrative'); // 'narrative', 'spectrogram', or 'therapy'
  const [vizMode, setVizMode] = useState('interactive'); // 'interactive' or 'png'

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bulk-view">
      {onReset && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.5rem' }}>
          <button
            onClick={onReset}
            style={{
              padding: '0.6rem 1.2rem',
              background: 'linear-gradient(135deg, var(--primary) 0%, #d4af37 100%)',
              color: 'black',
              border: 'none',
              borderRadius: '10px',
              fontWeight: '800',
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              boxShadow: '0 4px 12px rgba(245, 158, 11, 0.2)',
              transition: 'all 0.3s ease'
            }}
          >
            <Music size={16} /> Upload Another File
          </button>
        </div>
      )}
      <div className="bulk-stats">
        <div className="stat-card card">
          <span className="label">Day Audio</span>
          <div className="stat-val">{dayCount}</div>
        </div>
        <div className="stat-card card">
          <span className="label">Night Audio</span>
          <div className="stat-val">{nightCount}</div>
        </div>
      </div>

      <div className="bulk-table card">
        <div className="table-header">
          <span>Raga Sample</span>
          <span>Category</span>
          <span>Decision</span>
        </div>
        <div className="table-body">
          {data.map((item, i) => (
            <React.Fragment key={i}>
              <div 
                className={`table-row ${expandedIndex === i ? 'expanded' : ''}`}
              >
                <div className="row-file-box" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '6px', paddingRight: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Music size={14} className="text-primary" />
                    <span className="row-file" style={{ paddingRight: 0 }}>{item.filename}</span>
                  </div>
                  {files && files.find(f => f.name === item.filename) && (
                    <audio 
                      src={URL.createObjectURL(files.find(f => f.name === item.filename))} 
                      controls 
                      style={{ height: '28px', width: '100%', maxWidth: '240px' }} 
                    />
                  )}
                </div>
                <span className={`row-pred ${item.prediction.includes('Day') ? 'day' : 'night'}`}>
                  {item.prediction}
                </span>
                <div className="action-buttons">
                  <button 
                    className="summarize-btn"
                    onClick={() => handleDownloadPDF(item, i)}
                    disabled={pdfLoading === i}
                    style={{ background: 'rgba(255,255,255,0.1)', color: 'var(--primary)', border: '1px solid var(--primary)' }}
                  >
                    {pdfLoading === i ? '...' : 'PDF Report'}
                  </button>
                  <button 
                    className="process-pdf-btn summarize-btn"
                    onClick={() => {
                      if (processingStatus[item.filename] === 'indexed') {
                        openChat(item);
                      } else {
                        handleProcessPDF(item);
                      }
                    }}
                    disabled={processingStatus[item.filename] === 'indexing'}
                    style={{ 
                      background: processingStatus[item.filename] === 'indexed' ? 'linear-gradient(135deg, #3b82f6, #2563eb)' : 'linear-gradient(135deg, #059669, #10b981)', 
                      color: 'white', 
                      border: 'none',
                      fontWeight: 800,
                      boxShadow: processingStatus[item.filename] === 'indexed' ? '0 4px 10px rgba(59, 130, 246, 0.3)' : '0 4px 10px rgba(16, 185, 129, 0.2)',
                      minWidth: '100px'
                    }}
                  >
                    {processingStatus[item.filename] === 'indexing' ? <Sparkles className="animate-spin" size={12} /> : processingStatus[item.filename] === 'indexed' ? <Bot size={12} /> : <Database size={12} />}
                    {processingStatus[item.filename] === 'indexing' ? (
                      <span style={{ fontSize: '0.6rem' }}>ANALYSIS... {Math.min(indexingProgress[item.filename] || 0, 99)}%</span>
                    ) : processingStatus[item.filename] === 'indexed' ? 'Open Chat' : 'Process'}
                  </button>
                  <button 
                    className={`summarize-btn ${expandedIndex === i && viewMode === 'narrative' ? 'active' : ''}`}
                    onClick={() => { setExpandedIndex(expandedIndex === i && viewMode === 'narrative' ? null : i); setViewMode('narrative'); }}
                    style={{ 
                      background: expandedIndex === i && viewMode === 'narrative' ? 'var(--primary)' : 'rgba(255,255,255,0.08)',
                      color: expandedIndex === i && viewMode === 'narrative' ? '#000' : 'var(--primary)',
                      border: '1px solid var(--primary)'
                    }}
                  >
                    Explanation
                  </button>
                  <button 
                    className={`summarize-btn ${expandedIndex === i && viewMode === 'spectrogram' ? 'active' : ''}`}
                    onClick={() => { setExpandedIndex(expandedIndex === i && viewMode === 'spectrogram' ? null : i); setViewMode('spectrogram'); }}
                    style={{ 
                      background: expandedIndex === i && viewMode === 'spectrogram' ? 'var(--primary)' : 'rgba(255,255,255,0.08)',
                      color: expandedIndex === i && viewMode === 'spectrogram' ? '#000' : 'var(--primary)',
                      border: '1px solid var(--primary)'
                    }}
                  >
                    Visual Charts
                  </button>
                  <button 
                    className={`summarize-btn ${expandedIndex === i && viewMode === 'therapy' ? 'active' : ''}`}
                    onClick={() => { setExpandedIndex(expandedIndex === i && viewMode === 'therapy' ? null : i); setViewMode('therapy'); }}
                    style={{ 
                      background: expandedIndex === i && viewMode === 'therapy' ? 'var(--primary)' : 'rgba(255,255,255,0.08)',
                      color: expandedIndex === i && viewMode === 'therapy' ? '#000' : 'var(--primary)',
                      border: '1px solid var(--primary)'
                    }}
                  >
                    Therapy Analysis
                  </button>
                </div>
              </div>
              <AnimatePresence>
                {expandedIndex === i && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }} 
                    animate={{ height: 'auto', opacity: 1 }} 
                    exit={{ height: 0, opacity: 0 }}
                    className="row-expansion"
                  >
                    <div className="expansion-inner">
                      {viewMode === 'narrative' ? (
                        <div className="hybrid-explanation" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                          <div>
                            <div className="label"><Sparkles size={14} style={{display:'inline', marginRight:'4px'}}/> AI Reasoned Analysis</div>
                            <p className="narrative-text-small">{item.narrative}</p>
                          </div>
                          {item.detailed_features && (
                            <div style={{ transform: 'scale(0.95)', transformOrigin: 'top left', marginTop: '-1rem' }}>
                              <DetailedFeatureAnalysis features={item.detailed_features} />
                            </div>
                          )}
                        </div>
                      ) : viewMode === 'spectrogram' ? (
                        <div className="visual-block" style={{ padding: '1rem' }}>
                          <div style={{ display: 'flex', gap: '10px', marginBottom: '1rem' }}>
                            <button 
                              onClick={() => setVizMode('interactive')}
                              style={{ padding: '4px 12px', fontSize: '0.7rem', borderRadius: '4px', background: vizMode === 'interactive' ? 'var(--primary)' : '#222', color: vizMode === 'interactive' ? '#000' : '#888', border: '1px solid #444', cursor: 'pointer' }}
                            >INTERACTIVE</button>
                            <button 
                              onClick={() => setVizMode('png')}
                              style={{ padding: '4px 12px', fontSize: '0.7rem', borderRadius: '4px', background: vizMode === 'png' ? 'var(--primary)' : '#222', color: vizMode === 'png' ? '#000' : '#888', border: '1px solid #444', cursor: 'pointer' }}
                            >PNG MODE</button>
                          </div>

                          {vizMode === 'interactive' ? (
                            <div className="charts-grid">
                              <div>
                                <span style={{ fontSize: '0.6rem', color: '#666', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Pitch Contour (Hz)</span>
                                <InteractivePitchChart data={item.pitch_contour_data} />
                              </div>
                              <div>
                                <span style={{ fontSize: '0.6rem', color: '#666', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Swara Distribution (%)</span>
                                <InteractiveSwaraChart distribution={item.swara_distribution_data} />
                              </div>
                            </div>
                          ) : (
                            <div style={{ background: '#111', padding: '1rem', borderRadius: '8px' }}>
                               <img src={`${API_BASE}${item.image_url}`} alt="Analysis PNG" style={{ width: '100%', height: 'auto', borderRadius: '4px' }} />
                            </div>
                          )}

                          <span className="label" style={{marginTop: '1.5rem', marginBottom: '0.5rem', display: 'block'}}>Acoustic Spectrogram Signature</span>
                          {item.spectrogram ? <SpectrogramView data={item.spectrogram} /> : <p className="narrative-text-small">Spectrogram data unavailable for this segment.</p>}
                          

                          
                          {item.detailed_features && (
                            <div style={{ transform: 'scale(0.95)', transformOrigin: 'top left', marginTop: '1rem' }}>
                              <DetailedFeatureAnalysis features={item.detailed_features} />
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="therapy-block" style={{ padding: '1rem' }}>
                          <span className="label" style={{marginBottom: '1rem', display: 'block'}}>🧘 Wellness & Therapy Profile</span>
                          {item.therapy ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                              
                              {/* Music Wellness Profile */}
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                                <div className="score-item">
                                  <div style={{display:'flex', justifyContent:'space-between', fontSize:'0.75rem', fontWeight:700, color: 'var(--accent)'}}><span>Calmness</span><span>{item.therapy.wellness_profile?.calmness ?? item.therapy.therapy_scores?.calm_score ?? 5}/10</span></div>
                                  <div className="progress-bg"><div className="progress-fill calm" style={{width:`${(item.therapy.wellness_profile?.calmness ?? item.therapy.therapy_scores?.calm_score ?? 5)*10}%`}}></div></div>
                                </div>
                                <div className="score-item">
                                  <div style={{display:'flex', justifyContent:'space-between', fontSize:'0.75rem', fontWeight:700, color: 'var(--accent)'}}><span>Energy</span><span>{item.therapy.wellness_profile?.energy ?? item.therapy.therapy_scores?.energy_score ?? 5}/10</span></div>
                                  <div className="progress-bg"><div className="progress-fill energy" style={{width:`${(item.therapy.wellness_profile?.energy ?? item.therapy.therapy_scores?.energy_score ?? 5)*10}%`}}></div></div>
                                </div>
                                <div className="score-item">
                                  <div style={{display:'flex', justifyContent:'space-between', fontSize:'0.75rem', fontWeight:700, color: 'var(--accent)'}}><span>Focus</span><span>{item.therapy.wellness_profile?.focus ?? item.therapy.therapy_scores?.focus_score ?? 5}/10</span></div>
                                  <div className="progress-bg"><div className="progress-fill focus" style={{width:`${(item.therapy.wellness_profile?.focus ?? item.therapy.therapy_scores?.focus_score ?? 5)*10}%`}}></div></div>
                                </div>
                                <div className="score-item">
                                  <div style={{display:'flex', justifyContent:'space-between', fontSize:'0.75rem', fontWeight:700, color: 'var(--accent)'}}><span>Brightness</span><span>{item.therapy.wellness_profile?.brightness ?? 5}/10</span></div>
                                  <div className="progress-bg"><div className="progress-fill uplifting" style={{width:`${(item.therapy.wellness_profile?.brightness ?? 5)*10}%`, background: '#fbc02d'}}></div></div>
                                </div>
                                <div className="score-item">
                                  <div style={{display:'flex', justifyContent:'space-between', fontSize:'0.75rem', fontWeight:700, color: 'var(--accent)'}}><span>Stability</span><span>{item.therapy.wellness_profile?.stability ?? 5}/10</span></div>
                                  <div className="progress-bg"><div className="progress-fill relaxing" style={{width:`${(item.therapy.wellness_profile?.stability ?? 5)*10}%`, background: '#2e7d32'}}></div></div>
                                </div>
                                <div className="score-item">
                                  <div style={{display:'flex', justifyContent:'space-between', fontSize:'0.75rem', fontWeight:700, color: 'var(--accent)'}}><span>Complexity</span><span>{item.therapy.wellness_profile?.complexity ?? 5}/10</span></div>
                                  <div className="progress-bg"><div className="progress-fill focus" style={{width:`${(item.therapy.wellness_profile?.complexity ?? 5)*10}%`, background: '#8e24aa'}}></div></div>
                                </div>
                              </div>

                              {/* Temporal Suitability */}
                              {item.therapy.temporal_suitability && (
                                <div className="temporal-suitability-panel">
                                  <span className="label" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.75rem' }}>⏰ TEMPORAL SUITABILITY</span>
                                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))', gap: '0.75rem', background: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: '10px', border: '1px solid var(--border)' }}>
                                    {Object.entries(item.therapy.temporal_suitability).map(([timeOfDay, pct]) => {
                                      const TEMPORAL_NAMES = {
                                        early_morning: "Early Morning",
                                        morning: "Morning",
                                        afternoon: "Afternoon",
                                        evening: "Evening",
                                        night: "Night",
                                        late_night: "Late Night"
                                      };
                                      return (
                                        <div key={timeOfDay} style={{ textAlign: 'center' }}>
                                          <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)', fontWeight: 700 }}>
                                            {TEMPORAL_NAMES[timeOfDay] || timeOfDay.replace('_', ' ')}
                                          </div>
                                          <div style={{ fontSize: '0.95rem', fontWeight: 900, color: 'var(--primary)', margin: '0.15rem 0' }}>
                                            {pct}%
                                          </div>
                                          <div className="progress-bg" style={{ height: '3px', margin: '0 auto', width: '80%' }}>
                                            <div className="progress-fill calm" style={{ width: `${pct}%`, height: '100%' }}></div>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}

                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                                <div className="rec-sub-block">
                                  {/* Primary Recommendation */}
                                  <div style={{background:'rgba(255,255,255,0.05)', padding:'0.8rem', borderRadius:'8px', border:'1px solid var(--border)', marginBottom: '1rem'}}>
                                    <div style={{fontSize:'0.7rem', color:'var(--text-dim)', marginBottom:'0.2rem'}}>Primary Recommendation</div>
                                    <div style={{fontWeight:800, color:'var(--primary)', fontSize:'1rem', marginBottom: '0.4rem'}}>
                                      {item.therapy.primary_recommendation?.activity ?? item.therapy.recommendation?.primary}
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.75rem', color: 'var(--text-main)', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '0.4rem', marginTop: '0.4rem' }}>
                                      {item.therapy.primary_recommendation?.score !== undefined && (
                                        <div><strong>Compatibility:</strong> {item.therapy.primary_recommendation.score}%</div>
                                      )}
                                      {item.therapy.primary_recommendation?.best_time && (
                                        <div><strong>Best Time:</strong> {item.therapy.primary_recommendation.best_time}</div>
                                      )}
                                      {item.therapy.primary_recommendation?.suggested_duration && (
                                        <div><strong>Suggested Duration:</strong> {item.therapy.primary_recommendation.suggested_duration}</div>
                                      )}
                                      {item.therapy.primary_recommendation?.intensity && (
                                        <div><strong>Intensity:</strong> {item.therapy.primary_recommendation.intensity}</div>
                                      )}
                                    </div>
                                  </div>

                                  {/* Alternatives */}
                                  {item.therapy.alternatives && item.therapy.alternatives.length > 0 && (
                                    <div style={{ marginBottom: '1rem' }}>
                                      <span className="label" style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.75rem' }}>ALTERNATIVE RECOMMENDATIONS</span>
                                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                        {item.therapy.alternatives.map((alt, idx) => (
                                          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', background: 'rgba(255, 255, 255, 0.02)', padding: '0.5rem 0.75rem', borderRadius: '6px', fontSize: '0.75rem', border: '1px solid var(--border)' }}>
                                            <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{alt.activity}</span>
                                            <span style={{ color: 'var(--primary)', fontWeight: 800 }}>{alt.score}%</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {/* Session Plan */}
                                  {item.therapy.session_plan && item.therapy.session_plan.length > 0 && (
                                    <div className="session-planner" style={{ marginBottom: '1rem' }}>
                                      <span className="label" style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.75rem' }}>SESSION PLAN</span>
                                      <div className="timeline" style={{ paddingLeft: '0.5rem' }}>
                                        {item.therapy.session_plan.map((r, i) => (
                                          <div key={i} className="timeline-item" style={{ paddingBottom: '0.5rem' }}>
                                            <span className="time" style={{ fontSize: '0.7rem' }}>{i === 0 ? "0m - 20m" : i === 1 ? "20m - 45m" : "45m - 60m"}</span>
                                            <span className="raga" style={{ fontSize: '0.75rem' }}>{r}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>

                                <div className="explanation-panel">
                                  {/* Dynamic Recommendation Compatibility */}
                                  {item.therapy.recommendation_scores && (
                                    <div style={{ marginBottom: '1rem' }}>
                                      <span className="label" style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.75rem' }}>RECOMMENDATION COMPATIBILITY</span>
                                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.4rem' }}>
                                        {Object.entries(item.therapy.recommendation_scores)
                                          .sort((a, b) => b[1] - a[1])
                                          .map(([activity, score]) => (
                                            <div key={activity} style={{ display: 'flex', justifyContent: 'space-between', background: 'rgba(255, 255, 255, 0.02)', padding: '0.4rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem', border: '1px solid var(--border)' }}>
                                              <span style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.7rem' }}>{activity}</span>
                                              <span style={{ color: 'var(--primary)', fontWeight: 800 }}>{score}%</span>
                                            </div>
                                          ))}
                                      </div>
                                    </div>
                                  )}

                                  {/* Explanation Bullets */}
                                  <span className="label" style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.75rem', marginTop: '1rem' }}>Why this recommendation?</span>
                                  <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                                    <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.75rem', color: 'var(--text-main)', lineHeight: '1.4' }}>
                                      {item.therapy.explanation.map((e, idx) => (
                                        <li key={idx} style={{ marginBottom: '0.3rem' }}>{e}</li>
                                      ))}
                                    </ul>
                                  </div>
                                </div>
                              </div>

                            </div>
                          ) : <p className="narrative-text-small">Therapy data not available.</p>}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </React.Fragment>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

const DetailedFeatureAnalysis = ({ features }) => {
  if (!features) return null;
  return (
    <div className="detailed-analysis-section card" style={{ marginTop: '2rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)' }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem', borderBottom: '1px solid rgba(176, 141, 72, 0.2)', paddingBottom: '1rem' }}>
        <h3 style={{ color: 'var(--accent)', letterSpacing: '0.15em', fontWeight: 800, fontSize: '1.2rem' }}>FEATURE ANALYSIS</h3>
      </div>
      
      <div className="feature-list" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
        
        {/* Swaras */}
        <div className="feature-item">
          <h4 style={{ color: 'var(--primary)', marginBottom: '0.8rem', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem' }}>🎵 Swaras</h4>
          <div style={{ color: 'var(--text-main)', fontSize: '0.85rem', lineHeight: '1.8' }}>
            <div><span style={{ fontWeight: 700, color: 'var(--accent)' }}>Detected:</span> {features.swaras.detected}</div>
            <div><span style={{ fontWeight: 700, color: 'var(--accent)' }}>Unique:</span> {features.swaras.unique}</div>
            <div><span style={{ fontWeight: 700, color: 'var(--accent)' }}>Most Frequent:</span> {features.swaras.most_frequent}</div>
          </div>
        </div>

        {/* Arohana-Avarohana */}
        <div className="feature-item">
          <h4 style={{ color: '#4db8ff', marginBottom: '0.8rem', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem' }}>📈 Arohana-Avarohana</h4>
          <div style={{ color: 'var(--text-main)', fontSize: '0.85rem', lineHeight: '1.8' }}>
            <div><span style={{ fontWeight: 700, color: 'var(--accent)' }}>Arohana:</span> {features.arohana_avarohana.arohana}</div>
            <div><span style={{ fontWeight: 700, color: 'var(--accent)' }}>Avarohana:</span> {features.arohana_avarohana.avarohana}</div>
          </div>
        </div>

        {/* Pakad */}
        <div className="feature-item">
          <h4 style={{ color: '#ff4757', marginBottom: '0.8rem', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem' }}>🎯 Pakad</h4>
          <div style={{ color: 'var(--text-main)', fontSize: '0.85rem', lineHeight: '1.8' }}>
            {features.pakad.map((p, idx) => p ? <div key={idx}><span style={{ fontWeight: 700, color: 'var(--accent)' }}>{idx + 1}.</span> {p}</div> : null)}
          </div>
        </div>

        {/* Gamakas */}
        <div className="feature-item">
          <h4 style={{ color: '#7158e2', marginBottom: '0.8rem', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem' }}>🎶 Gamakas</h4>
          <div style={{ color: 'var(--text-main)', fontSize: '0.85rem', lineHeight: '1.8' }}>
            <div><span style={{ fontWeight: 700, color: 'var(--accent)' }}>Oscillations:</span> {features.gamakas.oscillations}</div>
            <div><span style={{ fontWeight: 700, color: 'var(--accent)' }}>Slides detected:</span> {features.gamakas.slides}</div>
            <div><span style={{ fontWeight: 700, color: 'var(--accent)' }}>Avg Pitch Variation:</span> {features.gamakas.avg_var}</div>
          </div>
        </div>

        {/* Vadi-Samvadi */}
        <div className="feature-item">
          <h4 style={{ color: '#fbc531', marginBottom: '0.8rem', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem' }}>⭐ Vadi-Samvadi</h4>
          <div style={{ color: 'var(--text-main)', fontSize: '0.85rem', lineHeight: '1.8' }}>
            <div><span style={{ fontWeight: 700, color: 'var(--accent)' }}>Vadi:</span> {features.vadi_samvadi.vadi}</div>
            <div><span style={{ fontWeight: 700, color: 'var(--accent)' }}>Samvadi:</span> {features.vadi_samvadi.samvadi}</div>
          </div>
        </div>

        {/* Pitch Range */}
        <div className="feature-item">
          <h4 style={{ color: '#00cec9', marginBottom: '0.8rem', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem' }}>📊 Pitch Range</h4>
          <div style={{ color: 'var(--text-main)', fontSize: '0.85rem', lineHeight: '1.8' }}>
            <div><span style={{ fontWeight: 700, color: 'var(--accent)' }}>Min:</span> {features.pitch_range.min}, <span style={{ fontWeight: 700, color: 'var(--accent)' }}>Max:</span> {features.pitch_range.max}</div>
            <div><span style={{ fontWeight: 700, color: 'var(--accent)' }}>Range:</span> {features.pitch_range.range}</div>
          </div>
        </div>

        {/* Note Transitions */}
        <div className="feature-item">
          <h4 style={{ color: '#e84393', marginBottom: '0.8rem', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem' }}>🔄 Note Transitions</h4>
          <div style={{ color: 'var(--text-main)', fontSize: '0.85rem', lineHeight: '1.8' }}>
            <div><span style={{ fontWeight: 700, color: 'var(--accent)' }}>Most Common:</span> {features.transitions.most_common}</div>
          </div>
        </div>

        {/* Tempo & Structure */}
        <div className="feature-item">
          <h4 style={{ color: '#d63031', marginBottom: '0.8rem', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem' }}>⏱️ Timing & Structure</h4>
          <div style={{ color: 'var(--text-main)', fontSize: '0.85rem', lineHeight: '1.8' }}>
            <div><span style={{ fontWeight: 700, color: 'var(--accent)' }}>BPM:</span> {features.tempo.bpm}</div>
            <div style={{ whiteSpace: 'pre-wrap', marginTop: '0.5rem' }}><span style={{ fontWeight: 700, color: 'var(--accent)' }}>Structure:</span><br/>{features.structure}</div>
          </div>
        </div>

        {/* Timbre */}
        <div className="feature-item">
          <h4 style={{ color: '#636e72', marginBottom: '0.8rem', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem' }}>🎧 Timbre</h4>
          <div style={{ color: 'var(--text-main)', fontSize: '0.85rem', lineHeight: '1.8' }}>
            <div><span style={{ fontWeight: 700, color: 'var(--accent)' }}>MFCC Mean:</span> {features.timbre.mfcc_mean}</div>
            <div><span style={{ fontWeight: 700, color: 'var(--accent)' }}>Spectral Centroid:</span> {features.timbre.centroid}</div>
            <div><span style={{ fontWeight: 700, color: 'var(--accent)' }}>ZCR:</span> {features.timbre.zcr}</div>
          </div>
        </div>

        {/* Advanced Analytics */}
        {features.advanced_analytics && (
          <div className="feature-item">
            <h4 style={{ color: '#00b894', marginBottom: '0.8rem', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem' }}>🧠 AI Confidence Reasoning</h4>
            <div style={{ color: 'var(--text-main)', fontSize: '0.85rem', lineHeight: '1.8' }}>
              <div><span style={{ fontWeight: 700, color: 'var(--accent)' }}>Sa Stability:</span> {(features.advanced_analytics.sa_stability || 0).toFixed(2)}</div>
              <div><span style={{ fontWeight: 700, color: 'var(--accent)' }}>Nyas Swaras:</span> {(features.advanced_analytics.nyas_swaras || []).join(', ') || 'None'}</div>
              <div style={{ marginTop: '0.5rem' }}>
                <span style={{ fontWeight: 700, color: 'var(--accent)' }}>Confidence Explanation:</span>
                <ul style={{ paddingLeft: '1.2rem', marginTop: '0.2rem', marginBottom: 0 }}>
                  {(features.advanced_analytics.confidence_reason || []).map((reason, idx) => (
                    <li key={idx}>{reason}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

// ======================= RAG CHATBOT SIDEBAR =======================
const ChatSidebar = ({ isOpen, onClose, analysisResult, indexingStatus, chunkCount }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => { scrollToBottom(); }, [messages, isTyping]);

  // Initial welcome message once indexed
  useEffect(() => {
    if (isOpen && indexingStatus === 'indexed' && messages.length === 0) {
      setMessages([{
        role: 'bot',
        text: `✅ PDF Report Processed! I've indexed ${chunkCount} data chunks. I am now strictly grounded in this analysis. Ask me anything about the swaras, mood, or therapy recommendations!`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sources: []
      }]);
    }
  }, [isOpen, indexingStatus]);

  const handleSend = async () => {
    const question = input.trim();
    if (!question) return;

    const userMsg = {
      role: 'user',
      text: question,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const stem = analysisResult?.filename ? analysisResult.filename.split('.')[0] : null;
      const res = await axios.post(`${API_BASE}/chat`, { 
        question, 
        filename: stem 
      });
      const botMsg = {
        role: 'bot',
        text: res.data.answer,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sources: res.data.sources || [],
        images: res.data.related_images || []
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      console.error('Chat error:', err);
      const errorMsg = err.response?.data?.detail || 'Sorry, I encountered an error connecting to the AI. Please ensure the backend is running.';
      setMessages(prev => [...prev, {
        role: 'bot',
        text: errorMsg,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sources: []
      }]);
    }
    setIsTyping(false);
  };

  const handleSuggestion = (q) => {
    setInput(q);
    setTimeout(() => handleSendWithInput(q), 100);
  };

  const handleSendWithInput = async (question) => {
    if (!question) return;
    const userMsg = {
      role: 'user',
      text: question,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);
    try {
      const stem = analysisResult?.filename ? analysisResult.filename.split('.')[0] : null;
      const res = await axios.post(`${API_BASE}/chat`, { 
        question, 
        filename: stem 
      });
      setMessages(prev => [...prev, {
        role: 'bot',
        text: res.data.answer,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sources: res.data.sources || [],
        images: res.data.related_images || []
      }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'bot',
        text: 'Sorry, something went wrong.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sources: []
      }]);
    }
    setIsTyping(false);
  };

  const suggestions = [
    "Why was this classified as this raga?",
    "What swaras were detected?",
    "Explain the therapy recommendation",
    "What is the Pakad pattern?",
    "What does the spectrogram show?",
    "What is the optimal time for this raga?"
  ];

  return (
    <div className={`chat-sidebar ${isOpen ? 'open' : ''}`}>
      {/* Header */}
      <div className="chat-header">
        <div className="chat-header-left">
          <Bot size={22} style={{ color: 'var(--primary)' }} />
          <div>
            <h3>Raga Assistant</h3>
            <div className="chat-status">
              <span className="dot"></span>
              <span>RAG-powered • {chunkCount} chunks indexed</span>
            </div>
          </div>
        </div>
        <button className="chat-close-btn" onClick={onClose}>
          <X size={16} />
        </button>
      </div>

      {/* Index Status Banner */}
      {indexingStatus === 'indexing' && (
        <div className="chat-index-banner indexing">
          <Database size={14} /> Indexing report into vector database...
        </div>
      )}
      {indexingStatus === 'indexed' && chunkCount > 0 && (
        <div className="chat-index-banner indexed">
          <CheckCircle2 size={14} /> Report indexed • {chunkCount} chunks in ChromaDB
        </div>
      )}

      {/* Messages */}
      <div className="chat-messages">
        {messages.length === 0 && indexingStatus !== 'indexing' && (
          <div className="chat-suggestions">
            <span className="chat-suggestions-title">Suggested Questions</span>
            {suggestions.map((q, i) => (
              <button key={i} className="suggestion-chip" onClick={() => handleSuggestion(q)}>
                {q}
              </button>
            ))}
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`chat-msg ${msg.role}`}>
            <div className="bubble">
              {msg.text.split('\n').map((line, j) => (
                <span key={j}>{line}<br/></span>
              ))}
            </div>
            {/* Source badges */}
            {msg.sources && msg.sources.length > 0 && (
              <div className="chat-sources">
                {msg.sources.slice(0, 3).map((s, j) => (
                  <span key={j} className="chat-source-badge">
                    {s.section} ({(s.relevance * 100).toFixed(0)}%)
                  </span>
                ))}
              </div>
            )}
            {/* Inline images */}
            {msg.images && msg.images.map((img, j) => (
              <div key={j} className="chat-image-preview">
                <img src={`${API_BASE}${img}`} alt="Analysis" />
              </div>
            ))}
            <div className="msg-time">{msg.time}</div>
          </div>
        ))}

        {isTyping && (
          <div className="chat-msg bot">
            <div className="typing-indicator">
              <div className="typing-dot"></div>
              <div className="typing-dot"></div>
              <div className="typing-dot"></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="chat-input-area">
        <input
          className="chat-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask about the analysis..."
          disabled={isTyping}
        />
        <button className="chat-send-btn" onClick={handleSend} disabled={isTyping || !input.trim()}>
          <Send size={18} />
        </button>
      </div>
    </div>
  );
};


const App = () => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [bulkResults, setBulkResults] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState(null);
  const [showTherapy, setShowTherapy] = useState(false);
  const [vizMode, setVizMode] = useState('interactive');
  const [pdfLoading, setPdfLoading] = useState(null);
  const [lang, setLang] = useState('en');
  const [isRecording, setIsRecording] = useState(false);
  const [recordTime, setRecordTime] = useState(0);
  const [activeTab, setActiveTab] = useState('upload'); 
  const [feedbackSaved, setFeedbackSaved] = useState(false);
  const [showCorrection, setShowCorrection] = useState(false);
  const [correctedRaga, setCorrectedRaga] = useState('');
  const [chatOpen, setChatOpen] = useState(false);
  const [activeChatResult, setActiveChatResult] = useState(null);
  const [processingStatus, setProcessingStatus] = useState({}); // { [filename]: 'indexing' | 'indexed' | 'error' }
  const [indexingProgress, setIndexingProgress] = useState({}); // { [filename]: number }
  const [chunkCount, setChunkCount] = useState(0);

  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('raga-theme') || 'dark';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
    localStorage.setItem('raga-theme', theme);
  }, [theme]);

  const [assistantIntent, setAssistantIntent] = useState('');
  const [assistantQuery, setAssistantQuery] = useState('');
  const [assistantResult, setAssistantResult] = useState(null);
  const [assistantLoading, setAssistantLoading] = useState(false);
  const [assistantError, setAssistantError] = useState(null);
  const [activeModal, setActiveModal] = useState(null); // 'assistant' | 'upload' | 'record' | null

  const handleRecommend = async () => {
    if (!assistantIntent && !assistantQuery.trim()) {
      setAssistantError('Please select a mood preset or describe what you want.');
      return;
    }
    setAssistantLoading(true);
    setAssistantError(null);
    setAssistantResult(null);
    try {
      const response = await axios.post(`${API_BASE}/recommend`, {
        intent: assistantIntent,
        query: assistantQuery
      });
      setAssistantResult(response.data);
    } catch (err) {
      setAssistantError(err.response?.data?.detail || 'Inference server error');
    }
    setAssistantLoading(false);
  };

  const handleProcessPDF = async (data = result) => {
    if (!data?.filename) return;
    const fname = data.filename;
    
    // Set chat context but DO NOT change the main `result` view to prevent jumping UI
    setActiveChatResult(data); 
    
    setProcessingStatus(prev => ({ ...prev, [fname]: 'indexing' }));
    setIndexingProgress(prev => ({ ...prev, [fname]: 0 }));
    setChunkCount(0);
    
    // Simulate 1-99% progress
    const progressInterval = setInterval(() => {
      setIndexingProgress(prev => {
        const current = prev[fname] || 0;
        if (current >= 95) return prev; // Hold at 95% until complete
        return { ...prev, [fname]: current + Math.floor(Math.random() * 15) + 5 };
      });
    }, 400);

    try {
      // 1. Trigger PDF Generation (No download link clicked here)
      await axios.post(`${API_BASE}/download_pdf`, { data }, { responseType: 'blob' });
      
      // 2. Trigger Indexing
      const res = await axios.post(`${API_BASE}/index_pdf`, { filename: fname });
      
      clearInterval(progressInterval);
      setIndexingProgress(prev => ({ ...prev, [fname]: 100 }));
      
      const total = res.data.total_chunks || 0;
      setChunkCount(total);
      setProcessingStatus(prev => ({ ...prev, [fname]: 'indexed' }));
      // Removed setChatOpen(true) as per user request
    } catch (err) {
      console.error('Process PDF error:', err);
      clearInterval(progressInterval);
      setProcessingStatus(prev => ({ ...prev, [fname]: 'error' }));
    }
  };

  const mediaRecorder = useRef(null);
  const audioChunks = useRef([]);
  const timerInterval = useRef(null);

  const handleDownloadPDF = async (data, index = 'single') => {
    setPdfLoading(index);
    try {
      const response = await axios.post(`${API_BASE}/download_pdf`, { data }, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `RagaVision_Report_${data.filename || 'analysis'}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("PDF Download Error:", err);
      alert("Failed to generate PDF report.");
    }
    setPdfLoading(null);
  };

  const handleFeedback = async (correct) => {
    try {
      await axios.post(`${API_BASE}/feedback`, {
        filename: result?.filename || 'live_recording.wav',
        predicted_raga: result?.prediction || 'Unknown',
        correct_raga: correct || result?.prediction
      });
      setFeedbackSaved(true);
      setShowCorrection(false);
    } catch (err) {
      console.error("Feedback Error:", err);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);
      audioChunks.current = [];
      
      mediaRecorder.current.ondataavailable = (e) => audioChunks.current.push(e.data);
      mediaRecorder.current.onstop = async () => {
        const audioBlob = new Blob(audioChunks.current, { type: 'audio/wav' });
        const file = new File([audioBlob], "live_recording.wav", { type: 'audio/wav' });
        setFiles([file]);
      };

      mediaRecorder.current.start();
      setIsRecording(true);
      setRecordTime(0);
      timerInterval.current = setInterval(() => setRecordTime(prev => prev + 1), 1000);
    } catch (err) {
      setError("Mic Access Denied: " + err.message);
    }
  };

  const stopRecording = () => {
    mediaRecorder.current?.stop();
    setIsRecording(false);
    clearInterval(timerInterval.current);
  };
  
  const waveformRef = useRef(null);
  const wavesurfer = useRef(null);

  useEffect(() => {
    if (waveformRef.current && files.length === 1 && !wavesurfer.current) {
      wavesurfer.current = WaveSurfer.create({
        container: waveformRef.current,
        waveColor: '#b08d4822',
        progressColor: '#b08d48',
        height: 60,
        barWidth: 3,
        normalize: true,
      });
      wavesurfer.current.on('finish', () => setPlaying(false));
      wavesurfer.current.load(URL.createObjectURL(files[0]));
    }
    return () => wavesurfer.current?.destroy();
  }, [files]);

  const handleUpload = async () => {
    if (files.length === 0) return;
    setLoading(true);
    setResult(null);
    setBulkResults(null);
    setError(null);

    const formData = new FormData();
    if (files.length === 1) {
      formData.append('file', files[0]);
      try {
        const response = await axios.post(`${API_BASE}/classify?lang=${lang}`, formData);
        setResult(response.data);
        setFeedbackSaved(false);
        setActiveModal(null);
      } catch (err) {
        setError('Inference Error: ' + (err.response?.data?.detail || 'Server Down'));
      }
    } else {
      Array.from(files).forEach(f => formData.append('files', f));
      try {
        const response = await axios.post(`${API_BASE}/classify_bulk?lang=${lang}`, formData);
        setBulkResults(response.data.results);
        setActiveModal(null);
      } catch (err) {
        const detail = err.response?.data?.detail || err.message;
        setError(`Bulk Analysis Failed: ${detail}`);
      }
    }
    setLoading(false);
  };

  return (
    <div className={`container ${chatOpen ? 'sidebar-open' : ''}`}>
      <header>
        <div style={{ position: 'absolute', top: '2rem', right: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem', zIndex: 100 }}>
          {/* Theme Toggle Button */}
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              padding: '0.5rem 0.75rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--text-h)',
              transition: 'all 0.2s ease',
              height: '38px',
              boxSizing: 'border-box'
            }}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          {/* Language Selector */}
          <div className="lang-selector" style={{ position: 'static' }}>
            <Globe size={16} />
            <select className="lang-select" value={lang} onChange={(e) => setLang(e.target.value)}>
              <option value="en">EN</option>
              <option value="hi">हिन्दी</option>
              <option value="mr">मराठी</option>
              <option value="ta">தமிழ்</option>
            </select>
          </div>
        </div>
        <span className="subtitle" style={{ letterSpacing: '0.4rem', fontWeight: 800, fontSize: '0.75rem' }}>Neuro-Symbolic Musicology</span>
        <h1 className="main-title" style={{
          background: theme === 'dark' 
            ? 'linear-gradient(135deg, var(--primary) 0%, #ffffff 100%)' 
            : 'linear-gradient(135deg, var(--primary) 0%, #0f172a 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          fontWeight: 950,
          letterSpacing: '-0.03em',
          textShadow: theme === 'dark' 
            ? '0 0 40px rgba(245, 158, 11, 0.15)' 
            : '0 0 20px rgba(245, 158, 11, 0.05)',
          marginBottom: '1rem',
          marginTop: '1rem'
        }}>
          RAGA VISION
        </h1>
      </header>

      {loading && <CyberLoader />}

      <div className="main-layout">
        {!result && !bulkResults && (
          <>
            <div className="home-dashboard-grid">
              {/* Card 1: Music Recommendation Assistant Teaser */}
              <div className="home-dashboard-col">
                <div 
                  className="card glass-card teaser-card"
                  onClick={() => setActiveModal('assistant')}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', padding: '2rem' }}
                >
                  <div style={{
                    background: 'rgba(245, 158, 11, 0.1)',
                    borderRadius: '50%',
                    width: '56px',
                    height: '56px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid rgba(245, 158, 11, 0.25)',
                    boxShadow: '0 0 15px rgba(245, 158, 11, 0.1)'
                  }}>
                    <Sparkles size={26} style={{ color: 'var(--primary)' }} />
                  </div>
                  <h3 style={{ margin: 0, color: 'var(--accent)', fontSize: '1.15rem', fontWeight: 850, letterSpacing: '0.03em', textTransform: 'uppercase' }}>
                    Music Recommendation Assistant
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-dim)', lineHeight: '1.4', padding: '0 0.5rem' }}>
                    Describe your listening mood or choose presets to get classical raga recommendations.
                  </p>
                </div>
              </div>

              {/* Card 2: Upload File Teaser */}
              <div className="home-dashboard-col">
                <div 
                  className="card glass-card teaser-card"
                  onClick={() => setActiveModal('upload')}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', padding: '2rem' }}
                >
                  <div style={{
                    background: 'rgba(245, 158, 11, 0.1)',
                    borderRadius: '50%',
                    width: '56px',
                    height: '56px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid rgba(245, 158, 11, 0.25)',
                    boxShadow: '0 0 15px rgba(245, 158, 11, 0.1)'
                  }}>
                    <Music size={26} style={{ color: 'var(--primary)' }} />
                  </div>
                  <h3 style={{ margin: 0, color: 'var(--accent)', fontSize: '1.15rem', fontWeight: 850, letterSpacing: '0.03em', textTransform: 'uppercase' }}>
                    Upload File
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-dim)', lineHeight: '1.4', padding: '0 0.5rem' }}>
                    Select or drag-and-drop WAV, MP3, or FLAC audio files to perform deep swara extraction.
                  </p>
                </div>
              </div>

              {/* Card 3: Record Live Teaser */}
              <div className="home-dashboard-col">
                <div 
                  className="card glass-card teaser-card"
                  onClick={() => setActiveModal('record')}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', padding: '2rem' }}
                >
                  <div style={{
                    background: 'rgba(245, 158, 11, 0.1)',
                    borderRadius: '50%',
                    width: '56px',
                    height: '56px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid rgba(245, 158, 11, 0.25)',
                    boxShadow: '0 0 15px rgba(245, 158, 11, 0.1)'
                  }}>
                    <Mic size={26} style={{ color: 'var(--primary)' }} />
                  </div>
                  <h3 style={{ margin: 0, color: 'var(--accent)', fontSize: '1.15rem', fontWeight: 850, letterSpacing: '0.03em', textTransform: 'uppercase' }}>
                    Record Live
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-dim)', lineHeight: '1.4', padding: '0 0.5rem' }}>
                    Sing or play an instrument directly into your microphone for real-time temporal suitability maps.
                  </p>
                </div>
              </div>
            </div>

            {/* Bottom Info Section: Neural-Symbolic Engine & Therapeutic Insights */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
              gap: '2rem',
              marginTop: '1.5rem',
              marginBottom: '3rem',
              width: '100%'
            }}>
              <div style={{ 
                background: 'rgba(0, 0, 0, 0.15)',
                padding: '2rem',
                borderRadius: '24px',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                textAlign: 'left',
                boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
              }}>
                <h3 style={{ color: 'var(--primary)', fontSize: '1.15rem', fontWeight: 800, marginBottom: '0.8rem', display: 'flex', alignItems: 'center', gap: '10px', letterSpacing: '1px', textTransform: 'uppercase' }}>
                  <Zap size={18} /> NEURAL-SYMBOLIC ENGINE
                </h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-dim)', lineHeight: '1.7', margin: 0 }}>
                  Raga Vision combines deep learning with traditional musicological rules to identify the <b>Temporal Cycle (Prahara)</b> of Indian Classical Music. Our system analyzes microtonal variations and swara distributions to determine the correct time of day for any performance.
                </p>
              </div>

              <div style={{ 
                background: 'rgba(0, 0, 0, 0.15)',
                padding: '2rem',
                borderRadius: '24px',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                textAlign: 'left',
                boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
              }}>
                <h3 style={{ color: 'var(--primary)', fontSize: '1.15rem', fontWeight: 800, marginBottom: '0.8rem', display: 'flex', alignItems: 'center', gap: '10px', letterSpacing: '1px', textTransform: 'uppercase' }}>
                  <Heart size={18} /> THERAPEUTIC INSIGHTS
                </h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-dim)', lineHeight: '1.7', margin: 0 }}>
                  Beyond simple classification, the system maps the acoustic energy of the music to therapeutic wellness profiles. Receive detailed AI-driven narratives on the emotional landscape and cognitive impact of the analyzed raga.
                </p>
              </div>
            </div>
          </>
        )}

        {/* INTERACTIVE FLOATING MODAL OVERLAYS */}
        <AnimatePresence>
          {activeModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                background: 'rgba(0, 0, 0, 0.75)',
                backdropFilter: 'blur(10px)',
                zIndex: 2000,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '2rem',
                boxSizing: 'border-box'
              }}
              onClick={() => setActiveModal(null)}
            >
              <motion.div
                initial={{ scale: 0.95, y: 15 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 15 }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                style={{
                  background: theme === 'dark' ? 'rgba(23, 23, 23, 0.85)' : 'rgba(255, 255, 255, 0.9)',
                  border: '1px solid rgba(245, 158, 11, 0.2)',
                  borderRadius: '32px',
                  width: '100%',
                  maxWidth: activeModal === 'assistant' ? '920px' : '560px',
                  maxHeight: '90vh',
                  overflowY: 'auto',
                  padding: '2.5rem',
                  position: 'relative',
                  boxShadow: '0 30px 60px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)',
                  boxSizing: 'border-box'
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Close Button */}
                <button
                  onClick={() => setActiveModal(null)}
                  style={{
                    position: 'absolute',
                    top: '1.5rem',
                    right: '1.5rem',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid var(--border)',
                    borderRadius: '50%',
                    width: '36px',
                    height: '36px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: 'var(--text-h)',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                >
                  <X size={16} />
                </button>

                {/* MODAL CONTENT BY TYPE */}
                {activeModal === 'assistant' && (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1.25rem' }}>
                      <div style={{
                        background: 'rgba(245, 158, 11, 0.1)',
                        borderRadius: '12px',
                        width: '42px',
                        height: '42px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px solid rgba(245, 158, 11, 0.2)'
                      }}>
                        <Sparkles size={20} style={{ color: 'var(--primary)' }} />
                      </div>
                      <h2 style={{ margin: 0, color: 'var(--accent)', fontSize: '1.35rem', fontWeight: 850, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Music Recommendation Assistant</h2>
                    </div>
                    
                    <p style={{ color: 'var(--text-main)', fontSize: '0.98rem', marginBottom: '1.5rem', fontWeight: 500, textAlign: 'left' }}>
                      Select a preset mood or type a custom request to discover classical ragas matched to your listening intent.
                    </p>

                    {/* Preset buttons */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', marginBottom: '1.5rem' }}>
                      {[
                        { id: 'relax', label: 'Relax' },
                        { id: 'meditate', label: 'Meditate' },
                        { id: 'study', label: 'Study' },
                        { id: 'sleep', label: 'Sleep Preparation' },
                        { id: 'focus', label: 'Improve Focus' },
                        { id: 'morning', label: 'Morning Listening' },
                        { id: 'evening', label: 'Evening Listening' },
                        { id: 'explore', label: 'Explore Music' }
                      ].map(item => (
                        <button
                          key={item.id}
                          className={`preset-chip ${assistantIntent === item.id ? 'active' : ''}`}
                          onClick={() => {
                            setAssistantIntent(item.id);
                            setAssistantError(null);
                          }}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>

                    {/* Text Area */}
                    <div style={{ marginBottom: '1.5rem' }}>
                      <textarea
                        className="chat-input"
                        style={{ 
                          width: '100%', 
                          minHeight: '90px', 
                          padding: '1rem', 
                          borderRadius: '16px', 
                          fontSize: '1rem', 
                          background: 'rgba(0, 0, 0, 0.25)', 
                          color: 'var(--text-main)', 
                          border: '1px solid rgba(176, 141, 72, 0.2)', 
                          resize: 'vertical',
                          lineHeight: '1.5',
                          outline: 'none',
                          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)',
                          transition: 'border-color 0.2s ease'
                        }}
                        onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                        onBlur={(e) => e.target.style.borderColor = 'rgba(176, 141, 72, 0.2)'}
                        value={assistantQuery}
                        onChange={(e) => {
                          setAssistantQuery(e.target.value);
                          setAssistantError(null);
                        }}
                        placeholder="Or describe what you are looking for: e.g. I want something peaceful for the evening..."
                      />
                    </div>

                    {/* Action Button */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
                      <button 
                        className="recommend-btn"
                        onClick={handleRecommend}
                        disabled={assistantLoading || (!assistantIntent && !assistantQuery.trim())}
                        style={{ 
                          opacity: (assistantLoading || (!assistantIntent && !assistantQuery.trim())) ? 0.5 : 1
                        }}
                      >
                        {assistantLoading ? 'Finding recommendations...' : 'Recommend Music'}
                      </button>
                    </div>

                    {assistantError && (
                      <div style={{ color: '#ff4d4d', fontSize: '0.85rem', marginTop: '1rem', background: 'rgba(255, 77, 77, 0.08)', padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid rgba(255, 77, 77, 0.2)', textAlign: 'left' }}>
                        ⚠️ {assistantError}
                      </div>
                    )}

                    {/* Recommendation Display */}
                    {assistantResult && (
                      <motion.div 
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{ marginTop: '2rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '2rem' }}
                      >
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
                          
                          {/* Primary recommendation panel */}
                          <div className="recommendation-panel">
                            <div style={{ marginBottom: '2rem' }}>
                              <span className="label" style={{ display: 'block', marginBottom: '0.75rem', color: 'var(--accent)', fontWeight: 700, fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase', textAlign: 'left' }}>Primary Recommendation</span>
                              <div style={{ 
                                background: 'rgba(0, 0, 0, 0.2)', 
                                padding: '1.5rem', 
                                borderRadius: '20px', 
                                border: '1px solid rgba(176, 141, 72, 0.25)', 
                                boxShadow: '0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)'
                              }}>
                                <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--primary)', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '0.5rem', textAlign: 'left' }}>
                                  {assistantResult.primary_recommendation.category}
                                </div>
                                
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.85rem', color: 'var(--text-main)' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.02)', paddingBottom: '0.3rem' }}>
                                    <span style={{ color: 'var(--text-dim)' }}>Compatibility Match</span>
                                    <span style={{ fontWeight: 800, color: 'var(--accent)' }}>{assistantResult.primary_recommendation.score}%</span>
                                  </div>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.02)', paddingBottom: '0.3rem' }}>
                                    <span style={{ color: 'var(--text-dim)' }}>Best Listening Window</span>
                                    <span style={{ fontWeight: 700 }}>{assistantResult.primary_recommendation.best_time}</span>
                                  </div>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.02)', paddingBottom: '0.3rem' }}>
                                    <span style={{ color: 'var(--text-dim)' }}>Suggested Duration</span>
                                    <span style={{ fontWeight: 700 }}>{assistantResult.primary_recommendation.duration}</span>
                                  </div>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.02)', paddingBottom: '0.3rem' }}>
                                    <span style={{ color: 'var(--text-dim)' }}>Suggested Mood</span>
                                    <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{assistantResult.primary_recommendation.mood}</span>
                                  </div>
                                  
                                  {assistantResult.primary_recommendation.characteristics && (
                                    <div style={{ marginTop: '0.5rem', textAlign: 'left' }}>
                                      <span style={{ color: 'var(--text-dim)', display: 'block', marginBottom: '0.4rem', fontSize: '0.75rem', fontWeight: 600 }}>SUGGESTED CHARACTERISTICS</span>
                                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                                        {assistantResult.primary_recommendation.characteristics.map((c, i) => (
                                          <span key={i} style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '0.3rem 0.7rem', borderRadius: '6px', fontSize: '0.75rem', border: '1px solid rgba(255,255,255,0.06)' }}>
                                            {c}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Alternatives */}
                            {assistantResult.alternatives && assistantResult.alternatives.length > 0 && (
                              <div style={{ marginBottom: '2rem' }}>
                                <span className="label" style={{ display: 'block', marginBottom: '0.75rem', color: 'var(--accent)', fontWeight: 700, fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase', textAlign: 'left' }}>Alternative Recommendations</span>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                                  {assistantResult.alternatives.map((alt, idx) => (
                                    <div key={idx} style={{ 
                                      display: 'flex', 
                                      justifyContent: 'space-between', 
                                      alignItems: 'center',
                                      background: 'rgba(255, 255, 255, 0.02)', 
                                      padding: '0.75rem 1rem', 
                                      borderRadius: '12px', 
                                      fontSize: '0.85rem', 
                                      border: '1px solid rgba(255, 255, 255, 0.05)' 
                                    }}>
                                      <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{alt.activity}</span>
                                      <span style={{ color: 'var(--primary)', fontWeight: 800 }}>{alt.score}%</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Session Plan */}
                            {assistantResult.session_plan && assistantResult.session_plan.length > 0 && (
                              <div style={{ marginBottom: '1.5rem' }}>
                                <span className="label" style={{ display: 'block', marginBottom: '0.75rem', color: 'var(--accent)', fontWeight: 700, fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase', textAlign: 'left' }}>Session Plan</span>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                                  {assistantResult.session_plan.map((r, i) => (
                                    <div key={i} style={{ 
                                      display: 'flex', 
                                      alignItems: 'center', 
                                      gap: '1rem', 
                                      background: 'rgba(255, 255, 255, 0.02)', 
                                      padding: '0.75rem 1rem', 
                                      borderRadius: '12px', 
                                      border: '1px solid rgba(255, 255, 255, 0.04)',
                                      textAlign: 'left'
                                    }}>
                                      <div style={{ 
                                        background: 'linear-gradient(135deg, var(--primary) 0%, #d4af37 100%)', 
                                        color: 'black', 
                                        borderRadius: '50%', 
                                        width: '26px', 
                                        height: '26px', 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        justifyContent: 'center', 
                                        fontSize: '0.75rem', 
                                        fontWeight: 800,
                                        flexShrink: 0
                                      }}>
                                        {i + 1}
                                      </div>
                                      <span style={{ fontSize: '0.85rem', color: 'var(--text-main)', fontWeight: 600 }}>{r}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Right column: scores & explanation */}
                          <div className="explanation-panel">
                            {/* Compatibility grid */}
                            {assistantResult.recommendation_scores && (
                              <div style={{ marginBottom: '2rem' }}>
                                <span className="label" style={{ display: 'block', marginBottom: '0.75rem', color: 'var(--accent)', fontWeight: 700, fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase', textAlign: 'left' }}>Recommendation Compatibility Matrix</span>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.5rem' }}>
                                  {Object.entries(assistantResult.recommendation_scores)
                                    .sort((a, b) => b[1] - a[1])
                                    .map(([activity, score]) => (
                                      <div key={activity} style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', background: 'rgba(255, 255, 255, 0.02)', padding: '0.6rem 0.8rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.04)', textAlign: 'left' }}>
                                        <span style={{ fontWeight: 600, color: 'var(--text-dim)', fontSize: '0.75rem', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{activity}</span>
                                        <span style={{ color: 'var(--primary)', fontWeight: 800, fontSize: '0.95rem' }}>{score}%</span>
                                      </div>
                                    ))}
                                </div>
                              </div>
                            )}

                            {/* Why this recommendation */}
                            <span className="label" style={{ display: 'block', marginBottom: '0.75rem', color: 'var(--accent)', fontWeight: 700, fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase', textAlign: 'left' }}>Why this recommendation?</span>
                            <div style={{ 
                              background: 'rgba(0, 0, 0, 0.15)', 
                              padding: '1.5rem', 
                              borderRadius: '20px', 
                              border: '1px solid rgba(255, 255, 255, 0.05)',
                              boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                            }}>
                              <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.85rem', color: 'var(--text-main)', lineHeight: '1.6', textAlign: 'left' }}>
                                {assistantResult.explanation.map((point, i) => (
                                  <li key={i} style={{ marginBottom: '0.6rem' }}>{point}</li>
                                ))}
                              </ul>
                            </div>
                          </div>

                        </div>
                      </motion.div>
                    )}
                  </div>
                )}

                {activeModal === 'upload' && (
                  <div>
                    <h3 style={{ color: 'var(--accent)', fontSize: '1.25rem', fontWeight: 850, marginBottom: '1.5rem', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Music size={18} style={{ color: 'var(--primary)' }} /> Upload File
                    </h3>
                    
                    <div 
                      className="upload-zone"
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        setFiles(Array.from(e.dataTransfer.files));
                      }}
                      onClick={() => document.getElementById('fileInput').click()}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '2px dashed rgba(245, 158, 11, 0.25)',
                        borderRadius: '16px',
                        padding: '2.5rem',
                        cursor: 'pointer',
                        background: 'rgba(255, 255, 255, 0.01)',
                        transition: 'all 0.3s ease',
                        minHeight: '200px'
                      }}
                    >
                      <div className="upload-icon" style={{ marginBottom: '1rem', color: 'var(--primary)' }}>
                        <Music size={48} strokeWidth={1.5} />
                      </div>
                      <h4 className="upload-title" style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 0.5rem 0', color: 'var(--accent)' }}>Drop your audio here</h4>
                      <p className="upload-subtitle" style={{ fontSize: '0.85rem', color: 'var(--text-dim)', margin: 0 }}>WAV, MP3, or FLAC (Max 20MB)</p>
                      <input 
                        id="fileInput"
                        type="file" 
                        style={{ display: 'none' }} 
                        onChange={(e) => setFiles(Array.from(e.target.files))}
                        multiple
                      />
                    </div>

                    <AnimatePresence>
                      {files && files.length > 0 && files[0]?.name !== 'live_recording.wav' && (
                        <motion.div 
                          className="analyzer-view"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          style={{ marginTop: '1.5rem' }}
                        >
                          <div className="file-info" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255, 255, 255, 0.03)', padding: '0.75rem 1rem', borderRadius: '12px', marginBottom: '1rem', border: '1px solid rgba(255, 255, 255, 0.05)', fontSize: '0.9rem' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent)', fontWeight: 600 }}>
                              <Music size={16} /> {files.length} file(s) selected
                            </span>
                            <button className="reset-btn" onClick={() => { setFiles([]); setResult(null); setBulkResults(null); }} style={{ background: 'none', border: 'none', color: '#ff4d4d', cursor: 'pointer', fontWeight: 700 }}>Reset</button>
                          </div>

                          {files.length === 1 && <div className="waveform-box" ref={waveformRef} style={{ marginBottom: '1rem', background: 'rgba(0,0,0,0.2)', padding: '0.5rem', borderRadius: '12px' }}></div>}

                          <div className="action-row" style={{ display: 'flex', gap: '0.5rem' }}>
                            {files.length === 1 && (
                              <button className="play-btn" onClick={() => { wavesurfer.current.playPause(); setPlaying(!playing); }} style={{ width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justify: 'center', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', color: 'var(--accent)', cursor: 'pointer' }}>
                                {playing ? <Pause size={20} /> : <Play size={20} />}
                              </button>
                            )}
                            <button className="analyze-btn" onClick={handleUpload} disabled={loading} style={{ flex: 1, background: 'linear-gradient(135deg, var(--primary) 0%, #d4af37 100%)', color: 'black', border: 'none', borderRadius: '12px', fontWeight: 800, cursor: 'pointer', height: '48px' }}>
                              {loading ? 'Processing Neural Queue...' : `Analyze ${files.length} Input(s)`}
                            </button>
                          </div>
                          {error && <div className="error-box" style={{ color: '#ff4d4d', marginTop: '1rem', fontSize: '0.85rem', textAlign: 'left' }}>{error}</div>}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {activeModal === 'record' && (
                  <div>
                    <h3 style={{ color: 'var(--accent)', fontSize: '1.25rem', fontWeight: 850, marginBottom: '1.5rem', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Mic size={18} style={{ color: 'var(--primary)' }} /> Record Live
                    </h3>
                    
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                      borderRadius: '16px',
                      padding: '2rem',
                      background: 'rgba(0, 0, 0, 0.15)',
                      minHeight: '200px'
                    }}>
                      <div className="record-timer" style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--accent)', marginBottom: '1rem' }}>
                        {Math.floor(recordTime / 60)}:{(recordTime % 60).toString().padStart(2, '0')}
                      </div>
                      <button 
                        className={`mic-btn ${isRecording ? 'recording' : ''}`}
                        onClick={isRecording ? stopRecording : startRecording}
                        style={{
                          width: '80px',
                          height: '80px',
                          borderRadius: '50%',
                          background: isRecording ? '#ef4444' : 'rgba(245, 158, 11, 0.1)',
                          border: isRecording ? 'none' : '2px dashed var(--primary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          color: isRecording ? 'white' : 'var(--primary)',
                          transition: 'all 0.3s ease',
                          boxShadow: isRecording ? '0 0 25px rgba(239, 68, 68, 0.4)' : 'none',
                          marginBottom: '0.75rem'
                        }}
                      >
                        <Mic size={32} />
                      </button>
                      <p className="upload-subtitle" style={{ fontSize: '0.9rem', color: 'var(--text-dim)', margin: 0 }}>
                        {isRecording ? "Recording Swaras..." : "Click mic to start session"}
                      </p>
                    </div>

                    <AnimatePresence>
                      {files && files.length > 0 && files[0]?.name === 'live_recording.wav' && (
                        <motion.div 
                          className="analyzer-view"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          style={{ marginTop: '1.5rem' }}
                        >
                          <div className="file-info" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255, 255, 255, 0.03)', padding: '0.75rem 1rem', borderRadius: '12px', marginBottom: '1rem', border: '1px solid rgba(255, 255, 255, 0.05)', fontSize: '0.9rem' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent)', fontWeight: 600 }}>
                              <History size={16} /> Live Recording Ready
                            </span>
                            <button className="reset-btn" onClick={() => { setFiles([]); setResult(null); setBulkResults(null); }} style={{ background: 'none', border: 'none', color: '#ff4d4d', cursor: 'pointer', fontWeight: 700 }}>Reset</button>
                          </div>

                          <div className="action-row">
                            <button className="analyze-btn" onClick={handleUpload} disabled={loading} style={{ width: '100%', background: 'linear-gradient(135deg, var(--primary) 0%, #d4af37 100%)', color: 'black', border: 'none', borderRadius: '12px', fontWeight: 800, cursor: 'pointer', height: '48px' }}>
                              {loading ? 'Processing Neural Queue...' : 'Analyze Recording'}
                            </button>
                          </div>
                          {error && <div className="error-box" style={{ color: '#ff4d4d', marginTop: '1rem', fontSize: '0.85rem', textAlign: 'left' }}>{error}</div>}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {result && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              className="result-container"
            >
              <div className="card neural-intel-box">
                
                {/* --- NEW SECTION: THERAPY ANALYSIS (TOGGLEABLE) --- */}
                <AnimatePresence>
                  {showTherapy && result.therapy && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0, marginBottom: 0 }} 
                      animate={{ opacity: 1, height: 'auto', marginBottom: '2rem' }} 
                      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                      className="therapy-analysis-card"
                      style={{ 
                        overflow: 'hidden',
                        padding: '2rem', 
                        background: 'rgba(176, 141, 72, 0.05)', 
                        borderRadius: '30px', 
                        border: '1px solid var(--primary)' 
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                        <span style={{ fontSize: '1.5rem' }}>🧘</span>
                        <h2 style={{ margin: 0, color: 'var(--accent)', fontSize: '1.75rem' }}>Therapy Analysis</h2>
                      </div>

                      {/* Music Wellness Profile */}
                      <div style={{ marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <span className="label" style={{ display: 'block', fontSize: '1.05rem', color: 'var(--accent)', fontWeight: 800 }}>🎵 Music Wellness Profile</span>
                        <div className="therapy-scores-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
                          <div className="score-block">
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem', fontWeight: 800, color: 'var(--text-main)', fontSize: '0.95rem' }}>
                              <span>Calmness</span>
                              <span style={{ color: 'var(--primary)' }}>{result.therapy.wellness_profile?.calmness ?? result.therapy.therapy_scores?.calm_score ?? 5}/10</span>
                            </div>
                            <div className="progress-bg"><div className="progress-fill calm" style={{ width: `${(result.therapy.wellness_profile?.calmness ?? result.therapy.therapy_scores?.calm_score ?? 5) * 10}%` }}></div></div>
                          </div>
                          <div className="score-block">
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem', fontWeight: 800, color: 'var(--text-main)', fontSize: '0.95rem' }}>
                              <span>Energy</span>
                              <span style={{ color: 'var(--primary)' }}>{result.therapy.wellness_profile?.energy ?? result.therapy.therapy_scores?.energy_score ?? 5}/10</span>
                            </div>
                            <div className="progress-bg"><div className="progress-fill energy" style={{ width: `${(result.therapy.wellness_profile?.energy ?? result.therapy.therapy_scores?.energy_score ?? 5) * 10}%` }}></div></div>
                          </div>
                          <div className="score-block">
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem', fontWeight: 800, color: 'var(--text-main)', fontSize: '0.95rem' }}>
                              <span>Focus</span>
                              <span style={{ color: 'var(--primary)' }}>{result.therapy.wellness_profile?.focus ?? result.therapy.therapy_scores?.focus_score ?? 5}/10</span>
                            </div>
                            <div className="progress-bg"><div className="progress-fill focus" style={{ width: `${(result.therapy.wellness_profile?.focus ?? result.therapy.therapy_scores?.focus_score ?? 5) * 10}%` }}></div></div>
                          </div>
                          <div className="score-block">
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem', fontWeight: 800, color: 'var(--text-main)', fontSize: '0.95rem' }}>
                              <span>Brightness</span>
                              <span style={{ color: 'var(--primary)' }}>{result.therapy.wellness_profile?.brightness ?? 5}/10</span>
                            </div>
                            <div className="progress-bg"><div className="progress-fill uplifting" style={{ width: `${(result.therapy.wellness_profile?.brightness ?? 5) * 10}%`, background: '#fbc02d' }}></div></div>
                          </div>
                          <div className="score-block">
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem', fontWeight: 800, color: 'var(--text-main)', fontSize: '0.95rem' }}>
                              <span>Stability</span>
                              <span style={{ color: 'var(--primary)' }}>{result.therapy.wellness_profile?.stability ?? 5}/10</span>
                            </div>
                            <div className="progress-bg"><div className="progress-fill relaxing" style={{ width: `${(result.therapy.wellness_profile?.stability ?? 5) * 10}%`, background: '#2e7d32' }}></div></div>
                          </div>
                          <div className="score-block">
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem', fontWeight: 800, color: 'var(--text-main)', fontSize: '0.95rem' }}>
                              <span>Complexity</span>
                              <span style={{ color: 'var(--primary)' }}>{result.therapy.wellness_profile?.complexity ?? 5}/10</span>
                            </div>
                            <div className="progress-bg"><div className="progress-fill focus" style={{ width: `${(result.therapy.wellness_profile?.complexity ?? 5) * 10}%`, background: '#8e24aa' }}></div></div>
                          </div>
                        </div>
                      </div>

                      {/* Temporal Suitability */}
                      {result.therapy.temporal_suitability && (
                        <div className="temporal-suitability-panel" style={{ marginBottom: '2rem' }}>
                          <span className="label" style={{ display: 'block', marginBottom: '0.75rem', fontSize: '1.05rem', color: 'var(--accent)', fontWeight: 800 }}>⏰ TEMPORAL SUITABILITY</span>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '1rem', background: 'rgba(0, 0, 0, 0.2)', padding: '1rem', borderRadius: '15px', border: '1px solid var(--border)' }}>
                            {Object.entries(result.therapy.temporal_suitability).map(([timeOfDay, pct]) => {
                              const TEMPORAL_NAMES = {
                                early_morning: "Early Morning",
                                morning: "Morning",
                                afternoon: "Afternoon",
                                evening: "Evening",
                                night: "Night",
                                late_night: "Late Night"
                              };
                              return (
                                <div key={timeOfDay} style={{ textAlign: 'center' }}>
                                  <div style={{ fontSize: '0.85rem', color: 'var(--text-main)', fontWeight: 700 }}>
                                    {TEMPORAL_NAMES[timeOfDay] || timeOfDay.replace('_', ' ')}
                                  </div>
                                  <div style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--primary)', margin: '0.2rem 0' }}>
                                    {pct}%
                                  </div>
                                  <div className="progress-bg" style={{ height: '4px', margin: '0 auto', width: '80%' }}>
                                    <div className="progress-fill calm" style={{ width: `${pct}%`, height: '100%' }}></div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                        <div className="recommendation-panel">
                          <div style={{ marginBottom: '1.5rem' }}>
                            <span className="label" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '1.05rem', color: 'var(--accent)', fontWeight: 800 }}>Primary Recommendation</span>
                            <div style={{ background: 'rgba(0, 0, 0, 0.2)', padding: '1.25rem', borderRadius: '15px', border: '1px solid var(--border)' }}>
                              <div style={{ fontSize: '1.3rem', fontWeight: 900, color: 'var(--primary)', marginBottom: '0.5rem' }}>
                                {result.therapy.primary_recommendation?.activity ?? result.therapy.recommendation?.primary}
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.95rem', color: 'var(--text-main)', marginTop: '0.5rem', borderTop: '1px solid var(--border)', paddingTop: '0.5rem' }}>
                                {result.therapy.primary_recommendation?.score !== undefined && (
                                  <div><span style={{ color: 'var(--text-dim)', fontWeight: 600 }}>Compatibility:</span> <strong style={{ color: 'var(--primary)' }}>{result.therapy.primary_recommendation.score}%</strong></div>
                                )}
                                {result.therapy.primary_recommendation?.best_time && (
                                  <div><span style={{ color: 'var(--text-dim)', fontWeight: 600 }}>Best Time:</span> <strong style={{ color: 'var(--text-main)' }}>{result.therapy.primary_recommendation.best_time}</strong></div>
                                )}
                                {result.therapy.primary_recommendation?.suggested_duration && (
                                  <div><span style={{ color: 'var(--text-dim)', fontWeight: 600 }}>Suggested Duration:</span> <strong style={{ color: 'var(--text-main)' }}>{result.therapy.primary_recommendation.suggested_duration}</strong></div>
                                )}
                                {result.therapy.primary_recommendation?.intensity && (
                                  <div><span style={{ color: 'var(--text-dim)', fontWeight: 600 }}>Intensity:</span> <strong style={{ color: 'var(--text-main)' }}>{result.therapy.primary_recommendation.intensity}</strong></div>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Alternatives */}
                          {result.therapy.alternatives && result.therapy.alternatives.length > 0 && (
                            <div style={{ marginBottom: '1.5rem' }}>
                              <span className="label" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '1.05rem', color: 'var(--accent)', fontWeight: 800 }}>ALTERNATIVE RECOMMENDATIONS</span>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {result.therapy.alternatives.map((alt, idx) => (
                                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', background: 'rgba(0, 0, 0, 0.15)', padding: '0.6rem 0.8rem', borderRadius: '10px', fontSize: '0.95rem', border: '1px solid var(--border)' }}>
                                    <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{alt.activity}</span>
                                    <span style={{ color: 'var(--primary)', fontWeight: 800 }}>{alt.score}%</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Session Plan */}
                          {result.therapy.session_plan && result.therapy.session_plan.length > 0 && (
                            <div className="session-planner" style={{ marginBottom: '1.5rem' }}>
                              <span className="label" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '1.05rem', color: 'var(--accent)', fontWeight: 800 }}>SESSION PLAN</span>
                              <div className="timeline">
                                {result.therapy.session_plan.map((r, i) => (
                                  <div key={i} className="timeline-item">
                                    <span className="time">{i === 0 ? "0m - 20m" : i === 1 ? "20m - 45m" : "45m - 60m"}</span>
                                    <span className="raga">{r}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Recommendation Compatibility Scores */}
                          {result.therapy.recommendation_scores && (
                            <div style={{ marginBottom: '1.5rem' }}>
                              <span className="label" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '1.05rem', color: 'var(--accent)', fontWeight: 800 }}>RECOMMENDATION COMPATIBILITY</span>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.5rem' }}>
                                {Object.entries(result.therapy.recommendation_scores)
                                  .sort((a, b) => b[1] - a[1])
                                  .map(([activity, score]) => (
                                    <div key={activity} style={{ display: 'flex', justifyContent: 'space-between', background: 'rgba(0, 0, 0, 0.15)', padding: '0.5rem 0.75rem', borderRadius: '8px', fontSize: '0.9rem', border: '1px solid var(--border)' }}>
                                      <span style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.85rem' }}>{activity}</span>
                                      <span style={{ color: 'var(--primary)', fontWeight: 800 }}>{score}%</span>
                                    </div>
                                  ))}
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="explanation-panel">
                          <span className="label" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '1.05rem', color: 'var(--accent)', fontWeight: 800 }}>Why this recommendation?</span>
                          <div style={{ background: 'rgba(0, 0, 0, 0.15)', padding: '1.25rem', borderRadius: '15px', border: '1px solid var(--border)' }}>
                            <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.98rem', color: 'var(--text-main)', lineHeight: '1.6' }}>
                              {result.therapy.explanation.map((point, i) => (
                                <li key={i} style={{ marginBottom: '0.5rem' }}>{point}</li>
                              ))}
                            </ul>
                          </div>
                          {result.therapy.raga_metadata?.science_note && (
                            <div className="science-note-card" style={{ marginTop: '1.5rem' }}>
                              <strong>Note:</strong> {result.therapy.raga_metadata.science_note}
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="result-header">
                  <div style={{ flex: 1 }}>
                    <span className="label">Identified Raag</span>
                    <h2 className="prediction-display">{result.prediction}</h2>
                    
                    <div className="swara-chips">
                      {result.metadata.swaras.map(s => (
                        <span key={s} className="swara-chip">{s}</span>
                      ))}
                    </div>

                    <div className="meta-grid">
                      <div className="meta-chip">
                        <span className="m-label">Rasa</span>
                        <span className="m-val">{result.therapy?.raga_metadata?.rasa || 'Universal'}</span>
                      </div>
                      <div className="meta-chip">
                        <span className="m-label">Vadi</span>
                        <span className="m-val">{result.therapy?.raga_metadata?.vadi || 'N/A'}</span>
                      </div>
                      <div className="meta-chip">
                        <span className="m-label">Samvadi</span>
                        <span className="m-val">{result.therapy?.raga_metadata?.samvadi || 'N/A'}</span>
                      </div>
                      <div className="meta-chip">
                        <span className="m-label">Ideal Time</span>
                        <span className="m-val">{result.therapy?.raga_metadata?.optimal_time || 'Anytime'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="confidence-ring">
                    <div className="label">Confidence</div>
                    <div className="conf-value">{Math.round(result.confidence * 100)}%</div>
                    <div className="conf-label">Neural match</div>
                  </div>
                </div>

                <div className="narrative-section">
                  <div className="label" style={{ marginBottom: '1rem' }}>AI Narrative Analysis</div>
                  <p className="narrative-text">{result.narrative}</p>
                </div>

                {/* Feedback Loop */}
                <div className="feedback-widget">
                  {feedbackSaved ? (
                    <div className="rec-badge primary">
                      <CheckCircle2 size={20} />
                      Feedback Recorded. Thank you!
                    </div>
                  ) : showCorrection ? (
                    <div className="feedback-correction">
                      <span className="sub-label">Correct the Raag:</span>
                      <select 
                        className="correction-select"
                        onChange={(e) => setCorrectedRaga(e.target.value)}
                      >
                        <option value="">Select correct raga...</option>
                        {["Bhairav", "Yaman", "Bhairavi", "Malkauns", "Durga", "Todi", "Bageshri", "Kedar", "Darbari", "Bhimpalasi", "Kafi", "Hamsadhwani"].map(r => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                      <button className="analyze-btn" onClick={() => handleFeedback(correctedRaga)}>
                        Submit Correction
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="sub-label">Was this classification correct?</span>
                      <div className="feedback-btns">
                        <button className="feedback-btn yes" onClick={() => handleFeedback()}>
                          <ThumbsUp size={18} /> Yes
                        </button>
                        <button className="feedback-btn no" onClick={() => setShowCorrection(true)}>
                          <ThumbsDown size={18} /> No
                        </button>
                      </div>
                    </>
                  )}
                </div>

                <div className="result-header" style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid var(--border)' }}>
                  <div>

                    <button 
                      onClick={() => setShowTherapy(!showTherapy)}
                      className="therapy-toggle-btn"
                      style={{
                        padding: '0.6rem 1.2rem',
                        background: showTherapy ? 'var(--accent)' : 'var(--primary)',
                        color: '#0f1115',
                        border: 'none',
                        borderRadius: '10px',
                        fontWeight: '800',
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        boxShadow: '0 4px 12px rgba(176, 141, 72, 0.2)'
                      }}
                    >
                      <Heart size={16} fill={showTherapy ? '#0f1115' : 'transparent'} />
                      {showTherapy ? 'Hide Therapy Analysis' : 'View Therapy Analysis'}
                    </button>
                    <button 
                      onClick={() => handleDownloadPDF(result, 'single')}
                      disabled={pdfLoading === 'single'}
                      className="pdf-btn"
                      style={{
                        padding: '0.6rem 1.2rem',
                        background: 'rgba(255,255,255,0.05)',
                        color: 'var(--primary)',
                        border: '1px solid var(--primary)',
                        borderRadius: '10px',
                        fontWeight: '800',
                        fontSize: '0.85rem',
                        cursor: 'pointer'
                      }}
                    >
                      {pdfLoading === 'single' ? 'Generating PDF...' : 'Download Full PDF Report'}
                    </button>
                    <button 
                      className="process-pdf-btn"
                      onClick={() => {
                        if (processingStatus[result?.filename] === 'indexed') {
                          setActiveChatResult(result);
                          setChatOpen(true);
                        } else {
                          handleProcessPDF();
                        }
                      }}
                      disabled={processingStatus[result?.filename] === 'indexing'}
                      style={{
                        padding: '0.6rem 1.2rem',
                        background: processingStatus[result?.filename] === 'indexed' ? 'linear-gradient(135deg, #3b82f6, #2563eb)' : 'linear-gradient(135deg, #059669, #10b981)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '10px',
                        fontWeight: '800',
                        fontSize: '0.85rem',
                        cursor: processingStatus[result?.filename] === 'indexing' ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        transition: 'all 0.3s',
                        boxShadow: processingStatus[result?.filename] === 'indexed' ? '0 4px 12px rgba(59, 130, 246, 0.3)' : '0 4px 12px rgba(16, 185, 129, 0.3)',
                        opacity: processingStatus[result?.filename] === 'indexing' ? 0.7 : 1
                      }}
                    >
                      {processingStatus[result?.filename] === 'indexing' ? <Sparkles className="animate-spin" size={16} /> : processingStatus[result?.filename] === 'indexed' ? <Bot size={16} /> : <Database size={16} />}
                      {processingStatus[result?.filename] === 'indexing' ? `Embedding Chunks... ${Math.min(indexingProgress[result?.filename] || 0, 99)}%` : processingStatus[result?.filename] === 'indexed' ? 'Open Raga Chatbot' : 'Process for RAG Chat'}
                    </button>
                    <button
                      onClick={() => {
                        const isRecord = result?.filename === 'live_recording.wav';
                        setFiles([]);
                        setResult(null);
                        setBulkResults(null);
                        setActiveModal(isRecord ? 'record' : 'upload');
                      }}
                      style={{
                        padding: '0.6rem 1.2rem',
                        background: 'linear-gradient(135deg, var(--primary) 0%, #d4af37 100%)',
                        color: '#0f1115',
                        border: 'none',
                        borderRadius: '10px',
                        fontWeight: '800',
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        boxShadow: '0 4px 12px rgba(176, 141, 72, 0.2)'
                      }}
                    >
                      {result?.filename === 'live_recording.wav' ? (
                        <>
                          <Mic size={16} /> Record Another Session
                        </>
                      ) : (
                        <>
                          <Music size={16} /> Upload Another File
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Removed from here to place below spectrogram */}

                <div className="neural-visuals">
                  <div className="visual-block">
                    <span className="label">Neural Feature Extraction</span>
                    <SpectrogramView data={result.spectrogram} />
                  </div>
                  
                  <div className="insight-block hybrid">
                    <div className="hybrid-badge">
                      <Sparkles size={14} />
                      <span>Hybrid Intel Active</span>
                    </div>

                    <div className="insight-item primary">
                      <Music size={20} />
                      <div>
                        <span className="label">Primary Therapy</span>
                        <h3>{result.therapy.recommendation.primary}</h3>
                      </div>
                    </div>

                    <div className="insight-item">
                      <Zap size={16} />
                      <span>Mood Profile: Calm {result.therapy.therapy_scores.calm_score} | Energy {result.therapy.therapy_scores.energy_score} | Focus {result.therapy.therapy_scores.focus_score}</span>
                    </div>

                    <div className="swara-chips">
                      {result.metadata.swaras.map((s, idx) => (
                        <span key={idx} className="swara-chip">{s}</span>
                      ))}
                    </div>

                    {result.metadata.advanced_features && result.metadata.advanced_features.most_frequent && (
                      <div className="feature-summary" style={{ marginTop: '1rem', padding: '0.8rem', background: 'rgba(0,0,0,0.2)', borderRadius: '6px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <div>
                            <div style={{ fontSize: '0.8rem', color: '#aaa', marginBottom: '0.2rem' }}>Most Frequent Note</div>
                            <div style={{ fontWeight: 600, color: 'var(--primary)' }}>{result.metadata.advanced_features.most_frequent}</div>
                          </div>
                          <div>
                            <div style={{ fontSize: '0.8rem', color: '#aaa', marginBottom: '0.2rem' }}>Vadi Note</div>
                            <div style={{ fontWeight: 600, color: '#4db8ff' }}>{result.metadata.advanced_features.vadi}</div>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="logic-message" style={{ marginTop: '1rem' }}>
                      {result.report[0] || "Aligned with traditional musicology."}
                    </div>
                  </div>
                </div>

                {/* --- NEW: INTERACTIVE REAL-TIME CHARTS --- */}
                <div className="interactive-visuals card" style={{ marginTop: '1.5rem', background: 'var(--bg-card)', border: '1px solid var(--primary)' }}>
                  <div className="label" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <Activity size={16} /> 
                      <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '2px', border: '1px solid var(--border)' }}>
                        <button 
                          onClick={() => setVizMode('interactive')}
                          style={{ border: 'none', background: vizMode === 'interactive' ? 'var(--primary)' : 'transparent', color: vizMode === 'interactive' ? '#000' : 'var(--text-dim)', padding: '4px 12px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s' }}
                        >INTERACTIVE</button>
                        <button 
                          onClick={() => setVizMode('png')}
                          style={{ border: 'none', background: vizMode === 'png' ? 'var(--primary)' : 'transparent', color: vizMode === 'png' ? '#000' : 'var(--text-dim)', padding: '4px 12px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s' }}
                        >PNG MODE</button>
                      </div>
                    </div>
                    {result.image_url && (
                      <a href={result.image_url} download={`audio_analysis.png`} className="download-btn" style={{ padding: '0.4rem 0.8rem', background: 'var(--primary)', color: '#000', borderRadius: '4px', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 'bold' }}>
                        Download PNG
                      </a>
                    )}
                  </div>

                  {vizMode === 'interactive' ? (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                      <div>
                        <span className="sub-label" style={{ fontSize: '0.7rem', opacity: 0.7 }}>Real-time Pitch Tracking (Hz)</span>
                        <InteractivePitchChart data={result.pitch_contour_data} />
                      </div>
                      <div>
                        <span className="sub-label" style={{ fontSize: '0.7rem', opacity: 0.7 }}>Swara Energy Distribution (%)</span>
                        <InteractiveSwaraChart distribution={result.swara_distribution_data} />
                      </div>
                    </div>
                  ) : (
                    <div className="static-dash-view" style={{ background: '#111', borderRadius: '12px', overflow: 'hidden', border: '1px solid #333' }}>
                      <img src={`${API_BASE}${result.image_url}`} alt="Static Analysis Dashboard" style={{ width: '100%', display: 'block' }} />
                    </div>
                  )}
                  
                  <div style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-dim)', fontStyle: 'italic' }}>
                    Hover over data points to see precise neural extraction values and timestamps.
                  </div>
                </div>

                {/* --- LEGACY COMPREHENSIVE DASHBOARD (PROMINENT) MOVED TO TAB OR HIDDEN IF INTERACTIVE IS PREFERRED --- */}
                {/* We keep the image hidden but accessible via the download button above to reduce clutter */}
                {false && result.image_url && (
                  <div className="analysis-visualization card" style={{ marginTop: '1.5rem', marginBottom: '0rem' }}>
                    <div className="label" style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Layers size={16} /> Visual Analysis Dashboard
                      </div>
                    </div>
                    <div className="image-container" style={{ textAlign: 'center', background: '#111', borderRadius: '8px', padding: '0.5rem' }}>
                      <img src={result.image_url} alt="Raga Analysis Dashboard" style={{ maxWidth: '100%', height: 'auto', borderRadius: '4px', display: 'block' }} />
                    </div>
                  </div>
                )}


                <div className="narrative-section card" style={{ marginTop: '1.5rem' }}>
                  <div className="label" style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Sparkles size={16} /> Reasoning Narrative
                  </div>
                  <p className="narrative-text">{result.narrative}</p>
                </div>


                <DetailedFeatureAnalysis features={result.detailed_features} />

                {/* --- NEW: DETAILED VISUALIZATIONS (Only show if not in PNG mode) --- */}
                {vizMode === 'interactive' && (
                  <div className="detailed-visuals-grid" style={{ marginTop: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                    {result.pitch_contour_url && (
                      <div className="visual-card card">
                        <span className="label" style={{ marginBottom: '1rem', display: 'block' }}>Pitch Contour Analysis</span>
                        <img src={`${API_BASE}${result.pitch_contour_url}`} alt="Pitch Contour" style={{ width: '100%', borderRadius: '4px' }} />
                      </div>
                    )}
                    {result.spectrogram_url && (
                      <div className="visual-card card">
                        <span className="label" style={{ marginBottom: '1rem', display: 'block' }}>Spectral Fingerprint</span>
                        <img src={`${API_BASE}${result.spectrogram_url}`} alt="Spectrogram" style={{ width: '100%', borderRadius: '4px' }} />
                      </div>
                    )}
                  </div>
                )}

                {/* Disclaimer */}
                <div className="disclaimer-footer" style={{ marginTop: '2rem', padding: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)', textAlign: 'center', opacity: 0.6 }}>
                  <p style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                    <AlertCircle size={12} /> This system provides recommendations based on audio features and is not a medical diagnosis tool.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {bulkResults && (
            <BulkResultsView 
              data={bulkResults} 
              files={files} 
              handleDownloadPDF={handleDownloadPDF} 
              pdfLoading={pdfLoading} 
              handleProcessPDF={handleProcessPDF}
              processingStatus={processingStatus}
              indexingProgress={indexingProgress}
              chunkCount={chunkCount}
              openChat={(item) => {
                setActiveChatResult(item);
                setChatOpen(true);
              }}
              onReset={() => {
                setFiles([]);
                setResult(null);
                setBulkResults(null);
                setActiveModal('upload');
              }}
            />
          )}
        </AnimatePresence>
      </div>
      {/* RAG Chatbot Sidebar */}
      <ChatSidebar 
        isOpen={chatOpen} 
        onClose={() => setChatOpen(false)} 
        analysisResult={activeChatResult || result}
        indexingStatus={processingStatus[(activeChatResult || result)?.filename] || 'idle'}
        chunkCount={chunkCount}
      />

      {/* Floating Chat Toggle Button */}
      {(result || bulkResults) && (
        <button 
          className={`chat-toggle-btn ${chatOpen ? 'active' : ''}`}
          onClick={() => setChatOpen(!chatOpen)}
          title="Ask AI about your analysis"
        >
          {chatOpen ? <X size={24} /> : <MessageCircle size={24} />}
        </button>
      )}
    </div>
  );
};

export default App;
