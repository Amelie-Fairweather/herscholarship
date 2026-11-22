import { useMemo, useState } from 'react';
import {
  MOVES,
  ROUNDS,
  STATUS_META,
  prettyWhen,
  seedBoard,
  stageLabel,
} from '../lib/content';
import { uid } from '../lib/storage';
import { continueHash, isStarted, readyCount } from '../lib/validate';

const ROUND_IDS = ['round-1', 'round-2', 'round-3', 'decision'];

function matchesRound(file, roundId) {
  if (!roundId || roundId === 'all') return true;
  if (roundId === 'round-1') return file.status === 'submitted' || file.status === 'in_review';
  if (roundId === 'round-2') return file.status === 'round_2';
  if (roundId === 'round-3') return file.status === 'finalist';
  if (roundId === 'decision') return file.status === 'awarded' || file.status === 'not_advanced';
  return true;
}

export default function Status({ initialRound, application, setApplication, board, setBoard, go }) {
  const starting = ROUND_IDS.includes(initialRound) ? initialRound : 'all';
  const [roundFilter, setRoundFilter] = useState(starting);
  const [cycle, setCycle] = useState('all');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [note, setNote] = useState('');
  const [announce, setAnnounce] = useState({ title: '', body: '', round: 'Round 1' });
  const [announceError, setAnnounceError] = useState('');
  const [justPosted, setJustPosted] = useState('');

  const userFile = application.meta.submittedAt
    ? {
        id: application.meta.applicationId,
        name: application.meta.sample ? 'Marisol A. (sample)' : 'Your file',
        place: [application.need.city, application.need.region].filter(Boolean).join(', ') || 'Place not added',
        cycle: 'current',
        status: application.meta.status,
        you: true,
        history: application.meta.history || [],
      }
    : null;

  const files = useMemo(() => {
    const samples = board.files.filter((file) => file.id !== userFile?.id);
    return userFile ? [userFile, ...samples] : samples;
  }, [board.files, userFile]);

  const shown = files.filter((file) => {
    if (cycle === 'current' && file.cycle !== 'current') return false;
    if (cycle === 'last' && file.cycle !== 'last') return false;
    if (!matchesRound(file, roundFilter)) return false;
    const haystack = `${file.name} ${file.id} ${file.place}`.toLowerCase();
    if (query && !haystack.includes(query.trim().toLowerCase())) return false;
    return true;
  });

  const selected = files.find((file) => file.id === selectedId) || files.find((file) => file.you) || shown[0] || null;
  const moves = selected ? MOVES[selected.status] || [] : [];
  const feed = [...board.announcements].sort((a, b) => new Date(b.at) - new Date(a.at));
  const started = isStarted(application);

  function postMove(file, move) {
    const at = new Date().toISOString();
    const entry = {
      at,
      status: move.status,
      round: move.round,
      note: note.trim() || move.note,
    };
    const announcement = {
      id: uid(),
      at,
      round: move.round,
      title: `${file.name} · ${STATUS_META[move.status].label}`,
      body: entry.note,
    };
    if (file.you) {
      setApplication((current) => ({
        ...current,
        meta: {
          ...current.meta,
          status: move.status,
          history: [...(current.meta.history || []), entry],
        },
      }));
      setBoard((current) => ({
        ...current,
        announcements: [announcement, ...current.announcements],
      }));
    } else {
      setBoard((current) => ({
        ...current,
        files: current.files.map((item) =>
          item.id === file.id ? { ...item, status: move.status, history: [...item.history, entry] } : item,
        ),
        announcements: [announcement, ...current.announcements],
      }));
    }
    setNote('');
    setJustPosted(file.id);
  }

  function postAnnouncement(event) {
    event.preventDefault();
    if (!announce.title.trim() || !announce.body.trim()) {
      setAnnounceError('Add a headline and a note. Both show on the page.');
      return;
    }
    const at = new Date().toISOString();
    setBoard((current) => ({
      ...current,
      announcements: [
        {
          id: uid(),
          at,
          round: announce.round,
          title: announce.title.trim(),
          body: announce.body.trim(),
        },
        ...current.announcements,
      ],
    }));
    setAnnounce({ title: '', body: '', round: announce.round });
    setAnnounceError('');
  }

  return (
    <div className="page">
      <header className="wrap page-head">
        <p className="eyebrow">Posted in public</p>
        <h1>Rounds and status.</h1>
        <p className="lede">
          Applicants check this page. When a file moves, the status is posted here, with a note. The desk on the right
          is open in this demo so you can post one yourself. Staff accounts come later.
        </p>
      </header>

      <ol className="wrap timeline">
        {ROUNDS.map((round) => {
          const active = roundFilter === round.id;
          return (
            <li key={round.id}>
              <button
                type="button"
                className={`time-item ${round.id === 'round-1' ? 'is-open' : ''} ${active ? 'is-picked' : ''}`}
                onClick={() => setRoundFilter(active ? 'all' : round.id)}
                aria-pressed={active}
              >
                <small>{round.state}</small>
                <strong>{round.kicker}</strong>
                <span>{round.title}</span>
                <em>{round.dates}</em>
              </button>
            </li>
          );
        })}
      </ol>

      {!application.meta.submittedAt && (
        <aside className="wrap draft-banner">
          <div>
            <strong>{started ? 'Your draft is not on the board yet.' : 'Your file is not on the board yet.'}</strong>
            <p>
              {started
                ? `${readyCount(application)} of 6 sections are ready. Submit the file and it appears in Round 1.`
                : 'Start an application, or load the sample, and the file shows up here after you submit.'}
            </p>
          </div>
          <button type="button" className="btn btn-primary" onClick={() => go(continueHash(application))}>
            {started ? 'Continue the file' : 'Start application'}
          </button>
        </aside>
      )}

      <div className="wrap status-layout">
        <section className="board">
          <div className="board-tools">
            <label className="search">
              <span className="sr-only">Find a file</span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Find a name or file number"
              />
            </label>
            <div className="filters" role="group" aria-label="Which cycle">
              {[
                ['all', 'All files'],
                ['current', 'This cycle'],
                ['last', 'Last cycle'],
              ].map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  className={cycle === id ? 'is-picked' : ''}
                  aria-pressed={cycle === id}
                  onClick={() => setCycle(id)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {shown.length === 0 ? (
            <p className="empty-board">No files match this filter. Clear the search, or choose another round.</p>
          ) : (
            <ul className="file-list">
              {shown.map((file) => {
                const meta = STATUS_META[file.status] || STATUS_META.draft;
                const last = file.history[file.history.length - 1];
                const stage = last?.round || stageLabel(file.status);
                const picked = selected?.id === file.id;
                return (
                  <li key={file.id}>
                    <button
                      type="button"
                      className={`file-card ${picked ? 'is-selected' : ''} ${justPosted === file.id ? 'just-posted' : ''}`}
                      onClick={() => setSelectedId(file.id)}
                      aria-pressed={picked}
                    >
                      <span className="file-id">
                        {file.you ? 'You' : file.cycle === 'last' ? 'Last cycle' : 'This cycle'} · {file.id}
                      </span>
                      <strong>{file.name}</strong>
                      <span className="file-place">{file.place}</span>
                      <span className="file-meta">
                        <span className={`pill tone-${meta.tone}`}>{meta.label}</span>
                        <span>{stage}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          <div className="feed">
            <h2>Posted to the page</h2>
            {feed.map((item) => (
              <article key={item.id} className="feed-card">
                <p>
                  <span className="pill tone-rose">{item.round}</span>
                  <time dateTime={item.at}>{prettyWhen(item.at, true)}</time>
                </p>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </article>
            ))}
          </div>
        </section>

        <aside className="desk">
          <p className="eyebrow">Demo desk</p>
          <h2>{selected ? selected.name : 'Choose a file'}</h2>
          {selected ? (
            <>
              <p className="desk-id">
                {selected.id} · {selected.place}
              </p>
              <ol className="history">
                {selected.history.map((entry, index) => {
                  const meta = STATUS_META[entry.status] || STATUS_META.draft;
                  return (
                    <li key={`${entry.at}-${index}`}>
                      <span className={`pill tone-${meta.tone}`}>{meta.label}</span>
                      <time dateTime={entry.at}>{prettyWhen(entry.at, true)}</time>
                      <p>{entry.note}</p>
                    </li>
                  );
                })}
              </ol>
              {moves.length > 0 ? (
                <div className="post-box">
                  <label htmlFor="status-note">Note applicants will see</label>
                  <textarea
                    id="status-note"
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    placeholder={moves[0].note}
                    rows={3}
                  />
                  <div className="post-actions">
                    {moves.map((move) => (
                      <button
                        key={move.status}
                        type="button"
                        className={move.status === 'not_advanced' ? 'btn btn-ghost' : 'btn btn-primary'}
                        onClick={() => postMove(selected, move)}
                      >
                        {move.label}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="hint">This file has a final status. The path above is the public record.</p>
              )}
            </>
          ) : (
            <p>Choose a file on the left to post its next status.</p>
          )}

          <form className="composer" onSubmit={postAnnouncement}>
            <h3>Post a general note</h3>
            <label htmlFor="announce-title">Headline</label>
            <input
              id="announce-title"
              value={announce.title}
              onChange={(event) => setAnnounce((current) => ({ ...current, title: event.target.value }))}
            />
            <label htmlFor="announce-body">Note</label>
            <textarea
              id="announce-body"
              rows={3}
              value={announce.body}
              onChange={(event) => setAnnounce((current) => ({ ...current, body: event.target.value }))}
            />
            <label htmlFor="announce-round">Round</label>
            <select
              id="announce-round"
              value={announce.round}
              onChange={(event) => setAnnounce((current) => ({ ...current, round: event.target.value }))}
            >
              {ROUNDS.map((round) => (
                <option key={round.id}>{round.kicker}</option>
              ))}
            </select>
            {announceError ? <p className="field-error">{announceError}</p> : null}
            <button type="submit" className="btn btn-ghost">
              Post to the page
            </button>
          </form>

          <button type="button" className="btn-text" onClick={() => setBoard(seedBoard())}>
            Reset the practice board
          </button>
        </aside>
      </div>
    </div>
  );
}
