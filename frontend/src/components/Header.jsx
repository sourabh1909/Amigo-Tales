import React from 'react';
import { Compass, Sparkles, BookOpen } from 'lucide-react';

export default function Header({ onReset }) {
  return (
    <header style={{ padding: '32px 0', borderBottom: '1px solid var(--border-subtle)', marginBottom: '40px' }}>
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div 
          onClick={onReset} 
          style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
        >
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            backgroundColor: 'var(--nordic-sage-light)',
            color: 'var(--nordic-sage)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'content',
            paddingLeft: '9px'
          }}>
            <Compass size={22} />
          </div>
          <div>
            <h1 className="font-serif" style={{ fontSize: '1.4rem', fontWeight: 600, letterSpacing: '0.04em', color: 'var(--text-primary)' }}>
              AMIGO TALES
            </h1>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Choose Your Own Adventure
            </p>
          </div>
        </div>

        <nav style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
          <button 
            onClick={onReset} 
            style={{ 
              background: 'none', 
              border: 'none', 
              fontSize: '0.9rem', 
              color: 'var(--text-secondary)', 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <BookOpen size={16} /> New Tale
          </button>
        </nav>
      </div>
    </header>
  );
}
