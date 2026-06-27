import { useEffect, useRef, useState } from 'react';
import { Engine } from '@beetle/index';
import { DemoGameScene } from './game/DemoGame';

interface Achievement {
  id: string;
  title: string;
  description: string;
}

// Synthesize a retro-style coin sound effect buffer
const createCoinSoundBuffer = (ctx: AudioContext): AudioBuffer => {
  const sampleRate = ctx.sampleRate;
  const duration = 0.25; // 250ms
  const buffer = ctx.createBuffer(1, sampleRate * duration, sampleRate);
  const data = buffer.getChannelData(0);
  
  for (let i = 0; i < data.length; i++) {
    const t = i / sampleRate;
    // Retro coin dual-tone effect: starts at 987.77Hz (B5) and jumps to 1318.51Hz (E6)
    const freq = t < 0.08 ? 987.77 : 1318.51;
    // Exponential fade envelope
    const env = Math.exp(-t * 12);
    // Add square/triangle-like harmonics for retro crunch
    const tone = Math.sin(2 * Math.PI * freq * t) + 0.3 * Math.sin(6 * Math.PI * freq * t);
    data[i] = tone * env * 0.25;
  }
  return buffer;
};

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<Engine | null>(null);
  
  const [score, setScore] = useState(0);
  const [activeAchievements, setActiveAchievements] = useState<Achievement[]>([]);
  const [unlockedAchievements, setUnlockedAchievements] = useState<Achievement[]>([]);
  const [saveSlot, setSaveSlot] = useState<any>(null);
  
  const [zoomLevel, setZoomLevel] = useState(1.0);
  const [muted, setMuted] = useState(false);

  // Setup game engine instance
  useEffect(() => {
    if (!canvasRef.current) return;

    const engine = new Engine(canvasRef.current);
    engineRef.current = engine;

    // Synthesize and register coin sound effect
    engine.audio.init();
    const ctx = (engine.audio as any).context;
    if (ctx) {
      try {
        const soundBuffer = createCoinSoundBuffer(ctx);
        engine.audio.registerBuffer('pickup', soundBuffer);
      } catch (err) {
        console.error('Failed to register synthesized audio buffer:', err);
      }
    }

    const scene = new DemoGameScene();
    engine.start(scene);

    // Score changed event
    const unsubScore = engine.events.on('score-changed', (newScore: number) => {
      setScore(newScore);
    });

    // Achievement event
    const unsubAchievement = engine.events.on('achievement-unlocked', (achievement: Achievement) => {
      // Check if already unlocked
      if (unlockedAchievements.some((a) => a.id === achievement.id)) return;

      // Add to unlocked achievements list
      setUnlockedAchievements((prev) => [...prev, achievement]);

      // Trigger visual toast popup notification
      setActiveAchievements((prev) => [...prev, achievement]);
      setTimeout(() => {
        setActiveAchievements((prev) => prev.filter((a) => a.id !== achievement.id));
      }, 4000);
    });

    // Handle incoming save data response from engine
    const unsubSaveData = engine.events.on('game-save-data', (data: any) => {
      localStorage.setItem('beetle_save_slot_1', JSON.stringify(data));
      setSaveSlot(data);
      alert('Game Saved Successfully to Slot 1!');
    });

    // Check if slot has existing data
    const existingSave = localStorage.getItem('beetle_save_slot_1');
    if (existingSave) {
      setSaveSlot(JSON.parse(existingSave));
    }

    return () => {
      unsubScore();
      unsubAchievement();
      unsubSaveData();
      engine.stop();
    };
  }, []);

  // Save game request to engine
  const handleSave = () => {
    if (!engineRef.current) return;
    engineRef.current.events.emit('request-save-data');
  };

  // Load game data to engine
  const handleLoad = () => {
    if (!engineRef.current || !saveSlot) return;
    engineRef.current.events.emit('load-game', saveSlot);
    setScore(saveSlot.score);
    alert('Game Loaded!');
  };

  // Reset/Clear save slot
  const handleResetSave = () => {
    localStorage.removeItem('beetle_save_slot_1');
    setSaveSlot(null);
    alert('Save data reset!');
  };

  const handleZoom = (amount: number, reset = false) => {
    if (!engineRef.current) return;
    const nextZoom = reset ? 1.0 : Math.max(0.5, Math.min(2.0, engineRef.current.camera.zoom + amount));
    engineRef.current.camera.zoom = nextZoom;
    setZoomLevel(nextZoom);
  };

  const handleShake = () => {
    if (!engineRef.current) return;
    engineRef.current.camera.shake(12, 0.4);
  };

  const toggleMute = () => {
    if (!engineRef.current) return;
    if (muted) {
      engineRef.current.audio.unmute();
      setMuted(false);
    } else {
      engineRef.current.audio.mute();
      setMuted(true);
    }
  };

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      {/* Game Canvas Container */}
      <div className="game-container">
        <canvas ref={canvasRef} width={800} height={600} />
      </div>

      {/* React UI Overlay */}
      <div className="ui-overlay">
        {/* Top Header stats */}
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
          <div className="glass-panel interactive" style={{ padding: '12px 20px', display: 'flex', gap: '16px', alignItems: 'center' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '18px', color: '#a855f7' }}>Beetle.js</h2>
              <div style={{ fontSize: '14px', opacity: 0.8 }}>Engine Overlay Panel</div>
            </div>
            <button 
              className="btn-secondary" 
              style={{ padding: '6px 12px', fontSize: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }} 
              onClick={toggleMute}
            >
              {muted ? '🔈 Muted' : '🔊 Mute'}
            </button>
          </div>

          <div className="glass-panel interactive" style={{ padding: '12px 20px', display: 'flex', gap: '24px', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '12px', color: '#94a3b8', display: 'block', textTransform: 'uppercase' }}>Coins</span>
              <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#eab308' }}>{score}</span>
            </div>
            <div>
              <span style={{ fontSize: '12px', color: '#94a3b8', display: 'block', textTransform: 'uppercase' }}>Achievements</span>
              <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#22c55e' }}>{unlockedAchievements.length} / 2</span>
            </div>
          </div>
        </div>

        {/* Center UI or Side Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', width: '100%', gap: '16px' }}>
          
          <div style={{ display: 'flex', gap: '16px' }}>
            {/* Save/Load and Controls Panel */}
            <div className="glass-panel interactive" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', width: '260px' }}>
              <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: 'bold' }}>Save System</h3>
              
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn-primary" style={{ flex: 1 }} onClick={handleSave}>
                  Save Game
                </button>
                <button 
                  className="btn-secondary" 
                  style={{ flex: 1 }} 
                  onClick={handleLoad} 
                  disabled={!saveSlot}
                >
                  Load Game
                </button>
              </div>

              {saveSlot ? (
                <div style={{ fontSize: '12px', background: 'rgba(255,255,255,0.03)', padding: '8px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ color: '#94a3b8' }}>Slot 1 Save Info:</div>
                  <div>Coins: <span style={{ color: '#eab308', fontWeight: '600' }}>{saveSlot.score}</span></div>
                  <div>Player Pos: ({Math.round(saveSlot.playerPos.x)}, {Math.round(saveSlot.playerPos.y)})</div>
                  <button 
                    onClick={handleResetSave} 
                    style={{ background: 'none', border: 'none', color: '#ef4444', textDecoration: 'underline', padding: 0, marginTop: '6px', cursor: 'pointer', fontSize: '11px' }}
                  >
                    Clear Save Data
                  </button>
                </div>
              ) : (
                <div style={{ fontSize: '12px', color: '#64748b', fontStyle: 'italic' }}>No save slot found.</div>
              )}
            </div>

            {/* Camera Control Panel */}
            <div className="glass-panel interactive" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', width: '260px' }}>
              <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: 'bold', color: '#a855f7' }}>Camera Controls</h3>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button className="btn-secondary" style={{ flex: 1, padding: '8px 0' }} onClick={() => handleZoom(0.1)}>+</button>
                <button className="btn-secondary" style={{ flex: 1, padding: '8px 0' }} onClick={() => handleZoom(-0.1)}>-</button>
                <button className="btn-secondary" style={{ flex: 1, padding: '8px 0' }} onClick={() => handleZoom(0, true)}>Reset</button>
              </div>
              <div style={{ fontSize: '12px', color: '#94a3b8', display: 'flex', justifyContent: 'space-between' }}>
                <span>Zoom Level:</span>
                <span style={{ color: '#fff', fontWeight: 'bold' }}>{zoomLevel.toFixed(1)}x</span>
              </div>
              <button className="btn-secondary" style={{ width: '100%', padding: '8px 0' }} onClick={handleShake}>
                💥 Test Screen Shake
              </button>
            </div>
          </div>

          {/* Achievement List display */}
          <div className="glass-panel interactive" style={{ padding: '20px', width: '260px' }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: 'bold', color: '#a855f7' }}>Unlocked Trophies</h3>
            {unlockedAchievements.length === 0 ? (
              <div style={{ fontSize: '12px', color: '#64748b', fontStyle: 'italic' }}>No achievements unlocked yet. Collect a coin!</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {unlockedAchievements.map((ach) => (
                  <div key={ach.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(34, 197, 94, 0.05)', border: '1px solid rgba(34, 197, 94, 0.2)', padding: '6px 10px', borderRadius: '6px' }}>
                    <div style={{ fontSize: '16px' }}>🏆</div>
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 'bold' }}>{ach.title}</div>
                      <div style={{ fontSize: '10px', opacity: 0.7 }}>{ach.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Floating animated Achievement notifications */}
        <div style={{ position: 'fixed', bottom: '24px', right: '24px', display: 'flex', flexDirection: 'column', gap: '10px', pointerEvents: 'none' }}>
          {activeAchievements.map((ach) => (
            <div key={ach.id} className="achievement-popup interactive" style={{ display: 'flex', gap: '12px', padding: '16px', borderRadius: '12px', width: '320px', pointerEvents: 'auto' }}>
              <div style={{ fontSize: '32px', display: 'flex', alignItems: 'center' }}>🏆</div>
              <div>
                <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#eab308', fontWeight: 'bold', letterSpacing: '0.05em' }}>Achievement Unlocked!</div>
                <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#fff', margin: '2px 0' }}>{ach.title}</div>
                <div style={{ fontSize: '12px', color: '#94a3b8' }}>{ach.description}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
