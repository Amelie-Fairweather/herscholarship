import { useEffect, useState } from 'react';
import { AcademicsStep, ActivitiesStep, LinksStep, LongStep, NeedStep, ReviewStep, ShortStep } from '../apply/Steps';
import { ACTIVITIES, STEPS, STATUS_META, activityItems, prettyWhen } from '../lib/content';
import { explainSaveError, pushQueued, recordApplicationStart } from '../lib/remote';
import { fileId } from '../lib/storage';
import { problemsFor, readyCount } from '../lib/validate';

function readerNote(application) {
  const note = [...(application.meta.history || [])]
    .reverse()
    .find((item) => item.status && item.status !== 'submitted' && item.status !== 'draft' && String(item.note || '').trim());
  return note ? String(note.note).trim() : '';
}

const VIEWS = {
  need: NeedStep,
  academics: AcademicsStep,
  activities: ActivitiesStep,
  links: LinksStep,
  short: ShortStep,
  long: LongStep,
  review: ReviewStep,
};

export default function Apply({ step, go, application, setApplication, savedAt, account, quiz, cloud }) {
  const [tried, setTried] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const locked = Boolean(application.meta.submittedAt);
  const problems = problemsFor(step === 'done' ? 'review' : step, application);
  const ready = readyCount(application);
  const index = STEPS.findIndex((item) => item.id === step);
  const View = VIEWS[step];

  useEffect(() => {
    setTried(false);
  }, [step]);

  useEffect(() => {
    if (account && quiz?.eligible) recordApplicationStart(account);
  }, [account, quiz?.eligible]);

  useEffect(() => {
    if (!account || application.meta.submittedAt) return;
    const contact = application.contact || {};
    if ((contact.studentPhone || !account.phone) && (contact.studentEmail || !account.email)) return;
    setApplication((current) => {
      if (current.meta.submittedAt) return current;
      const currentContact = {
        studentPhone: '',
        studentEmail: '',
        parentName: '',
        parentPhone: '',
        parentEmail: '',
        ...(current.contact || {}),
      };
      const studentPhone = currentContact.studentPhone || account.phone || '';
      const studentEmail = currentContact.studentEmail || account.email || '';
      if (studentPhone === currentContact.studentPhone && studentEmail === currentContact.studentEmail) return current;
      return { ...current, contact: { ...currentContact, studentPhone, studentEmail } };
    });
  }, [account, application.contact, application.meta.submittedAt, setApplication]);

  useEffect(() => {
    const entries = application.activities?.entries;
    const dirty =
      application.activities?.selected != null ||
      ACTIVITIES.some((activity) => !Array.isArray(entries?.[activity.id]));
    if (!dirty) return;
    setApplication((current) => ({
      ...current,
      activities: {
        entries: Object.fromEntries(
          ACTIVITIES.map((activity) => [activity.id, activityItems(current.activities?.entries, activity.id)]),
        ),
      },
    }));
  }, [application.activities, setApplication]);

  useEffect(() => {
    if (step === 'done' && !application.meta.submittedAt) go('#apply/review');
    else if (step !== 'done' && !STEPS.some((item) => item.id === step)) go('#apply/need');
  }, [step, application.meta.submittedAt, go]);

  function setSection(section, value) {
    setApplication((current) => ({
      ...current,
      [section]: typeof value === 'function' ? value(current[section]) : value,
    }));
  }

  function error(field) {
    if (!tried || locked) return '';
    return problems.find((item) => item.field === field)?.message || '';
  }

  function next() {
    if (!locked && problems.length) {
      setTried(true);
      return;
    }
    const following = STEPS[index + 1];
    if (following) go(`#apply/${following.id}`);
  }

  function back() {
    if (index <= 0) {
      go('#home');
      return;
    }
    go(`#apply/${STEPS[index - 1].id}`);
  }

  async function submit() {
    const all = problemsFor('review', application);
    if (all.length) {
      setTried(true);
      return;
    }
    if (sending) return;
    if (cloud?.phase === 'loading') {
      setSendError('Still checking the saved file. Try again in a moment.');
      return;
    }
    const at = new Date().toISOString();
    const id = application.meta.applicationId || fileId();
    const entry = {
      at,
      status: 'submitted',
      round: 'Round 1',
      note: 'Application submitted. Readers have not opened it yet.',
    };
    const next = {
      ...application,
      meta: {
        ...application.meta,
        applicationId: id,
        submittedAt: at,
        status: 'submitted',
        history: [...(application.meta.history || []).filter((item) => item.status !== 'draft'), entry],
      },
    };
    setSending(true);
    setSendError('');
    const result = await pushQueued(account, next, quiz);
    setSending(false);
    if (result.error) {
      setSendError(explainSaveError(result.error));
      return;
    }
    const saved = {
      ...next,
      meta: {
        ...next.meta,
        applicationId: result.row?.file_number || id,
        submittedAt: result.row?.submitted_at || at,
        status: result.row?.status || 'submitted',
      },
    };
    setApplication(saved);
    go('#apply/done');
  }

  function onSubmit(event) {
    event.preventDefault();
    if (step === 'review') {
      if (locked) go('#apply/done');
      else submit();
      return;
    }
    next();
  }

  if (step === 'done' && locked) {
    const meta = STATUS_META[application.meta.status] || STATUS_META.submitted;
    return (
      <div className="page">
        <section className="wrap done-screen">
          <div className="petals" aria-hidden="true">
            {Array.from({ length: 10 }, (_, i) => (
              <i key={i} />
            ))}
          </div>
          <span className="logo-mark logo-mark-lg" aria-hidden="true">
            <img src="/her-logo.jpg" alt="" />
          </span>
          <p className="eyebrow">Your application is in</p>
          <h1>{application.meta.applicationId}</h1>
          <p className={`pill tone-${meta.tone}`}>{meta.label}</p>
          <p className="lede">Submitted {prettyWhen(application.meta.submittedAt, true)}. Keep this file number.</p>
          {readerNote(application) ? <p>{readerNote(application)}</p> : null}
          {cloud?.phase === 'error' && cloud.message ? <p className="field-error">{cloud.message}</p> : null}
          <div className="hero-actions">
            <button type="button" className="btn btn-primary" onClick={() => go('#apply/review')}>
              Read what you sent
            </button>
          </div>
        </section>
      </div>
    );
  }

  if (!View) return null;

  const savedLabel =
    cloud?.phase === 'loading'
      ? 'Checking the saved file…'
      : cloud?.phase === 'saving'
        ? 'Saving to your account…'
        : cloud?.phase === 'saved'
          ? `Saved to your account ${prettyWhen(savedAt, true)}`
          : cloud?.phase === 'error'
            ? cloud.message || 'Saved in this browser. It has not reached your account yet.'
            : savedAt
              ? `Draft saved ${prettyWhen(savedAt, true)}`
              : 'Draft saves in this browser';

  return (
    <div className="page apply-page">
      <div className="wrap apply-top">
        <div>
          <p className="eyebrow">Application</p>
          <h1>{locked ? 'Your submitted file' : 'Your file'}</h1>
        </div>
        <div className="save-meta">
          <p aria-live="polite">{locked ? `Submitted as ${application.meta.applicationId}` : savedLabel}</p>
          <div className="bar" aria-hidden="true">
            <span style={{ width: `${(ready / 6) * 100}%` }} />
          </div>
          <p>
            {ready} of 6 sections ready
          </p>
        </div>
      </div>

      <div className="wrap apply-layout">
        <nav className="step-rail" aria-label="Application sections">
          {locked && (
            <button type="button" className="step-link" onClick={() => go('#apply/done')}>
              <span className="step-index">✓</span>
              <span>
                <span className="step-full">Receipt</span>
                <span className="step-short">Receipt</span>
              </span>
            </button>
          )}
          {STEPS.map((item, itemIndex) => {
            const current = item.id === step;
            const valid = problemsFor(item.id, application).length === 0;
            const seen = (application.meta.visited || []).includes(item.id);
            const complete = item.id === 'review' ? ready === 6 : valid && seen;
            return (
              <button
                key={item.id}
                type="button"
                className={`step-link ${current ? 'is-current' : ''} ${complete ? 'is-done' : ''}`}
                onClick={() => go(`#apply/${item.id}`)}
                aria-current={current ? 'step' : undefined}
              >
                <span className="step-index">{complete ? '✓' : String(itemIndex + 1).padStart(2, '0')}</span>
                <span>
                  <span className="step-full">{item.label}</span>
                  <span className="step-short">{item.short}</span>
                  <small>{item.detail}</small>
                </span>
              </button>
            );
          })}
        </nav>

        <form className="paper" onSubmit={onSubmit} noValidate>
          {locked && (
            <div className="lock-banner">
              <p>
                This file is submitted. The answers stay as sent.
                {application.meta.status && application.meta.status !== 'submitted'
                  ? ` Status: ${(STATUS_META[application.meta.status] || STATUS_META.submitted).label}.`
                  : ''}
              </p>
              {readerNote(application) ? <p>{readerNote(application)}</p> : null}
            </div>
          )}
          {application.meta.sample && !locked && (
            <div className="sample-banner">
              <p>Sample answers for Marisol are in the file. Replace anything before you treat it as yours.</p>
              <button
                type="button"
                className="btn-text"
                onClick={() =>
                  setApplication((current) => ({ ...current, meta: { ...current.meta, sample: false } }))
                }
              >
                Dismiss
              </button>
            </div>
          )}
          {tried && problems.length > 0 && step !== 'review' && (
            <div className="problem-list" role="alert">
              <p>Finish this section to move forward.</p>
              <ul>
                {problems.map((item) => (
                  <li key={item.field}>{item.message}</li>
                ))}
              </ul>
            </div>
          )}
          {step === 'review' && problems.length > 0 && (
            <div className="problem-list" role="alert">
              <p>The file still needs:</p>
              <ul>
                {problems.map((item) => (
                  <li key={`${item.step}-${item.field}`}>{item.message}</li>
                ))}
              </ul>
            </div>
          )}

          {sendError ? (
            <div className="problem-list" role="alert">
              <p>{sendError}</p>
            </div>
          ) : null}

          <fieldset disabled={locked && step !== 'review'} className="plain">
            <View app={application} setSection={setSection} error={error} go={go} locked={locked} account={account} />
          </fieldset>

          <div className="apply-actions">
            <button type="button" className="btn btn-ghost" onClick={back}>
              Back
            </button>
            {step === 'review' ? (
              <button type="submit" className="btn btn-primary" disabled={sending}>
                {sending ? 'Sending…' : locked ? 'View receipt' : 'Submit application'}
              </button>
            ) : (
              <button type="submit" className="btn btn-primary">
                {STEPS[index + 1] ? `Continue to ${STEPS[index + 1].short}` : 'Review'}
              </button>
            )}
          </div>

        </form>
      </div>
    </div>
  );
}
