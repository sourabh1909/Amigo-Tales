import React, { useState } from 'react';
import { RotateCcw, Sparkles, Compass, ChevronRight } from 'lucide-react';

const MAX_CHAPTERS = 6;

export default function StoryCard({ storyTitle, currentNode, onSelectOption, onRestart, onNewStory, pathDepth = 0 }) {
  const [hoveredIdx, setHoveredIdx] = useState(null);
  
  if (!currentNode) return null;

  const options = currentNode.options || [];
  const chapter = pathDepth + 1;
  const progress = Math.min((pathDepth / MAX_CHAPTERS) * 100, 100);

  return (
    <div className="nordic-card animate-fade-in" style={{ marginTop: '20px' }}>
      
      {/* Story Title */}
      <h2 style={{ 
        fontFamily: "'Lora', serif", 
        fontSize: '2.1rem', 
        fontWeight: 600, 
        color: 'var(--nordic-text-title)', 
        marginBottom: '16px',
        textAlign: 'center'
      }}>
        {storyTitle}
      </h2>

      {/* Chapter Badge + Progress Bar */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '12px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: 'var(--nordic-sage-light)',
            color: 'var(--nordic-sage)',
            fontSize: '0.78rem',
            fontWeight: 700,
            padding: '5px 16px',
            borderRadius: 'var(--radius-pill)',
            letterSpacing: '0.06em',
            textTransform: 'uppercase'
          }}>
            <Compass size={13} />
            Chapter {chapter}
          </div>
          <span style={{ fontSize: '0.78rem', color: 'var(--nordic-text-muted)', fontWeight: 500 }}>
            {pathDepth} of {MAX_CHAPTERS} decisions made
          </span>
        </div>
        
        {/* Progress bar */}
        <div style={{
          height: '5px',
          backgroundColor: 'var(--nordic-sand)',
          borderRadius: 'var(--radius-pill)',
          overflow: 'hidden',
          maxWidth: '360px',
          margin: '0 auto'
        }}>
          <div style={{
            height: '100%',
            width: `${progress}%`,
            backgroundColor: 'var(--nordic-sage)',
            borderRadius: 'var(--radius-pill)',
            transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
          }} />
        </div>
      </div>

      {/* Main Narrative Passage */}
      <div style={{
        backgroundColor: 'var(--nordic-card-subtle)',
        borderRadius: '16px',
        padding: '28px 32px',
        marginBottom: '36px',
        borderLeft: '4px solid var(--nordic-sage)',
      }}>
        <p style={{ 
          fontFamily: "'Lora', serif",
          fontSize: '1.12rem', 
          lineHeight: '1.9', 
          color: 'var(--nordic-text-main)',
        }}>
          {currentNode.content}
        </p>
      </div>

      {/* Two Choices */}
      {options.length > 0 && (
        <div style={{ marginBottom: '36px' }}>
          <h3 style={{ 
            fontSize: '1.1rem', 
            fontWeight: 700, 
            color: 'var(--nordic-sage)',
            marginBottom: '18px',
            textAlign: 'center',
          }}>
            What will you do?
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {options.map((option, idx) => {
              const isHovered = hoveredIdx === idx;
              const optionLabel = idx === 0 ? 'A' : 'B';
              const accentColor = idx === 0 ? '#4A6B5D' : '#6366F1';
              const accentBg = idx === 0 ? '#EBF1ED' : '#EEF2FF';
              
              return (
                <button
                  key={idx}
                  className="nordic-option-card-v2"
                  onClick={() => onSelectOption(option.node_id)}
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  style={{
                    animationDelay: `${idx * 0.1}s`,
                    borderColor: isHovered ? accentColor : 'var(--nordic-border)',
                    backgroundColor: isHovered ? accentBg : 'var(--nordic-card)',
                    transform: isHovered ? 'translateY(-3px)' : 'translateY(0)',
                    boxShadow: isHovered 
                      ? `0 10px 28px -6px ${accentColor}20, 0 4px 14px -3px ${accentColor}10`
                      : 'var(--shadow-nordic)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    {/* Letter Badge */}
                    <div style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '12px',
                      backgroundColor: isHovered ? accentColor : accentBg,
                      color: isHovered ? '#fff' : accentColor,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      transition: 'all 0.25s ease',
                      fontSize: '1.1rem',
                      fontWeight: 800,
                      fontFamily: "'Lora', serif",
                    }}>
                      {optionLabel}
                    </div>
                    
                    {/* Choice Text */}
                    <span style={{
                      flex: 1,
                      fontSize: '1.02rem',
                      fontWeight: 500,
                      color: isHovered ? 'var(--nordic-text-title)' : 'var(--nordic-text-main)',
                      lineHeight: 1.5,
                      textAlign: 'left',
                      transition: 'color 0.2s ease',
                    }}>
                      {option.text}
                    </span>

                    {/* Arrow indicator */}
                    <ChevronRight 
                      size={20} 
                      style={{
                        flexShrink: 0,
                        color: isHovered ? accentColor : 'var(--nordic-text-muted)',
                        transition: 'all 0.2s ease',
                        transform: isHovered ? 'translateX(3px)' : 'translateX(0)',
                        opacity: isHovered ? 1 : 0.4,
                      }}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Bottom Action Footer */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        gap: '16px', 
        paddingTop: '24px',
        borderTop: '1px solid var(--nordic-border)' 
      }}>
        <button className="btn-nordic-secondary" onClick={onRestart}>
          <RotateCcw size={17} /> Restart Story
        </button>
        <button className="btn-nordic-primary" onClick={onNewStory}>
          <Sparkles size={17} /> New Story
        </button>
      </div>
    </div>
  );
}
