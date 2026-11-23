import { useEffect, useMemo, useState } from 'react';
import {
  ACTIVITIES,
  MAKE_KINDS,
  MOVES,
  STATUS_META,
  activityItems,
  activityLabel,
  formatBytes,
  gpaScaleLabel,
  linkLabel,
  prettyWhen,
  reportedGpaScale,
  stageLabel,
} from '../lib/content';
import { supabase } from '../lib/supabase';
import { applicationRegion, compareReadingRegions, evaluateNeed, NEED_LEVELS } from '../lib/needScore';
import { transcriptUrl } from '../lib/remote';
import { needContext, wordCount } from '../lib/validate';

function money(value) {
  if (value === '' || value == null) return '—';
  const number = Number(value);
  if (!Number.isFinite(number)) return '—';
  return `$${number.toLocaleString('en-US')}`;
}

function peopleLabel(count) {
  const number = Number(count) || 0;
  return `${number} ${number === 1 ? 'person' : 'people'}`;
}

function safeUrl(url) {
  try {
    const parsed = new URL(String(url || ''));
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') return parsed.href;
  } catch {
    /* Leave unsafe or incomplete links as plain text. */
  }
  return '';
}

function telHref(value) {
  const digits = String(value || '').replace(/[^\d+]/g, '');
  if (digits.replace(/\D/g, '').length < 8) return '';
  return `tel:${digits}`;
}

function mailHref(value) {
  const email = String(value || '').trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return '';
  return `mailto:${email}`;
}

function mailAllHref(emails) {
  const list = [...new Set(emails.map((value) => String(value || '').trim().toLowerCase()).filter((email) => mailHref(email)))];
  if (!list.length) return '';
  return `mailto:?bcc=${encodeURIComponent(list.join(','))}&subject=${encodeURIComponent('Her Education Required')}`;
}

function hasContact(contact) {
  if (!contact) return false;
  return ['studentPhone', 'studentEmail', 'parentName', 'parentPhone', 'parentEmail'].some((key) => String(contact[key] || '').trim());
}

