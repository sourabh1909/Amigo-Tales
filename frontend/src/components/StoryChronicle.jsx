import React, { useState } from 'react';
import { 
  BookOpen, 
  Languages, 
  RotateCcw, 
  Sparkles, 
  Copy, 
  Check, 
  ArrowLeft, 
  Trophy, 
  ShieldAlert, 
  Compass, 
  Bookmark,
  Share2,
  Sparkle
} from 'lucide-react';

const LANGUAGE_CONFIG = [
  { id: 'english', label: 'English', native: 'Original', code: 'GB' },
  { id: 'hindi', label: 'Hindi', native: 'हिंदी', code: 'IN' },
  { id: 'marathi', label: 'Marathi', native: 'मराठी', code: 'MR' },
];

export default function StoryChronicle({
  story,
  endingNode,
  translationData,
  currentLanguage,
  onSelectLanguage,
  isLoadingTranslation,
  onBack,
  onRestart,
  onNewStory
}) {
  const [copied, setCopied] = useState(false);

  const isWinning = endingNode?.is_winning_ending;
  const chapters = translationData?.chapters || [];
  const displayTitle = translationData?.translated_title || story?.title || 'Your Adventure';

  // Copy full story to clipboard
  const handleCopyStory = () => {
    if (!chapters || chapters.length === 0) return;

    let textToCopy = `📖 ${displayTitle}\n`;
    textToCopy += `Language: ${currentLanguage.toUpperCase()}\n`;
    textToCopy += `----------------------------------------\n\n`;

    chapters.forEach((ch) => {
      const isLast = ch.chapter_number === chapters.length;
      textToCopy += `[Chapter ${ch.chapter_number}${isLast ? ' - Finale' : ''}]\n`;
      textToCopy += `${currentLanguage === 'english' ? ch.original_passage : (ch.translated_passage || ch.original_passage)}\n\n`;
      
      const choice = currentLanguage === 'english' ? ch.choice_made : (ch.translated_choice || ch.choice_made);
      if (choice) {
        textToCopy += `→ Choice Made: ${choice}\n\n`;
      }
    });

    textToCopy += `\nResult: ${isWinning ? 'Triumphant Victory' : 'Journey Concluded'}\n`;
    textToCopy += `Created with Aurora Tales CYOA AI Engine`;

    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="nordic-card animate-fade-in" style={{ marginTop: '20px', padding: '36px 40px' }}>
      
      {/* Top Navigation Bar */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        flexWrap: 'wrap',
        gap: '12px',
        marginBottom: '28px',
        paddingBottom: '20px',
        borderBottom: '1px solid var(--nordic-border)'
      }}>
        <button 
          onClick={onBack}
          className="btn-nordic-secondary"
          style={{ padding: '8px 16px', fontSize: '0.86rem', borderRadius: 'var(--radius-pill)' }}
        >
          <ArrowLeft size={15} /> Back to Summary
        </button>

        {/* Copy / Share Button */}
        <button
          onClick={handleCopyStory}
          className="btn-nordic-secondary"
          style={{ 
            padding: '8px 18px', 
            fontSize: '0.86rem', 
            borderRadius: 'var(--radius-pill)',
            backgroundColor: copied ? 'var(--nordic-sage-light)' : 'var(--nordic-sand)',
            borderColor: copied ? 'var(--nordic-sage)' : 'var(--nordic-border)',
            color: copied ? 'var(--nordic-sage)' : 'var(--nordic-text-main)',
            transition: 'all 0.2s ease'
          }}
          disabled={isLoadingTranslation}
        >
          {copied ? (
            <>
              <Check size={15} color="var(--nordic-sage)" /> Story Copied!
            </>
          ) : (
            <>
              <Copy size={15} /> Copy Entire Story
            </>
          )}
        </button>
      </div>

      {/* Chronicle Header */}
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          backgroundColor: 'var(--nordic-sage-light)',
          color: 'var(--nordic-sage)',
          fontSize: '0.8rem',
          fontWeight: 700,
          padding: '6px 18px',
          borderRadius: 'var(--radius-pill)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          marginBottom: '14px'
        }}>
          <BookOpen size={15} />
          Complete Story Chronicle
        </div>

        <h1 style={{ 
          fontFamily: "'Lora', serif", 
          fontSize: '2.3rem', 
          fontWeight: 700, 
          color: 'var(--nordic-text-title)',
          lineHeight: '1.25',
          marginBottom: '10px'
        }}>
          {displayTitle}
        </h1>

        <p style={{ color: 'var(--nordic-text-subtle)', fontSize: '0.94rem' }}>
          {chapters.length} Chapters • {isWinning ? 'Victory Achieved' : 'Path Completed'}
        </p>
      </div>

      {/* Language Switcher Section */}
      <div style={{ 
        backgroundColor: 'var(--nordic-card-subtle)', 
        borderRadius: '16px', 
        padding: '16px 20px', 
        marginBottom: '36px',
        border: '1px solid var(--nordic-border)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--nordic-text-main)', fontSize: '0.9rem', fontWeight: 600 }}>
          <Languages size={17} color="var(--nordic-sage)" />
          <span>Translate & Read in Language:</span>
        </div>

        {/* Language Tabs */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '10px',
          justifyContent: 'center'
        }}>
          {LANGUAGE_CONFIG.map((lang) => {
            const isActive = currentLanguage === lang.id;
            return (
              <button
                key={lang.id}
                onClick={() => onSelectLanguage(lang.id)}
                disabled={isLoadingTranslation}
                className="chronicle-lang-btn"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 22px',
                  borderRadius: 'var(--radius-pill)',
                  fontFamily: 'var(--font-sans)',
                  fontSize: '0.92rem',
                  fontWeight: isActive ? 700 : 500,
                  cursor: isLoadingTranslation ? 'wait' : 'pointer',
                  border: isActive ? '2px solid var(--nordic-sage)' : '1px solid var(--nordic-border)',
                  backgroundColor: isActive ? '#FFFFFF' : 'var(--nordic-sand)',
                  color: isActive ? 'var(--nordic-sage)' : 'var(--nordic-text-main)',
                  boxShadow: isActive ? '0 4px 14px rgba(74, 107, 93, 0.15)' : 'none',
                  transform: isActive ? 'scale(1.03)' : 'scale(1)',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              >
                <span style={{ fontSize: '0.76rem', fontWeight: 800, opacity: 0.85 }}>{lang.code}</span>
                <span>{lang.label}</span>
                <span style={{
                  fontSize: '0.78rem',
                  padding: '2px 8px',
                  borderRadius: '10px',
                  backgroundColor: isActive ? 'var(--nordic-sage-light)' : 'rgba(0, 0, 0, 0.05)',
                  color: isActive ? 'var(--nordic-sage)' : 'var(--nordic-text-muted)',
                  fontWeight: 600
                }}>
                  {lang.native}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Translation In-Progress Skeleton / Loading Card */}
      {isLoadingTranslation && (
        <div className="animate-fade-in" style={{
          backgroundColor: 'var(--nordic-card-subtle)',
          border: '1.5px dashed var(--nordic-sage)',
          borderRadius: '16px',
          padding: '40px 24px',
          textAlign: 'center',
          marginBottom: '32px'
        }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            backgroundColor: 'var(--nordic-sage-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px auto',
          }}>
            <Languages size={28} color="var(--nordic-sage)" className="animate-spin-slow" />
          </div>
          <h3 style={{ fontFamily: "'Lora', serif", fontSize: '1.3rem', color: 'var(--nordic-text-title)', marginBottom: '8px' }}>
            Translating Adventure into {LANGUAGE_CONFIG.find(l => l.id === currentLanguage)?.label} ({LANGUAGE_CONFIG.find(l => l.id === currentLanguage)?.native})...
          </h3>
          <p style={{ color: 'var(--nordic-text-muted)', fontSize: '0.9rem' }}>
            Preserving literary tone, story pacing, and atmospheric choices in Devanagari script.
          </p>
        </div>
      )}

      {/* Chapters Timeline List */}
      {!isLoadingTranslation && chapters.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', marginBottom: '40px' }}>
          {chapters.map((ch, idx) => {
            const isLast = idx === chapters.length - 1;
            const passage = currentLanguage === 'english' 
              ? ch.original_passage 
              : (ch.translated_passage || ch.original_passage);
            const choice = currentLanguage === 'english' 
              ? ch.choice_made 
              : (ch.translated_choice || ch.choice_made);

            return (
              <div 
                key={idx}
                className="chronicle-chapter-card"
                style={{
                  position: 'relative',
                  backgroundColor: isLast 
                    ? (isWinning ? '#F4F8F5' : '#FEF2F2')
                    : 'var(--nordic-card-subtle)',
                  borderRadius: '18px',
                  padding: '28px 32px',
                  border: `1.5px solid ${isLast ? (isWinning ? '#CBE0D5' : '#FECACA') : 'var(--nordic-border)'}`,
                  boxShadow: '0 2px 10px rgba(0, 0, 0, 0.02)'
                }}
              >
                {/* Chapter Badge Header */}
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  marginBottom: '16px',
                  flexWrap: 'wrap',
                  gap: '8px'
                }}>
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    backgroundColor: isLast ? (isWinning ? 'var(--nordic-sage)' : '#DC2626') : 'var(--nordic-sage)',
                    color: '#FFFFFF',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    padding: '4px 14px',
                    borderRadius: 'var(--radius-pill)',
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase'
                  }}>
                    {isLast ? (
                      <>
                        <Trophy size={13} />
                        {currentLanguage === 'hindi' ? 'अंतिम अध्याय: निष्कर्ष' : (currentLanguage === 'marathi' ? 'शेवटचा अध्याय: समारोप' : 'Finale Chapter')}
                      </>
                    ) : (
                      <>
                        <Compass size={13} />
                        {currentLanguage === 'hindi' ? `अध्याय ${ch.chapter_number}` : (currentLanguage === 'marathi' ? `अध्याय ${ch.chapter_number}` : `Chapter ${ch.chapter_number}`)}
                      </>
                    )}
                  </div>

                  {isLast && (
                    <span style={{ 
                      fontSize: '0.85rem', 
                      fontWeight: 700,
                      color: isWinning ? 'var(--nordic-sage)' : '#B91C1C'
                    }}>
                      {isWinning 
                        ? (currentLanguage === 'hindi' ? '★ विजयी समापन' : (currentLanguage === 'marathi' ? '★ विजयी समारोप' : '★ Triumphant Ending'))
                        : (currentLanguage === 'hindi' ? 'वीरगति / यात्रा समाप्त' : (currentLanguage === 'marathi' ? 'प्रवास समाप्त' : 'Journey Ended'))
                      }
                    </span>
                  )}
                </div>

                {/* Narrative Passage */}
                <p style={{
                  fontFamily: "'Lora', Georgia, 'Nirmala UI', 'Mangal', serif",
                  fontSize: '1.1rem',
                  lineHeight: '1.9',
                  color: 'var(--nordic-text-main)',
                  marginBottom: choice ? '20px' : '0'
                }}>
                  {passage}
                </p>

                {/* Choice Taken Ribbon */}
                {choice && (
                  <div style={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid var(--nordic-border)',
                    borderLeft: '4px solid var(--nordic-sage)',
                    borderRadius: '12px',
                    padding: '12px 18px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    marginTop: '14px'
                  }}>
                    <span style={{
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      color: 'var(--nordic-sage)',
                      letterSpacing: '0.05em',
                      flexShrink: 0
                    }}>
                      {currentLanguage === 'hindi' ? 'लिया गया निर्णय' : (currentLanguage === 'marathi' ? 'घेतलेला निर्णय' : 'Your Choice')}:
                    </span>
                    <span style={{
                      fontStyle: 'italic',
                      fontSize: '0.98rem',
                      color: 'var(--nordic-text-title)',
                      fontWeight: 500
                    }}>
                      "{choice}"
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Footer Navigation Buttons */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        gap: '16px', 
        paddingTop: '24px',
        borderTop: '1px solid var(--nordic-border)',
        flexWrap: 'wrap'
      }}>
        <button className="btn-nordic-secondary" onClick={onRestart}>
          <RotateCcw size={17} /> Restart Story
        </button>
        <button className="btn-nordic-primary" onClick={onNewStory}>
          <Sparkles size={17} /> Create New Story
        </button>
      </div>

    </div>
  );
}
