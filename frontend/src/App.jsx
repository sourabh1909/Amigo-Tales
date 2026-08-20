import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import ThemeInput from './components/ThemeInput';
import LoadingState from './components/LoadingState';
import StoryCard from './components/StoryCard';
import EndingCard from './components/EndingCard';

const API_BASE = 'http://localhost:8000/api';

export default function App() {
  const [theme, setTheme] = useState('');
  const [jobId, setJobId] = useState(null);
  const [jobStatus, setJobStatus] = useState(null); // 'pending' | 'processing' | 'completed' | 'failed'
  
  const [story, setStory] = useState(null);
  const [currentNode, setCurrentNode] = useState(null);
  const [error, setError] = useState(null);
  const [pathDepth, setPathDepth] = useState(0);

  // Kick off story generation job with the chosen theme
  const handleCreateStory = async (selectedTheme) => {
    setTheme(selectedTheme);
    setError(null);
    setJobStatus('pending');

    try {
      const res = await fetch(`${API_BASE}/stories/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          theme: selectedTheme
        }),
      });

      if (!res.ok) {
        throw new Error(`Failed to create story: ${res.statusText}`);
      }

      const jobData = await res.json();
      setJobId(jobData.job_id);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to connect to story backend.');
      setJobStatus(null);
    }
  };

  // Poll job status until story generation finishes
  useEffect(() => {
    if (!jobId || jobStatus === 'completed' || jobStatus === 'failed') return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE}/jobs/${jobId}`);
        if (!res.ok) return;

        const job = await res.json();
        setJobStatus(job.status);

        if (job.status === 'completed' && job.story_id) {
          clearInterval(interval);
          fetchCompleteStory(job.story_id);
        } else if (job.status === 'failed') {
          clearInterval(interval);
          setError(job.error || 'Story generation failed.');
        }
      } catch (err) {
        console.error('Error polling job status:', err);
      }
    }, 1200);

    return () => clearInterval(interval);
  }, [jobId, jobStatus]);

  // Load the initial story graph once the background worker completes
  const fetchCompleteStory = async (storyId) => {
    try {
      const res = await fetch(`${API_BASE}/stories/${storyId}/complete`);
      if (!res.ok) throw new Error('Could not fetch completed story');

      const data = await res.json();
      setStory(data);
      setCurrentNode(data.root_node);
    } catch (err) {
      console.error(err);
      setError('Failed to load story details.');
    }
  };

  const [isNavigatingNode, setIsNavigatingNode] = useState(false);

  // Navigate to chosen option and expand branches on the fly
  const handleSelectOption = async (nodeId) => {
    if (!story || !nodeId) return;

    setIsNavigatingNode(true);
    try {
      const res = await fetch(`${API_BASE}/stories/${story.id}/nodes/${nodeId}`);
      if (!res.ok) throw new Error('Could not load next story node');

      const nextNode = await res.json();

      // Cache newly expanded nodes locally to avoid re-fetching
      setStory(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          all_nodes: {
            ...(prev.all_nodes || {}),
            [String(nextNode.id)]: nextNode
          }
        };
      });

      setCurrentNode(nextNode);
      setPathDepth(prev => prev + 1);
    } catch (err) {
      console.error(err);
      if (story.all_nodes && story.all_nodes[String(nodeId)]) {
        setCurrentNode(story.all_nodes[String(nodeId)]);
      }
    } finally {
      setIsNavigatingNode(false);
    }
  };

  // Reset back to chapter 1 of current story
  const handleRestartStory = () => {
    if (story && story.root_node) {
      setCurrentNode(story.root_node);
      setPathDepth(0);
    }
  };

  // Reset state to start a completely new story
  const handleReset = () => {
    setTheme('');
    setJobId(null);
    setJobStatus(null);
    setStory(null);
    setCurrentNode(null);
    setError(null);
    setIsNavigatingNode(false);
    setPathDepth(0);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header onReset={handleReset} />

      <main style={{ flex: 1, paddingBottom: '60px' }}>
        <div className="container">
          {error && (
            <div className="adventure-card" style={{ borderColor: '#FCA5A5', backgroundColor: '#FEF2F2', marginBottom: '24px' }}>
              <p style={{ color: '#991B1B', textAlign: 'center' }}>{error}</p>
              <div style={{ textAlign: 'center', marginTop: '12px' }}>
                <button className="btn-nordic-secondary" onClick={handleReset}>Try Again</button>
              </div>
            </div>
          )}

          {/* Creation View */}
          {!jobStatus && !story && (
            <ThemeInput onSubmit={handleCreateStory} isLoading={false} />
          )}

          {/* Loading / Polling View */}
          {((jobStatus === 'pending' || jobStatus === 'processing') && !story) || isNavigatingNode ? (
            <LoadingState status={isNavigatingNode ? 'processing' : jobStatus} theme={theme || story?.title} />
          ) : null}

          {/* Story Gameplay View */}
          {story && currentNode && !currentNode.is_ending && !isNavigatingNode && (
            <StoryCard 
              storyTitle={story.title} 
              currentNode={currentNode} 
              onSelectOption={handleSelectOption}
              onRestart={handleRestartStory}
              onNewStory={handleReset}
              pathDepth={pathDepth}
            />
          )}

          {/* Story Ending View */}
          {story && currentNode && currentNode.is_ending && !isNavigatingNode && (
            <EndingCard 
              story={story}
              storyTitle={story.title}
              currentNode={currentNode} 
              onRestart={handleRestartStory}
              onNewStory={handleReset}
              apiBase={API_BASE}
            />
          )}
        </div>
      </main>

      <footer style={{ borderTop: '1px solid var(--border-subtle)', padding: '24px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
        <div className="container">
          <p>@2026 • Sourabh • Nordic Design</p>
        </div>
      </footer>
    </div>
  );
}