function csvCell(value) {
  let text = String(value ?? '');
  if (/^[=+\-@]/.test(text)) text = `'${text}`;
  if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function saveFile(filename, text, type) {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function matchesRound(status, roundId) {
  if (!roundId || roundId === 'all') return true;
  if (roundId === 'round-1') return status === 'submitted' || status === 'in_review';
  if (roundId === 'round-2') return status === 'round_2';
  if (roundId === 'final') return status === 'finalist';
  if (roundId === 'decision') return status === 'awarded' || status === 'not_advanced';
  return true;
}

const ROUNDS = [
  { id: 'all', label: 'All' },
  { id: 'round-1', label: 'Round 1' },
  { id: 'round-2', label: 'Round 2' },
  { id: 'final', label: 'Finalists' },
  { id: 'decision', label: 'Decision' },
];

export default function Read({ account, readerKind }) {
  const [files, setFiles] = useState([]);
  const [needs, setNeeds] = useState({});
  const [contacts, setContacts] = useState({});
  const [contactError, setContactError] = useState('');
  const [notes, setNotes] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [query, setQuery] = useState('');
  const [round, setRound] = useState('all');
  const [loadError, setLoadError] = useState('');
  const [note, setNote] = useState('');
  const [privateNote, setPrivateNote] = useState('');
  const [busy, setBusy] = useState('');
  const [actionError, setActionError] = useState('');
  const [urls, setUrls] = useState({ transcript: '', extra: '' });
  const [region, setRegion] = useState('');
  const [level, setLevel] = useState('');
  const [startedCount, setStartedCount] = useState(null);
  const [startEmails, setStartEmails] = useState([]);

  async function loadFiles(keepId) {
    const { data, error } = await supabase
      .from('applications')
      .select('user_id, file_number, status, submitted_at, updated_at, applicant_name, place, body')
      .neq('status', 'draft')
      .order('submitted_at', { ascending: false });
    if (error) {
      setLoadError(
        /relation|schema cache|could not find the table/i.test(error.message)
          ? 'The reading desk is not turned on yet. Run the database setup once, then reload this page.'
          : 'The applications could not be loaded.',
      );
      setFiles([]);
      return;
    }
    setLoadError('');
    setFiles(data || []);
    const started = await supabase.rpc('started_count');
    setStartedCount(started.error ? null : Number(started.data) || 0);
    if (readerKind === 'adult') {
      const startRes = await supabase.from('application_starts').select('email');
      setStartEmails(startRes.error ? [] : (startRes.data || []).map((row) => row.email));
    } else {
      setStartEmails([]);
    }
    setSelectedId((current) => keepId || current || null);
    if (data?.length) {
      const ids = data.map((file) => file.user_id);
      const needRes = await supabase.from('application_need').select('user_id, need').in('user_id', ids);
      const nextNeeds = {};
      (needRes.data || []).forEach((row) => {
        nextNeeds[row.user_id] = row.need;
      });
      setNeeds(nextNeeds);
      if (readerKind === 'adult') {
        const contactRes = await supabase.from('application_contact').select('user_id, contact').in('user_id', ids);
        const nextContacts = {};
        (contactRes.data || []).forEach((row) => {
          nextContacts[row.user_id] = row.contact;
        });
        setContacts(nextContacts);
        setContactError(
          contactRes.error && /relation|schema cache|could not find/i.test(contactRes.error.message || '')
            ? 'Phone numbers are not connected yet. Run the database setup again, then reload this page.'
            : '',
        );
      } else {
        setContacts({});
        setContactError('');
      }
    } else {
      setNeeds({});
      setContacts({});
      setContactError('');
    }
  }

  useEffect(() => {
    loadFiles();
  }, [readerKind]);

  const scored = useMemo(
    () =>
      files.map((file) => {
        const need = needs[file.user_id];
        const live = need ? evaluateNeed({ ...need, region: need.region || file.body?.profile?.region }) : null;
        const stored = file.body?.evaluation;
        const evaluation = live || (stored?.tier ? { tier: stored.tier, score: Number(stored.score) || 0, label: NEED_LEVELS.find((item) => item.id === stored.tier)?.label || '' } : null);
        return { ...file, region: applicationRegion(file, need), evaluation };
      }),
    [files, needs],
  );

  const everyoneMail = useMemo(() => {
    if (readerKind !== 'adult') return '';
    const fromFiles = Object.values(contacts).flatMap((contact) => [contact?.studentEmail, contact?.parentEmail]);
    return mailAllHref([...startEmails, ...fromFiles]);
  }, [contacts, readerKind, startEmails]);

  const regions = useMemo(() => {
    const counts = new Map();
    scored.forEach((file) => counts.set(file.region, (counts.get(file.region) || 0) + 1));
    return [...counts.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => compareReadingRegions(a.name, b.name));
  }, [scored]);

  const inRegion = useMemo(() => scored.filter((file) => file.region === region), [scored, region]);

  const levelCounts = useMemo(() => {
    const counts = Object.fromEntries(NEED_LEVELS.map((item) => [item.id, 0]));
    inRegion.forEach((file) => {
      if (file.evaluation?.tier && counts[file.evaluation.tier] != null) counts[file.evaluation.tier] += 1;
    });
    return counts;
  }, [inRegion]);

  const unscored = inRegion.filter((file) => !file.evaluation).length;

  const shown = useMemo(
    () =>
      inRegion
        .filter((file) => {
          if (file.evaluation?.tier !== level) return false;
          if (!matchesRound(file.status, round)) return false;
          const contact = contacts[file.user_id] || {};
          const haystack = `${file.applicant_name} ${file.file_number} ${file.place} ${contact.studentPhone || ''} ${contact.studentEmail || ''} ${contact.parentName || ''} ${contact.parentPhone || ''} ${contact.parentEmail || ''}`.toLowerCase();
          return !query.trim() || haystack.includes(query.trim().toLowerCase());
        })
        .sort((a, b) => (b.evaluation?.score || 0) - (a.evaluation?.score || 0)),
    [inRegion, level, query, round, contacts],
  );

  const selected = shown.find((file) => file.user_id === selectedId) || null;

  useEffect(() => {
    if (!level) return undefined;
    setSelectedId((current) => (shown.some((file) => file.user_id === current) ? current : shown[0]?.user_id || null));
    return undefined;
  }, [level, shown]);

  useEffect(() => {
    if (!selected || readerKind !== 'adult') {
      setNotes([]);
      return undefined;
    }
    let active = true;
    supabase
      .from('review_notes')
      .select('id, author_name, body, created_at')
      .eq('applicant_id', selected.user_id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (active) setNotes(data || []);
      });
    return () => {
      active = false;
    };
  }, [selected?.user_id, readerKind]);

  useEffect(() => {
    const transcript = selected?.body?.academics?.transcript?.path;
    const extra = selected?.body?.academics?.extraTranscript?.path;
    let active = true;
    Promise.all([transcriptUrl(transcript), transcriptUrl(extra)]).then(([transcriptLink, extraLink]) => {
      if (active) setUrls({ transcript: transcriptLink, extra: extraLink });
    });
    return () => {
      active = false;
    };
  }, [selected?.user_id, selected?.body?.academics?.transcript?.path, selected?.body?.academics?.extraTranscript?.path]);

  async function postMove(move) {
    if (!selected || busy || readerKind !== 'adult') return;
    setBusy(move.status);
    setActionError('');
    const { error } = await supabase.rpc('move_application', {
      applicant: selected.user_id,
      next_status: move.status,
      note: note.trim() || move.note,
    });
    setBusy('');
    if (error) {
      setActionError('That move could not be posted.');
      return;
    }
    setNote('');
    await loadFiles(selected.user_id);
  }

  async function postPrivate(event) {
    event.preventDefault();
    const body = privateNote.trim();
    if (!selected || !body || busy || readerKind !== 'adult') return;
    setBusy('note');
    setActionError('');
    const { error } = await supabase.from('review_notes').insert({
      applicant_id: selected.user_id,
      author_id: account.id,
      author_name: account.name || account.email,
      body: body.slice(0, 1000),
    });
    setBusy('');
    if (error) {
      setActionError('The private note could not be saved.');
      return;
    }
    setPrivateNote('');
    const { data } = await supabase
      .from('review_notes')
      .select('id, author_name, body, created_at')
      .eq('applicant_id', selected.user_id)
      .order('created_at', { ascending: false });
    setNotes(data || []);
  }

  const moves = selected && readerKind === 'adult' ? MOVES[selected.status] || [] : [];

  function contactRows() {
    return scored.map((file) => {
      const contact = contacts[file.user_id] || {};
      return {
        file,
        contact,
        cells: [
          file.file_number || '',
          file.applicant_name || '',
          contact.studentPhone || '',
          contact.studentEmail || '',
          contact.parentName || '',
          contact.parentPhone || '',
          contact.parentEmail || '',
          file.place || '',
          file.region || '',
          file.evaluation?.label || '',
          (STATUS_META[file.status] || STATUS_META.submitted).label,
        ],
      };
    });
  }

  function downloadContacts() {
    const header = ['File number', 'Student', 'Student phone', 'Student email', 'Parent or guardian', 'Parent phone', 'Parent email', 'Place', 'Region', 'Need level', 'Status'];
    const lines = [header, ...contactRows().map((row) => row.cells)].map((line) => line.map(csvCell).join(','));
    saveFile(`her-contact-list-${new Date().toISOString().slice(0, 10)}.csv`, lines.join('\n'), 'text/csv');
  }

  async function downloadBackup() {
    setBusy('backup');
    setActionError('');
    const { data: noteRows, error } = await supabase
      .from('review_notes')
      .select('applicant_id, author_name, body, created_at')
      .order('created_at', { ascending: true });
    const notesByFile = {};
    (noteRows || []).forEach((item) => {
      notesByFile[item.applicant_id] = notesByFile[item.applicant_id] || [];
      notesByFile[item.applicant_id].push(item);
    });
    const payload = {
      savedAt: new Date().toISOString(),
      files: contactRows().map(({ file, contact }) => ({
        fileNumber: file.file_number,
        name: file.applicant_name,
        status: file.status,
        submittedAt: file.submitted_at,
        place: file.place,
        region: file.region,
        needLevel: file.evaluation?.label || '',
        score: file.evaluation?.score ?? null,
        contact,
        need: needs[file.user_id] || null,
        application: file.body || {},
        notes: notesByFile[file.user_id] || [],
      })),
    };
    saveFile(
      `her-application-backup-${new Date().toISOString().slice(0, 10)}.json`,
      JSON.stringify(payload, null, 2),
      'application/json',
    );
    setBusy('');
    if (error) setActionError('The backup was saved without private notes. Run the database setup again if notes should be included.');
  }

  return (
    <div className="page">
      <header className="wrap page-head">
        <p className="eyebrow">Readers only</p>
        <h1>Reading desk.</h1>
        <div className="started-card">
          <div>
            <p className="eyebrow">Applications started</p>
            <strong>{startedCount == null ? '—' : startedCount}</strong>
          </div>
          {everyoneMail ? (
            <a className="started-mail" href={everyoneMail} aria-label="Email everyone who started">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M3 6.5A1.5 1.5 0 0 1 4.5 5h15A1.5 1.5 0 0 1 21 6.5v11a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17.5v-11Z" />
                <path d="m4 7 8 6 8-6" />
              </svg>
            </a>
          ) : null}
        </div>
        <p className="lede">
          {region
            ? level
              ? `${region} · ${NEED_LEVELS.find((item) => item.id === level)?.label || 'Need level'}`
              : region
            : 'Choose a region. United States files are Northeast, Midwest, South, or West. Anywhere else is listed by country. Then choose a need level.'}
        </p>
        {readerKind === 'adult' ? (
          <>
            <div className="hero-actions">
              <button type="button" className="btn btn-ghost" onClick={downloadContacts} disabled={!files.length || busy === 'backup'}>
                Download contact list
              </button>
              <button type="button" className="btn btn-ghost" onClick={downloadBackup} disabled={!files.length || busy === 'backup'}>
                {busy === 'backup' ? 'Saving backup…' : 'Download full backup'}
              </button>
            </div>
            <p className="hint">
              Contact is at the top of each file, and the financial answers are on the file too. The contact list opens in a spreadsheet. The full backup is every answer, the phone numbers, and the financial answers. Keep that file. The desk keeps the originals.
            </p>
          </>
        ) : null}
        {actionError ? <p className="field-error">{actionError}</p> : null}
        {region ? (
          <div className="hero-actions">
            <button
              type="button"
              className="btn-text"
              onClick={() => {
                setRegion('');
                setLevel('');
                setSelectedId(null);
              }}
            >
              All regions
            </button>
            {level ? (
              <button
                type="button"
                className="btn-text"
                onClick={() => {
                  setLevel('');
                  setSelectedId(null);
                }}
              >
                Need levels
              </button>
            ) : null}
          </div>
        ) : null}
      </header>

      {contactError ? (
        <div className="wrap">
          <div className="problem-list" role="alert">
            <p>{contactError}</p>
          </div>
        </div>
      ) : null}
      {loadError ? (
        <div className="wrap">
          <div className="problem-list" role="alert">
            <p>{loadError}</p>
          </div>
        </div>
      ) : !region ? (
        <div className="wrap">
          {regions.length === 0 ? <p className="empty-board">No applications have been submitted.</p> : null}
          <div className="choice-grid region-grid">
            {regions.map((item) => (
              <button key={item.name} type="button" className="choice" onClick={() => setRegion(item.name)}>
                <strong>{item.name}</strong>
                <span>
                  {item.count} {item.count === 1 ? 'application' : 'applications'}
                </span>
              </button>
            ))}
          </div>
        </div>
      ) : !level ? (
        <div className="wrap">
          <div className="choice-grid region-grid">
            {NEED_LEVELS.map((item) => (
              <button
                key={item.id}
                type="button"
                className="choice"
                onClick={() => {
                  setLevel(item.id);
                  setSelectedId(null);
                }}
              >
                <strong>{item.label}</strong>
                <span>
                  {levelCounts[item.id]} {levelCounts[item.id] === 1 ? 'application' : 'applications'}
                </span>
              </button>
            ))}
          </div>
          {unscored ? (
            <p className="hint">
              {unscored} {unscored === 1 ? 'application has' : 'applications have'} no financial answers yet, so {unscored === 1 ? 'it is' : 'they are'} not in a level.
            </p>
          ) : null}
        </div>
      ) : (
        <div className="wrap desk-layout">
          <div className="desk-list">
            <label className="search" htmlFor="desk-search">
              <span className="sr-only">Search files</span>
              <input
                id="desk-search"
                value={query}
                placeholder={readerKind === 'adult' ? 'Search name, phone, file, or place' : 'Search name, file, or place'}
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>
            <div className="filters" role="group" aria-label="Which round">
              {ROUNDS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={round === item.id ? 'is-picked' : ''}
                  aria-pressed={round === item.id}
                  onClick={() => setRound(item.id)}
                >
                  {item.label}
                </button>
              ))}
            </div>
            {shown.length === 0 ? <p className="empty-board">No submitted applications in this view.</p> : null}
            {shown.map((file) => {
              const meta = STATUS_META[file.status] || STATUS_META.submitted;
              const current = selected?.user_id === file.user_id;
              return (
                <button
                  key={file.user_id}
                  type="button"
                  className={`desk-file ${current ? 'is-current' : ''}`}
                  aria-pressed={current}
                  onClick={() => setSelectedId(file.user_id)}
                >
                  <strong>{file.applicant_name || 'Unnamed applicant'}</strong>
                  <span>{file.file_number || 'No file number'}</span>
                  {readerKind === 'adult' && contacts[file.user_id]?.studentPhone ? (
                    <span>{contacts[file.user_id].studentPhone}</span>
                  ) : null}
                  <span>{file.place || 'Place not added'}</span>
                  <span className={`pill tone-${meta.tone}`}>{meta.label}</span>
                </button>
              );
            })}
          </div>

          {selected ? (
            <FileSheet
              file={selected}
              contact={readerKind === 'adult' ? contacts[selected.user_id] : null}
              need={needs[selected.user_id] || null}
              adult={readerKind === 'adult'}
              urls={urls}
              notes={notes}
              moves={moves}
              note={note}
              setNote={setNote}
              privateNote={privateNote}
              setPrivateNote={setPrivateNote}
              busy={busy}
              actionError={actionError}
              onMove={postMove}
              onPrivate={postPrivate}
            />
          ) : (
            <p className="empty-board">Nothing is in this level.</p>
          )}
        </div>
      )}
    </div>
  );
}

