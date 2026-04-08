import { useEffect, useMemo, useState } from 'react';
import { collection, doc, increment, limit, onSnapshot, orderBy, query, updateDoc } from 'firebase/firestore';
import { Flame, MapPin, ThumbsUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../services/firebase';
import { hasUpvoted, markUpvoted } from '../../utils/upvote';

function normalizeIssue(issueDoc) {
  return {
    id: issueDoc.id,
    ...issueDoc.data(),
  };
}

function resolveIssueImage(issue) {
  return issue.beforeImageUrl || issue.beforeImage || issue.photo_url || '';
}

function resolveLocationName(issue) {
  return issue.locationName || issue.location?.address || issue.locationLabel || issue.neighbourhood || 'Location unavailable';
}

export default function Feed() {
  const navigate = useNavigate();
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [upvotingIds, setUpvotingIds] = useState({});

  useEffect(() => {
    const feedQuery = query(
      collection(db, 'issues'),
      orderBy('upvotesCount', 'desc'),
      limit(20)
    );

    const unsubscribe = onSnapshot(
      feedQuery,
      (snapshot) => {
        setIssues(snapshot.docs.map(normalizeIssue));
        setLoading(false);
        setError('');
      },
      (feedError) => {
        console.error('Feed listener failed:', feedError);
        setError(feedError.message || 'Unable to load community feed.');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const votedIds = useMemo(
    () => new Set(issues.filter((issue) => hasUpvoted(issue.id)).map((issue) => issue.id)),
    [issues]
  );

  const handleUpvote = async (issueId) => {
    if (!issueId || hasUpvoted(issueId) || upvotingIds[issueId]) {
      return;
    }

    setUpvotingIds((current) => ({ ...current, [issueId]: true }));

    try {
      await updateDoc(doc(db, 'issues', issueId), {
        upvotesCount: increment(1),
        upvotes: increment(1),
      });
      markUpvoted(issueId);
    } catch (upvoteError) {
      console.error('Feed upvote failed:', upvoteError);
      setError(upvoteError.message || 'Unable to upvote right now.');
    } finally {
      setUpvotingIds((current) => ({ ...current, [issueId]: false }));
    }
  };

  return (
    <div className="flex-col pb-6">
      <div className="mt-6 mb-6">
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.45rem',
            backgroundColor: '#FFF7ED',
            color: '#C2410C',
            borderRadius: '999px',
            padding: '0.45rem 0.8rem',
            fontSize: '0.78rem',
            fontWeight: 700,
            marginBottom: '1rem',
          }}
        >
          <Flame size={14} />
          Trending civic priorities
        </div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#1F2937', marginBottom: '0.35rem' }}>
          Fire Feed
        </h1>
        <p style={{ color: '#6B7280', fontSize: '0.95rem', lineHeight: 1.5 }}>
          Most upvoted issues rise to the top so the community can spotlight what matters most.
        </p>
      </div>

      {error && (
        <div style={{ backgroundColor: '#FEF2F2', color: '#991B1B', padding: '1rem', borderRadius: '16px', marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      {loading && (
        <div style={{ backgroundColor: 'white', padding: '1.25rem', borderRadius: '18px', color: '#6B7280', textAlign: 'center' }}>
          Loading trending issues...
        </div>
      )}

      {!loading && issues.length === 0 && (
        <div style={{ backgroundColor: 'white', padding: '1.25rem', borderRadius: '18px', color: '#6B7280', textAlign: 'center' }}>
          No issues available in the feed yet.
        </div>
      )}

      <div className="flex-col gap-5" style={{ scrollBehavior: 'smooth' }}>
        {issues.map((issue, index) => {
          const imageUrl = resolveIssueImage(issue);
          const voted = votedIds.has(issue.id);
          const upvotesCount = Number(issue.upvotesCount ?? issue.upvotes ?? 0);

          return (
            <article
              key={issue.id}
              onClick={() => navigate(`/feed/${issue.id}`)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  navigate(`/feed/${issue.id}`);
                }
              }}
              role="button"
              tabIndex={0}
              style={{
                backgroundColor: 'white',
                borderRadius: '24px',
                overflow: 'hidden',
                boxShadow: index === 0 ? '0 16px 40px rgba(124, 143, 240, 0.18)' : '0 10px 24px rgba(15, 23, 42, 0.08)',
                border: index === 0 ? '1px solid #C7D2FE' : '1px solid #E5E7EB',
                cursor: 'pointer',
              }}
            >
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={issue.title || issue.category || 'Community issue'}
                  style={{ width: '100%', height: '240px', objectFit: 'cover', display: 'block' }}
                />
              ) : (
                <div style={{ height: '240px', background: 'linear-gradient(135deg, #E0EAFF 0%, #F8FAFC 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B', fontWeight: 700 }}>
                  No image available
                </div>
              )}

              <div style={{ padding: '1rem 1rem 1.15rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <div>
                    <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#111827', marginBottom: '0.3rem' }}>
                      {issue.title || issue.category || 'Community issue'}
                    </h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#6B7280', fontSize: '0.82rem' }}>
                      <MapPin size={14} />
                      <span>{resolveLocationName(issue)}</span>
                    </div>
                  </div>
                  {index === 0 && (
                    <span style={{ backgroundColor: '#EEF2FF', color: '#4F46E5', padding: '0.4rem 0.6rem', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 700 }}>
                      Top issue
                    </span>
                  )}
                </div>

                <p style={{ fontSize: '0.9rem', color: '#4B5563', lineHeight: 1.55, marginBottom: '1rem' }}>
                  {issue.description || 'No description provided.'}
                </p>

                <button
                  type="button"
                  disabled={voted || upvotingIds[issue.id]}
                  onClick={(event) => {
                    event.stopPropagation();
                    handleUpvote(issue.id);
                  }}
                  style={{
                    width: '100%',
                    border: 'none',
                    borderRadius: '16px',
                    padding: '0.9rem 1rem',
                    backgroundColor: voted ? '#DCFCE7' : '#EEF2FF',
                    color: voted ? '#166534' : '#4338CA',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.45rem',
                    cursor: voted ? 'not-allowed' : 'pointer',
                    opacity: upvotingIds[issue.id] ? 0.7 : 1,
                  }}
                >
                  <ThumbsUp size={16} />
                  {voted ? 'Voted ✅' : `🔼 ${upvotesCount}`}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
