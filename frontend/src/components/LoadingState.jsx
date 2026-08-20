import React from 'react';
import { Compass, Feather } from 'lucide-react';

export default function LoadingState({ status, theme }) {
  return (
    <div className="nordic-card animate-fade-in" style={{ textAlign: 'center', padding: '60px 40px', maxWidth: '640px', margin: '40px auto' }}>
      <div style={{
        width: '64px',
        height: '64px',
        borderRadius: '50%',
        backgroundColor: 'var(--nordic-sage-light)',
        color: 'var(--nordic-sage)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 24px auto'
      }} className="animate-pulse-gentle">
        <Feather size={32} />
      </div>

      <h3 className="font-serif" style={{ fontSize: '1.5rem', marginBottom: '12px', color: 'var(--text-primary)' }}>
        Weaving Your Tale
      </h3>

      <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '0.98rem' }}>
        Crafting a bespoke adventure centered around <strong style={{ color: 'var(--nordic-sage)' }}>"{theme}"</strong>...
      </p>

      <div style={{
        height: '6px',
        backgroundColor: 'var(--bg-subtle)',
        borderRadius: 'var(--radius-full)',
        overflow: 'hidden',
        maxWidth: '300px',
        margin: '0 auto'
      }}>
        <div style={{
          height: '100%',
          width: status === 'processing' ? '70%' : '30%',
          backgroundColor: 'var(--nordic-sage)',
          borderRadius: 'var(--radius-full)',
          transition: 'width 0.6s ease'
        }} className="animate-pulse-gentle" />
      </div>

      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '16px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        Status: {status}...
      </p>
    </div>
  );
}
