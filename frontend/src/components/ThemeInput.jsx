import React, { useState } from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';

const PRESET_THEMES = [
  "Pirate Quest",
  "Nordic Folklore",
  "Cyberpunk Detective",
  "Deep Space Odyssey",
  "Medieval Kingdom"
];

export default function ThemeInput({ onSubmit, isLoading }) {
  const [theme, setTheme] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (theme.trim() && !isLoading) {
      onSubmit(theme.trim());
    }
  };

  const handleChipClick = (preset) => {
    setTheme(preset);
    if (!isLoading) {
      onSubmit(preset);
    }
  };

  return (
    <div className="nordic-card animate-fade-in" style={{ textAlign: 'center', marginTop: '20px' }}>
      <h2 style={{ 
        fontFamily: "'Lora', serif", 
        fontSize: '2.1rem', 
        fontWeight: 600, 
        color: 'var(--nordic-text-title)', 
        marginBottom: '8px' 
      }}>
        Generate Your Adventure
      </h2>
      <p style={{ color: 'var(--nordic-text-subtle)', fontSize: '1.02rem', marginBottom: '32px' }}>
        Enter a theme for your interactive story
      </p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '560px', margin: '0 auto' }}>
        <input
          type="text"
          className="nordic-input"
          placeholder="Enter a theme (e.g., pirates, space, medieval)..."
          value={theme}
          onChange={(e) => setTheme(e.target.value)}
          disabled={isLoading}
        />

        <div style={{ marginTop: '8px' }}>
          <button 
            type="submit" 
            className="btn-nordic-primary"
            disabled={!theme.trim() || isLoading}
          >
            {isLoading ? 'Weaving Story...' : <>Generate Story <ArrowRight size={18} /></>}
          </button>
        </div>

        {/* Suggestion Chips */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center', marginTop: '16px' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--nordic-text-muted)', alignSelf: 'center' }}>
            Suggestions:
          </span>
          {PRESET_THEMES.map((preset) => (
            <button
              key={preset}
              type="button"
              className="nordic-chip"
              onClick={() => handleChipClick(preset)}
              disabled={isLoading}
            >
              {preset}
            </button>
          ))}
        </div>
      </form>
    </div>
  );
}
