import React, { useState } from 'react';
import { 
  RotateCcw, 
  Sparkles, 
  Trophy, 
  ShieldAlert, 
  Star, 
  Languages, 
  BookOpen, 
  Check, 
  Copy 
} from 'lucide-react';

const LANGUAGES = [
  { id: 'english', label: 'English', native: 'Original', code: 'GB' },
  { id: 'hindi', label: 'Hindi', native: 'हिंदी', code: 'IN' },
  { id: 'marathi', label: 'Marathi', native: 'मराठी', code: 'MR' },
];

export default function EndingCard({ 
  currentNode, 
  story, 
  storyTitle, 
  onRestart, 
  onNewStory,
  apiBase = 'http://localhost:8000/api'
}) {
  const isWinning = currentNode?.is_winning_ending;

  const [activeLanguage, setActiveLanguage] = useState('english');
  const [translations, setTranslations] = useState({}); // { hindi: { title, summary }, marathi: { title, summary } }
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  // Handle language selection & summary translation
  const handleSelectLanguage = async (targetLang) => {
    setActiveLanguage(targetLang);
    setError(null);

    if (targetLang === 'english' || translations[targetLang]) {
      return;
    }

    setIsLoading(true);
    try {
      const storyId = story?.id;
      if (!storyId) {
        throw new Error('Story ID missing.');
      }

      const res = await fetch(`${apiBase}/stories/${storyId}/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language: targetLang,
          ending_node_id: currentNode?.id || 0
        })
      });

      if (!res.ok) {
        throw new Error(`Translation failed: ${res.statusText}`);
      }

      const data = await res.json();
      setTranslations((prev) => ({
        ...prev,
        [targetLang]: data
      }));
    } catch (err) {
      console.error('Summary translation error:', err);
      setError('Could not translate summary. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Determine active title & summary text to display
  const activeData = translations[activeLanguage];
  const displayTitle = (activeLanguage !== 'english' && activeData?.translated_title) 
    ? activeData.translated_title 
    : (storyTitle || story?.title);

  const displaySummary = (activeLanguage !== 'english' && activeData?.summary)
    ? activeData.summary
    : (currentNode?.content || story?.description);

  // Copy Summary to Clipboard
  const handleCopySummary = () => {
    if (!displaySummary) return;
    const textToCopy = `📖 ${displayTitle}\n\n${displaySummary}\n\nResult: ${isWinning ? 'Triumphant Victory' : 'Journey Concluded'}\nAmigo Tales CYOA`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="nordic-card animate-fade-in" style={{ textAlign: 'center', marginTop: '20px', overflow: 'hidden', position: 'relative' }}>
      {/* Decorative background gradient */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '220px',
        background: isWinning 
          ? 'linear-gradient(180deg, rgba(74, 107, 93, 0.09) 0%, transparent 100%)'
          : 'linear-gradient(180deg, rgba(185, 28, 28, 0.06) 0%, transparent 100%)',
        pointerEvents: 'none',
      }} />

      <div style={{ position: 'relative' }}>
        {/* Trophy / Shield Icon */}
        <div style={{
          width: '72px',
          height: '72px',
          borderRadius: '50%',
          backgroundColor: isWinning ? 'var(--nordic-sage-light)' : '#FEE2E2',
          color: isWinning ? 'var(--nordic-sage)' : '#B91C1C',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px auto',
        }}>
          {isWinning ? <Trophy size={34} /> : <ShieldAlert size={34} />}
        </div>

        {/* Story Title */}
        <h2 style={{ 
          fontFamily: "'Lora', Georgia, 'Nirmala UI', serif", 
          fontSize: '2.2rem', 
          fontWeight: 600, 
          color: 'var(--nordic-text-title)', 
          marginBottom: '12px',
          transition: 'all 0.3s ease'
        }}>
          {displayTitle}
        </h2>

        {/* Conclusion Badge */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          backgroundColor: isWinning ? 'var(--nordic-sage-light)' : '#FEE2E2',
          color: isWinning ? 'var(--nordic-sage)' : '#B91C1C',
          fontWeight: 700,
          padding: '8px 22px',
          borderRadius: 'var(--radius-pill)',
          marginBottom: '28px',
          fontSize: '0.92rem',
        }}>
          {isWinning ? <Star size={16} /> : <ShieldAlert size={16} />}
          {isWinning 
            ? (activeLanguage === 'hindi' ? 'विजयी समापन!' : (activeLanguage === 'marathi' ? 'विजयी समारोप!' : 'Triumphant Conclusion!'))
            : (activeLanguage === 'hindi' ? 'यात्रा समाप्त' : (activeLanguage === 'marathi' ? 'प्रवास समाप्त' : 'Journey Ended'))
          }
        </div>

        {/* LANGUAGE SWITCHER BAR */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px',
          flexWrap: 'wrap',
          marginBottom: '20px',
          padding: '8px 12px',
          backgroundColor: 'var(--nordic-card-subtle)',
          borderRadius: 'var(--radius-pill)',
          border: '1px solid var(--nordic-border)',
          maxWidth: '480px',
          margin: '0 auto 24px auto'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: 600, color: 'var(--nordic-text-muted)', paddingLeft: '8px' }}>
            <Languages size={15} color="var(--nordic-sage)" />
            <span>Summary:</span>
          </div>

          {LANGUAGES.map((lang) => {
            const isActive = activeLanguage === lang.id;
            return (
              <button
                key={lang.id}
                onClick={() => handleSelectLanguage(lang.id)}
                disabled={isLoading}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-pill)',
                  border: isActive ? '1.5px solid var(--nordic-sage)' : '1px solid transparent',
                  backgroundColor: isActive ? '#FFFFFF' : 'transparent',
                  color: isActive ? 'var(--nordic-sage)' : 'var(--nordic-text-main)',
                  fontWeight: isActive ? 700 : 500,
                  fontSize: '0.85rem',
                  cursor: isLoading ? 'wait' : 'pointer',
                  boxShadow: isActive ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
                  transition: 'all 0.2s ease',
                }}
              >
                <span style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                  opacity: 0.85
                }}>
                  {lang.code}
                </span>
                <span>{lang.native}</span>
              </button>
            );
          })}
        </div>

        {/* Error message if translation fails */}
        {error && (
          <p style={{ color: '#DC2626', fontSize: '0.86rem', marginBottom: '16px' }}>{error}</p>
        )}

        {/* SUMMARY CARD */}
        <div style={{
          backgroundColor: 'var(--nordic-card-subtle)',
          borderRadius: '18px',
          padding: '30px 34px',
          marginBottom: '32px',
          borderLeft: `4px solid ${isWinning ? 'var(--nordic-sage)' : '#EF4444'}`,
          textAlign: 'left',
          position: 'relative',
          minHeight: '120px'
        }}>
          {isLoading ? (
            <div className="animate-fade-in" style={{ textAlign: 'center', padding: '24px 0' }}>
              <Languages size={24} color="var(--nordic-sage)" className="animate-spin-slow" style={{ margin: '0 auto 12px auto' }} />
              <p style={{ color: 'var(--nordic-text-muted)', fontSize: '0.94rem', fontWeight: 500 }}>
                Translating adventure summary into {LANGUAGES.find(l => l.id === activeLanguage)?.native}...
              </p>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <span style={{
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: 'var(--nordic-sage)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <BookOpen size={13} />
                  {activeLanguage === 'hindi' ? 'कहानी का सारांश' : (activeLanguage === 'marathi' ? 'कथेचा सारांश' : 'Adventure Summary')}
                </span>

                <button
                  onClick={handleCopySummary}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: copied ? 'var(--nordic-sage)' : 'var(--nordic-text-muted)',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '0.78rem',
                    fontWeight: 600
                  }}
                >
                  {copied ? <Check size={13} /> : <Copy size={13} />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>

              <p style={{ 
                fontFamily: "'Lora', Georgia, 'Nirmala UI', 'Mangal', serif", 
                fontSize: '1.1rem', 
                lineHeight: '1.9', 
                color: 'var(--nordic-text-main)',
                whiteSpace: 'pre-line'
              }}>
                {displaySummary}
              </p>
            </>
          )}
        </div>

        {/* Bottom Actions */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', paddingTop: '20px', borderTop: '1px solid var(--nordic-border)' }}>
          <button className="btn-nordic-secondary" onClick={onRestart}>
            <RotateCcw size={17} /> Restart Story
          </button>
          <button className="btn-nordic-primary" onClick={onNewStory}>
            <Sparkles size={17} /> New Story
          </button>
        </div>
      </div>
    </div>
  );
}