function FileLink({ file, href, label }) {
  if (!file?.name && !file?.path) return <p className="hint">No {label.toLowerCase()} attached.</p>;
  const text = `${label}: ${file.name || 'File'}${file.size ? ` · ${formatBytes(file.size)}` : ''}`;
  if (!href) return <p className="hint">{text}. The file is not available to open.</p>;
  return (
    <p className="hint">
      <a href={href} target="_blank" rel="noreferrer">
        {text}
      </a>
    </p>
  );
}

function ReachLine({ label, name, phone, email }) {
  const call = telHref(phone);
  const mail = mailHref(email);
  return (
    <p>
      <span>{label}</span>
      {name ? <strong>{name}</strong> : null}
      {call ? <a href={call}>{phone}</a> : <strong>{phone || 'No phone number'}</strong>}
      {mail ? <a href={mail}>{email}</a> : email ? <strong>{email}</strong> : null}
    </p>
  );
}

function FileSheet({
  file,
  contact,
  need,
  adult,
  urls,
  notes,
  moves,
  note,
  setNote,
  privateNote,
  setPrivateNote,
  busy,
  actionError,
  onMove,
  onPrivate,
}) {
  const body = file.body || {};
  const academics = body.academics || {};
  const writing = body.writing || {};
  const words = Array.isArray(writing.threeWords) ? writing.threeWords.filter((word) => String(word || '').trim()) : [];
  const school = [body.school?.name, body.school?.city, body.school?.state].filter(Boolean).join(', ');
  const meta = STATUS_META[file.status] || STATUS_META.submitted;
  const flags = [
    need?.pell ? 'Pell Grant' : '',
    need?.snap ? 'SNAP or Medicaid' : '',
    need?.firstGen ? 'First generation' : '',
  ].filter(Boolean);
  const context = need ? needContext(need) : null;
  const gpaScale = reportedGpaScale(academics);

  return (
    <article className="desk-sheet">
      <header>
        <p className="eyebrow">{stageLabel(file.status)}</p>
        {file.evaluation?.label ? <p className="pill tone-rose">{file.evaluation.label}</p> : null}
        <h2>{file.applicant_name || 'Unnamed applicant'}</h2>
        <p>
          <span className={`pill tone-${meta.tone}`}>{meta.label}</span>
          {file.submitted_at ? <time dateTime={file.submitted_at}>Submitted {prettyWhen(file.submitted_at, true)}</time> : null}
        </p>
        <p className="hint">
          {file.file_number || 'No file number'}
          {file.place ? ` · ${file.place}` : ''}
          {body.profile?.age ? ` · age ${body.profile.age}` : ''}
        </p>
        {school ? <p className="hint">High school: {school}</p> : null}
      </header>

      <section>
        <h3>Contact</h3>
        {adult ? (
          hasContact(contact) ? (
            <div className="contact-reach">
              <ReachLine label="Student" phone={contact.studentPhone} email={contact.studentEmail} />
              <ReachLine
                label="Parent or guardian"
                name={contact.parentName}
                phone={contact.parentPhone}
                email={contact.parentEmail}
              />
            </div>
          ) : (
            <p className="hint">No contact information was saved with this file.</p>
          )
        ) : (
          <p className="hint">Phone numbers and parent contact stay with the adult reader.</p>
        )}
      </section>

      <section>
        <h3>Academics</h3>
        <p>
          {gpaScale === 'none' ? (
            <strong>No numerical GPA</strong>
          ) : (
            <>
              <strong>{academics.gpa || '—'}</strong> out of {gpaScaleLabel(gpaScale) || '—'}
            </>
          )}
          {academics.scale === 'weighted' ? ', weighted' : academics.scale === 'unweighted' ? ', unweighted' : ''}
        </p>
        <p>
          Satisfactory academic progress:{' '}
          {academics.sap === 'yes' ? 'Yes' : academics.sap === 'no' ? 'No' : academics.sap === 'unsure' ? 'Not sure' : '—'}
        </p>
        <p>
          HER member: {academics.herMember === 'yes' ? 'Yes' : academics.herMember === 'no' ? 'No' : '—'}
          {academics.herMember === 'yes' && String(academics.chapter || '').trim()
            ? ` · ${String(academics.chapter).trim()}`
            : ''}
        </p>
        <FileLink file={academics.transcript} href={urls.transcript} label="Transcript" />
        <FileLink file={academics.extraTranscript} href={urls.extra} label="Additional transcript" />
        {String(academics.gradeNote || '').trim() ? <p>{academics.gradeNote}</p> : null}
        {String(academics.limitations || '').trim() ? <p>{academics.limitations}</p> : null}
      </section>

      <section>
        <h3>Activities</h3>
        {ACTIVITIES.every((activity) => activityItems(body.activities?.entries, activity.id).length === 0) ? (
          <p className="hint">None added.</p>
        ) : null}
        {ACTIVITIES.flatMap((activity) =>
          activityItems(body.activities?.entries, activity.id).map((entry) => (
            <article key={entry.id} className="read-activity">
              <p className="eyebrow">{activityLabel(activity.id)}</p>
              <h4>{entry.title || 'Untitled'}</h4>
              <p>{entry.impact}</p>
            </article>
          )),
        )}
      </section>

      <section>
        <h3>Links</h3>
        {!body.links?.length ? <p className="hint">No links added.</p> : null}
        <ul className="read-links">
          {(body.links || []).map((link) => {
            const href = safeUrl(link.url);
            return (
              <li key={link.id}>
                <span>{linkLabel(link.type)}</span>
                {href ? (
                  <a href={href} target="_blank" rel="noreferrer">
                    {link.label || href}
                  </a>
                ) : (
                  <span>{link.label || link.url}</span>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      <section>
        <h3>Short takes</h3>
        <p className="three-read">{words.length ? words.join(' · ') : '—'}</p>
        <h4>What you intend to study</h4>
        <p>{writing.study || '—'}</p>
        <div className="read-places">
          {(writing.guests || []).map((guest) => (
            <article key={guest.id}>
              <strong>{guest.name || 'Unnamed guest'}</strong>
              <span>{guest.role}</span>
            </article>
          ))}
        </div>
        <h4>The dinner</h4>
        <p>{writing.dinner || '—'}</p>
        <h4>{MAKE_KINDS.find((item) => item.id === writing.makeKind)?.label || 'Class, artwork, or book'}</h4>
        <p>{writing.make || '—'}</p>
      </section>

      <section>
        <h3>Long takes</h3>
        <h4>What changed you</h4>
        <p className="essay-read">{writing.changed || '—'}</p>
        <p className="hint">
          {wordCount(writing.changed)} words
        </p>
        <h4>Pairs</h4>
        <p className="essay-read">{writing.pairs || '—'}</p>
        <p className="hint">{wordCount(writing.pairs)} words</p>
      </section>

      <section>
        <h3>Financial need</h3>
        {need ? (
            <>
              <dl className="read-list">
                <div>
                  <dt>Household AGI</dt>
                  <dd>{money(need.agi)}</dd>
                </div>
                <div>
                  <dt>Household</dt>
                  <dd>{peopleLabel(need.household)}</dd>
                </div>
                <div>
                  <dt>In college next year</dt>
                  <dd>{peopleLabel(need.inCollege)}</dd>
                </div>
                <div>
                  <dt>Student Aid Index</dt>
                  <dd>{need.hasSai === 'yes' ? need.sai || '—' : need.hasSai === 'no' ? 'None' : '—'}</dd>
                </div>
                <div>
                  <dt>Cost of attendance</dt>
                  <dd>{money(need.coa)}</dd>
                </div>
                <div>
                  <dt>Aid already awarded</dt>
                  <dd>{money(need.aid)}</dd>
                </div>
                <div>
                  <dt>Flags</dt>
                  <dd>{flags.length ? flags.join(', ') : 'None'}</dd>
                </div>
              </dl>
              {context ? (
                <p className="hint">
                  {context.title}. {context.copy}
                </p>
              ) : null}
              {String(need.circumstances || '').trim() ? <p>{need.circumstances}</p> : null}
            </>
        ) : (
          <p className="hint">No financial answers were sent with this file.</p>
        )}
      </section>

      {adult ? (
      <section className="desk-actions">
        <h3>Status</h3>
        {moves.length ? (
          <>
            <label className="field" htmlFor="status-note">
              Note on the student's receipt
              <textarea
                id="status-note"
                rows={3}
                value={note}
                onChange={(event) => setNote(event.target.value.slice(0, 1000))}
              />
            </label>
            <div className="post-actions">
              {moves.map((move) => (
                <button
                  key={move.status}
                  type="button"
                  className="btn btn-primary"
                  disabled={Boolean(busy)}
                  onClick={() => onMove(move)}
                >
                  {busy === move.status ? 'Posting…' : move.label}
                </button>
              ))}
            </div>
          </>
        ) : (
          <p className="hint">This file has no further move.</p>
        )}
        {actionError ? <p className="field-error">{actionError}</p> : null}

        <form className="composer" onSubmit={onPrivate}>
          <h3>Private note</h3>
          <p className="hint">Only adult readers see this. The student does not.</p>
          <div className="note-list">
            {notes.map((item) => (
              <article key={item.id}>
                <strong>{item.author_name || 'Reader'}</strong>
                <time dateTime={item.created_at}>{prettyWhen(item.created_at, true)}</time>
                <p>{item.body}</p>
              </article>
            ))}
          </div>
          <textarea
            rows={3}
            value={privateNote}
            aria-label="Private note"
            placeholder="A note for other readers"
            onChange={(event) => setPrivateNote(event.target.value.slice(0, 1000))}
          />
          <button type="submit" className="btn btn-ghost" disabled={Boolean(busy) || !privateNote.trim()}>
            {busy === 'note' ? 'Saving…' : 'Save private note'}
          </button>
        </form>
      </section>
      ) : (
        <section>
          <h3>Status</h3>
          <p className="hint">An adult reader posts the decision.</p>
        </section>
      )}
    </article>
  );
}
