import { useEffect, useState } from 'react';
import { Choice, Count, Field } from '../components/Bits';
import {
  ACTIVITIES,
  ACTIVITY_LIMIT,
  EXAMPLES,
  SAP_OPTIONS,
  GPA_SCALES,
  LIMITS,
  LINK_TYPES,
  MAKE_KINDS,
  activityItems,
  activityLabel,
  formatBytes,
  gpaLimit,
  gpaScaleLabel,
  linkLabel,
  reportedGpaScale,
} from '../lib/content';
import { uid } from '../lib/storage';
import { removeTranscript, transcriptType, uploadFailure, uploadTranscript } from '../lib/remote';
import { wordCount } from '../lib/validate';

function peopleLabel(count) {
  return `${count} ${count === 1 ? 'person' : 'people'}`;
}

function gpaPlaceholder(gpaScale) {
  if (gpaScale === '100') return '95';
  if (gpaScale === 'none' || !gpaScale) return '';
  return Number(gpaScale) >= 10 ? '8.50' : '3.70';
}

function gpaHint(gpaScale, weighting) {
  if (!gpaScale) return 'Choose the scale your school uses. The list matches the Common App: 4 through 20, 100, or None.';
  if (gpaScale === 'none') return 'Leave the number blank. None is for a school that does not report a numerical GPA.';
  if (weighting === 'weighted' && gpaScale !== '100') return 'Use the number on your transcript. A weighted GPA can sit up to one point above this scale.';
  return 'Use the number on your transcript. Do not convert it to a different scale.';
}

function dollars(value, onValue) {
  return (event) => {
    const next = event.target.value.replace(/[^\d.]/g, '');
    const [whole, ...rest] = next.split('.');
    const clean = rest.length ? `${whole.slice(0, 9)}.${rest.join('').slice(0, 2)}` : whole.slice(0, 9);
    onValue(clean);
  };
}

const EMPTY_CONTACT = {
  studentPhone: '',
  studentEmail: '',
  parentName: '',
  parentPhone: '',
  parentEmail: '',
};

export function NeedStep({ app, setSection, error }) {
  const household = Math.min(12, Math.max(1, Number(app.need.household) || 1));
  const inCollege = Math.min(household, Math.max(1, Number(app.need.inCollege) || 1));
  const contact = { ...EMPTY_CONTACT, ...(app.contact || {}) };

  function patchContact(partial) {
    setSection('contact', { ...contact, ...partial });
  }

  function patch(partial) {
    const nextHousehold = Math.min(12, Math.max(1, Number(partial.household ?? app.need.household) || 1));
    const nextCollege = Math.min(nextHousehold, Math.max(1, Number(partial.inCollege ?? app.need.inCollege) || 1));
    setSection('need', { ...app.need, ...partial, household: nextHousehold, inCollege: nextCollege });
  }

  return (
    <div className="step-body">
      <header className="section-intro">
        <p className="eyebrow">Section 01</p>
        <h2>Financial need</h2>
        <p>
          These answers are self-reported. Finalists later verify them with a FAFSA Submission Summary or the first two
          pages of a tax return, and with the college aid award letter.
        </p>
      </header>

      <div className="contact-block">
        <h3>Your contact</h3>
        <p className="hint">An adult reader uses this to reach you. Student readers do not see these numbers.</p>
        <Field id="studentPhone" label="Your phone" error={error('studentPhone')}>
          <input
            id="studentPhone"
            type="tel"
            autoComplete="tel"
            inputMode="tel"
            value={contact.studentPhone}
            maxLength={22}
            onChange={(event) => patchContact({ studentPhone: event.target.value.replace(/[^\d+\-().\s]/g, '').slice(0, 22) })}
          />
        </Field>
        <Field id="studentEmail" label="Your email" error={error('studentEmail')}>
          <input
            id="studentEmail"
            type="email"
            autoComplete="email"
            value={contact.studentEmail}
            maxLength={120}
            onChange={(event) => patchContact({ studentEmail: event.target.value.slice(0, 120) })}
          />
        </Field>
        <h3>Parent or guardian</h3>
        <Field id="parentName" label="Name" error={error('parentName')}>
          <input
            id="parentName"
            autoComplete="name"
            value={contact.parentName}
            maxLength={80}
            onChange={(event) => patchContact({ parentName: event.target.value.slice(0, 80) })}
          />
        </Field>
        <Field id="parentPhone" label="Phone" error={error('parentPhone')}>
          <input
            id="parentPhone"
            type="tel"
            autoComplete="tel"
            inputMode="tel"
            value={contact.parentPhone}
            maxLength={22}
            onChange={(event) => patchContact({ parentPhone: event.target.value.replace(/[^\d+\-().\s]/g, '').slice(0, 22) })}
          />
        </Field>
        <Field id="parentEmail" label="Email" error={error('parentEmail')}>
          <input
            id="parentEmail"
            type="email"
            autoComplete="email"
            value={contact.parentEmail}
            maxLength={120}
            onChange={(event) => patchContact({ parentEmail: event.target.value.slice(0, 120) })}
          />
        </Field>
      </div>

      <div className="split-fields">
        <Field id="age" label="Age" error={error('age')}>
          <input
            id="age"
            inputMode="numeric"
            autoComplete="off"
            value={app.need.age}
            onChange={(event) => patch({ age: event.target.value.replace(/\D/g, '').slice(0, 3) })}
          />
        </Field>
        <Field id="city" label="City" error={error('city')}>
          <input
            id="city"
            autoComplete="address-level2"
            value={app.need.city}
            maxLength={60}
            onChange={(event) => patch({ city: event.target.value })}
          />
        </Field>
        <Field id="region" label="State or country" error={error('region')}>
          <input
            id="region"
            autoComplete="address-level1"
            value={app.need.region}
            maxLength={60}
            onChange={(event) => patch({ region: event.target.value })}
          />
        </Field>
      </div>

      <Field
        id="agi"
        label="Household adjusted gross income"
        error={error('agi')}
        hint="The AGI on last year’s tax return. This is the fallback when there is no FAFSA."
      >
        <input id="agi" inputMode="decimal" placeholder="42000" value={app.need.agi || ''} onChange={dollars(app.need.agi, (agi) => patch({ agi }))} />
      </Field>

      <Field label="How many people are in your household, including you?">
        <div className="household">
          <div className="stepper">
            <button
              type="button"
              aria-label="Fewer people"
              onClick={() => patch({ household: household - 1 })}
              disabled={household <= 1}
            >
              −
            </button>
            <strong>{household}</strong>
            <button
              type="button"
              aria-label="More people"
              onClick={() => patch({ household: household + 1 })}
              disabled={household >= 12}
            >
              +
            </button>
          </div>
          <p>{peopleLabel(household)}, including you.</p>
          <div className="people-row" aria-hidden="true">
            {Array.from({ length: 12 }, (_, index) => (
              <span key={index} className={index < household ? 'is-on' : ''} />
            ))}
          </div>
        </div>
      </Field>

      <Field label="How many will be in college next year?" error={error('inCollege')}>
        <div className="household">
          <div className="stepper">
            <button
              type="button"
              aria-label="Fewer in college"
              onClick={() => patch({ inCollege: inCollege - 1 })}
              disabled={inCollege <= 1}
            >
              −
            </button>
            <strong>{inCollege}</strong>
            <button
              type="button"
              aria-label="More in college"
              onClick={() => patch({ inCollege: inCollege + 1 })}
              disabled={inCollege >= household}
            >
              +
            </button>
          </div>
          <p>{peopleLabel(inCollege)} in college, including you if you enroll.</p>
        </div>
      </Field>

      <Field label="Do you have a Student Aid Index from the FAFSA?" error={error('hasSai')}>
        <div className="choice-grid two">
          <Choice
            pressed={app.need.hasSai === 'yes'}
            title="Yes"
            copy="I can enter the number from my FAFSA Submission Summary."
            onClick={() => patch({ hasSai: 'yes' })}
          />
          <Choice
            pressed={app.need.hasSai === 'no'}
            title="No"
            copy="I have not filed, or I cannot get the summary."
            onClick={() => patch({ hasSai: 'no', sai: '' })}
          />
        </div>
      </Field>
      {app.need.hasSai === 'yes' ? (
        <Field
          id="sai"
          label="Student Aid Index (SAI)"
          error={error('sai')}
          hint="From your FAFSA Submission Summary. The range is -1,500 to 999,999."
        >
          <input
            id="sai"
            inputMode="numeric"
            placeholder="-1500"
            value={app.need.sai || ''}
            onChange={(event) => {
              const next = event.target.value.replace(/[^\d-]/g, '');
              const negative = next.startsWith('-');
              const digits = next.replace(/-/g, '').slice(0, 6);
              patch({ sai: negative ? `-${digits}` : digits });
            }}
          />
        </Field>
      ) : null}

      <Field
        id="coa"
        label="Target school’s annual cost of attendance"
        error={error('coa')}
        hint="Tuition, housing, books, and other costs the school publishes for one year."
      >
        <input id="coa" inputMode="decimal" placeholder="28000" value={app.need.coa || ''} onChange={dollars(app.need.coa, (coa) => patch({ coa }))} />
      </Field>
      <Field
        id="aid"
        label="Grant and scholarship aid already awarded"
        error={error('aid')}
        hint="Total grants and scholarships for that same year. Use 0 if none. Loans do not count."
      >
        <input id="aid" inputMode="decimal" placeholder="0" value={app.need.aid || ''} onChange={dollars(app.need.aid, (aid) => patch({ aid }))} />
      </Field>

      <Field label="Any of these apply?">
        <div className="choice-grid">
          <Choice pressed={Boolean(app.need.pell)} title="Pell Grant" copy="I am eligible for a Federal Pell Grant." onClick={() => patch({ pell: !app.need.pell })} />
          <Choice pressed={Boolean(app.need.snap)} title="SNAP or Medicaid" copy="My household receives SNAP or Medicaid." onClick={() => patch({ snap: !app.need.snap })} />
          <Choice pressed={Boolean(app.need.firstGen)} title="First generation" copy="I would be the first in my family to finish college." onClick={() => patch({ firstGen: !app.need.firstGen })} />
        </div>
      </Field>

      <Field
        id="circumstances"
        label="Special financial circumstances"
        error={error('circumstances')}
        hint="Optional. A layoff, medical bills, a single parent, or another change last year’s tax return does not show."
      >
        <textarea
          id="circumstances"
          rows={4}
          value={app.need.circumstances || ''}
          onChange={(event) => patch({ circumstances: event.target.value.slice(0, 5000) })}
        />
        <Count value={app.need.circumstances || ''} max={LIMITS.short} />
      </Field>
    </div>
  );
}

function TranscriptDrop({ fileKey, file, note, hot, onHot, onFile, onClear, label, hint, errorText, prompt, detail }) {
  return (
      <Field label={label} error={note || errorText} hint={hint}>
      {file ? (
        <div className="file-row">
          <div>
            <strong>{file.name}</strong>
            <span>
              {formatBytes(file.size)}
              {file.path
                ? ' · uploaded with your account.'
                : ' · saved in this browser. Choose it again so it can be sent.'}
            </span>
          </div>
          <button type="button" className="btn btn-small btn-ghost" onClick={onClear}>
            Remove
          </button>
        </div>
      ) : (
        <label
          className={`drop ${hot ? 'is-hot' : ''}`}
          onDragOver={(event) => {
            event.preventDefault();
            onHot(fileKey);
          }}
          onDragLeave={() => onHot('')}
          onDrop={(event) => {
            event.preventDefault();
            onHot('');
            onFile(event.dataTransfer.files?.[0], fileKey);
          }}
        >
          <input
            type="file"
            accept=".pdf,.png,.jpg,.jpeg,.webp,application/pdf,image/png,image/jpeg,image/webp"
            onChange={(event) => {
              onFile(event.target.files?.[0], fileKey);
              event.target.value = '';
            }}
          />
          <strong>{prompt}</strong>
          <span>{detail}</span>
        </label>
      )}
    </Field>
  );
}

export function AcademicsStep({ app, setSection, error, account }) {
  const [fileNotes, setFileNotes] = useState({ transcript: '', extraTranscript: '' });
  const [hot, setHot] = useState('');
  const gpaScale = reportedGpaScale(app.academics);
  const max = gpaLimit(gpaScale, app.academics.scale);
  const gpaNumber = Number(app.academics.gpa);
  const meter = max && Number.isFinite(gpaNumber) ? Math.min(100, (gpaNumber / max) * 100) : 0;

  function patch(partial) {
    setSection('academics', { ...app.academics, ...partial });
  }

  async function takeFile(file, key) {
    if (!file) return;
    if (!transcriptType(file)) {
      setFileNotes((current) => ({ ...current, [key]: 'Send a PDF or a photo of the transcript.' }));
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setFileNotes((current) => ({ ...current, [key]: 'Keep the transcript under 10 MB.' }));
      return;
    }
    if (!account?.id) {
      setFileNotes((current) => ({ ...current, [key]: 'Sign in again before attaching the transcript.' }));
      return;
    }
    setFileNotes((current) => ({ ...current, [key]: 'Uploading the transcript…' }));
    const previous = app.academics[key]?.path;
    const result = await uploadTranscript(account.id, key, file);
    if (result.error) {
      setFileNotes((current) => ({ ...current, [key]: uploadFailure(result.error) }));
      return;
    }
    if (previous && previous !== result.path) removeTranscript(previous);
    setFileNotes((current) => ({ ...current, [key]: '' }));
    patch({ [key]: { name: file.name, size: file.size, type: transcriptType(file), path: result.path } });
  }

  function clearFile(key) {
    const path = app.academics[key]?.path;
    if (path) removeTranscript(path);
    patch({ [key]: null });
  }

  return (
    <div className="step-body">
      <header className="section-intro">
        <p className="eyebrow">Section 02</p>
        <h2>Academics</h2>
        <p>Enter your current GPA and the scale it is out of. Attach a transcript that includes your current grades, then add anything the transcript leaves out.</p>
      </header>

      <Field label="Are you a HER member?" error={error('herMember')}>
        <div className="choice-grid two">
          <Choice
            pressed={app.academics.herMember === 'yes'}
            title="Yes"
            onClick={() => patch({ herMember: 'yes' })}
          />
          <Choice
            pressed={app.academics.herMember === 'no'}
            title="No"
            onClick={() => patch({ herMember: 'no' })}
          />
        </div>
      </Field>
      {app.academics.herMember === 'yes' ? (
        <Field id="chapter" label="Chapter name" error={error('chapter')}>
          <input
            id="chapter"
            value={app.academics.chapter || ''}
            placeholder="Your high school chapter"
            onChange={(event) => patch({ chapter: event.target.value.slice(0, 80) })}
          />
        </Field>
      ) : null}

      <Field id="gpa" label="Current GPA" error={error('gpa') || error('gpaScale')} hint={gpaHint(gpaScale, app.academics.scale)}>
        <div className="gpa-box">
          <div className="gpa-row">
            <input
              id="gpa"
              inputMode="decimal"
              placeholder={gpaPlaceholder(gpaScale)}
              value={app.academics.gpa}
              disabled={gpaScale === 'none'}
              onChange={(event) => {
                const next = event.target.value.replace(/[^\d.]/g, '');
                const [whole, ...rest] = next.split('.');
                const clean = rest.length ? `${whole.slice(0, 3)}.${rest.join('').slice(0, 2)}` : whole.slice(0, 3);
                patch({ gpa: clean });
              }}
            />
            <label className="gpa-out" htmlFor="gpa-scale">
              out of
              <select
                id="gpa-scale"
                value={gpaScale}
                onChange={(event) => {
                  const next = event.target.value;
                  patch(next === 'none' ? { gpaScale: next, gpa: '' } : { gpaScale: next });
                }}
              >
                <option value="">Select</option>
                {GPA_SCALES.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {max ? (
            <div className="gpa-meter" aria-hidden="true">
              <span style={{ width: `${meter}%` }} />
            </div>
          ) : null}
        </div>
      </Field>

      <Field label="Is this GPA unweighted or weighted?" error={error('scale')}>
        <div className="choice-grid two">
          <Choice
            pressed={app.academics.scale === 'unweighted'}
            title="Unweighted"
            copy="No extra points for harder classes."
            onClick={() => patch({ scale: 'unweighted' })}
          />
          <Choice
            pressed={app.academics.scale === 'weighted'}
            title="Weighted"
            copy="Extra points for honors, AP, IB, or dual enrollment."
            onClick={() => patch({ scale: 'weighted' })}
          />
        </div>
      </Field>

      <Field label="Are you meeting Satisfactory Academic Progress (SAP)?" error={error('sap')}>
        <div className="choice-grid">
          {SAP_OPTIONS.map((option) => (
            <Choice
              key={option.id}
              pressed={app.academics.sap === option.id}
              title={option.label}
              copy={option.copy}
              onClick={() => patch({ sap: option.id })}
            />
          ))}
        </div>
      </Field>

      <TranscriptDrop
        fileKey="transcript"
        file={app.academics.transcript}
        note={fileNotes.transcript}
        hot={hot === 'transcript'}
        onHot={setHot}
        onFile={takeFile}
        onClear={() => clearFile('transcript')}
        label="Transcript"
        hint="Please include current grades on the transcript."
        errorText={error('transcript')}
        prompt="Drop the transcript, or choose a file"
        detail="Please include current grades on the transcript. PDF, JPG, or PNG. Under 10 MB."
      />
      <TranscriptDrop
        fileKey="extraTranscript"
        file={app.academics.extraTranscript}
        note={fileNotes.extraTranscript}
        hot={hot === 'extraTranscript'}
        onHot={setHot}
        onFile={takeFile}
        onClear={() => clearFile('extraTranscript')}
        label="Additional transcript"
        hint="Optional. Another school, a midyear report, or a later grade update."
        errorText=""
        prompt="Drop an additional transcript, or choose a file"
        detail="PDF, JPG, or PNG. Under 10 MB."
      />
      <Field
        id="grade-note"
        label="Any additional grade or school-based information?"
        error={error('gradeNote')}
        hint="Optional. A class, a grade change, a school move, or anything the transcript does not show."
      >
        <textarea
          id="grade-note"
          rows={4}
          value={app.academics.gradeNote || ''}
          onChange={(event) => patch({ gradeNote: event.target.value.slice(0, 5000) })}
        />
        <Count value={app.academics.gradeNote || ''} max={LIMITS.short} />
      </Field>
      <Field
        id="limitations"
        label="Any limitations of your education?"
        error={error('limitations')}
        hint="Optional. Time, money, health, language, caregiving, or access to classes."
      >
        <textarea
          id="limitations"
          rows={4}
          value={app.academics.limitations || ''}
          onChange={(event) => patch({ limitations: event.target.value.slice(0, 5000) })}
        />
        <Count value={app.academics.limitations || ''} max={LIMITS.short} />
      </Field>
    </div>
  );
}

export function ActivitiesStep({ app, setSection, error }) {
  function write(id, list) {
    setSection('activities', {
      entries: { ...app.activities.entries, [id]: list },
    });
  }

  function updateItem(id, itemId, partial) {
    const list = activityItems(app.activities.entries, id).map((item) =>
      item.id === itemId ? { ...item, ...partial } : item,
    );
    write(id, list);
  }

  return (
    <div className="step-body">
      <header className="section-intro">
        <p className="eyebrow">Section 03</p>
        <h2>Activities</h2>
        <p>
          Each area holds up to four. A job, a volunteer shift, and care at home belong here as much as a school role.
          Every activity needs a statement of impact in 150 characters or fewer.
        </p>
      </header>
      {error('selected') ? <p className="field-error">{error('selected')}</p> : null}

      <div className="activity-list">
        {ACTIVITIES.map((activity) => {
          const list = activityItems(app.activities.entries, activity.id);
          return (
            <article key={activity.id} className={`activity ${list.length ? 'is-open' : ''}`}>
              <header className="activity-head">
                <span>
                  <strong>{activity.label}</strong>
                  <small>{activity.hint}</small>
                </span>
                <em>
                  {list.length} of {ACTIVITY_LIMIT}
                </em>
              </header>
              <div className="slot-tray" aria-label={`${activity.label}, four slots`}>
                {Array.from({ length: ACTIVITY_LIMIT }, (_, index) => {
                  const item = list[index];
                  return (
                    <div key={item?.id || index} className={`slot ${item ? 'is-filled' : ''}`}>
                      <span>0{index + 1}</span>
                      <strong>{item?.title.trim() || 'Open'}</strong>
                    </div>
                  );
                })}
              </div>
              <div className="activity-body">
                {list.map((entry, index) => (
                  <div key={entry.id} className="activity-entry">
                    <Field
                      id={`title-${activity.id}-${entry.id}`}
                      label={`Activity ${index + 1} name`}
                      error={error(`title-${activity.id}-${entry.id}`)}
                    >
                      <input
                        id={`title-${activity.id}-${entry.id}`}
                        value={entry.title}
                        maxLength={80}
                        onChange={(event) => updateItem(activity.id, entry.id, { title: event.target.value })}
                      />
                    </Field>
                    <Field
                      id={`impact-${activity.id}-${entry.id}`}
                      label="Statement of impact"
                      error={error(`impact-${activity.id}-${entry.id}`)}
                      hint="150 characters, including spaces."
                    >
                      <textarea
                        id={`impact-${activity.id}-${entry.id}`}
                        rows={3}
                        maxLength={LIMITS.impact}
                        value={entry.impact}
                        onChange={(event) =>
                          updateItem(activity.id, entry.id, { impact: event.target.value.slice(0, LIMITS.impact) })
                        }
                      />
                      <Count value={entry.impact} max={LIMITS.impact} unit="characters" />
                    </Field>
                    <button
                      type="button"
                      className="btn-text"
                      onClick={() => write(activity.id, list.filter((item) => item.id !== entry.id))}
                    >
                      Remove this activity
                    </button>
                  </div>
                ))}
                {list.length < ACTIVITY_LIMIT ? (
                  <button
                    type="button"
                    className="btn btn-ghost btn-small activity-add"
                    onClick={() => write(activity.id, [...list, { id: uid(), title: '', impact: '' }])}
                  >
                    {list.length ? 'Add another' : 'Add an activity'}
                  </button>
                ) : (
                  <p className="hint">This area already has four.</p>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

export function LinksStep({ app, setSection, error }) {
  function setLinks(links) {
    setSection('links', links);
  }

  function update(id, partial) {
    setLinks(app.links.map((link) => (link.id === id ? { ...link, ...partial } : link)));
  }

  return (
    <div className="step-body">
      <header className="section-intro">
        <p className="eyebrow">Section 04</p>
        <h2>Links</h2>
        <p>Optional. Add a website, LinkedIn, news coverage, or Instagram if it helps a reader see the work.</p>
      </header>

      {app.links.length === 0 && <p className="hint">No links yet. The file can be submitted without them.</p>}

      <div className="link-list">
        {app.links.map((link, index) => {
          const placeholder = LINK_TYPES.find((item) => item.id === link.type)?.placeholder || 'https://';
          return (
            <article key={link.id} className="link-row">
              <header>
                <h3>Link {index + 1}</h3>
                <button
                  type="button"
                  className="btn-text"
                  onClick={() => setLinks(app.links.filter((item) => item.id !== link.id))}
                >
                  Remove
                </button>
              </header>
              <div className="type-row" role="group" aria-label="Kind of link">
                {LINK_TYPES.map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    className={link.type === type.id ? 'is-picked' : ''}
                    aria-pressed={link.type === type.id}
                    onClick={() => update(link.id, { type: type.id })}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
              <Field id={`url-${link.id}`} label="URL" error={error(link.id)}>
                <input
                  id={`url-${link.id}`}
                  inputMode="url"
                  placeholder={placeholder}
                  value={link.url}
                  maxLength={240}
                  onChange={(event) => update(link.id, { url: event.target.value })}
                />
              </Field>
              <Field id={`label-${link.id}`} label="Label, if you want one">
                <input
                  id={`label-${link.id}`}
                  value={link.label}
                  maxLength={60}
                  placeholder="What should a reader call this?"
                  onChange={(event) => update(link.id, { label: event.target.value })}
                />
              </Field>
            </article>
          );
        })}
      </div>

      <button
        type="button"
        className="btn btn-ghost"
        onClick={() =>
          setLinks([...app.links, { id: uid(), type: 'website', url: '', label: '' }])
        }
      >
        Add a link
      </button>
    </div>
  );
}

export function ShortStep({ app, setSection, error }) {
  const writing = app.writing;
  const kind = MAKE_KINDS.find((item) => item.id === writing.makeKind);

  function patch(partial) {
    setSection('writing', { ...writing, ...partial });
  }

  function setWord(index, raw) {
    const next = [...writing.threeWords];
    const parts = raw.trim().split(/\s+/).filter(Boolean);
    if (parts.length > 1) {
      parts.slice(0, 3 - index).forEach((part, offset) => {
        next[index + offset] = part.slice(0, 24);
      });
    } else {
      next[index] = raw.replace(/\s/g, '').slice(0, 24);
    }
    patch({ threeWords: next });
  }

  function updateGuest(id, partial) {
    patch({
      guests: writing.guests.map((guest) => (guest.id === id ? { ...guest, ...partial } : guest)),
    });
  }

  return (
    <div className="step-body">
      <header className="section-intro">
        <p className="eyebrow">Section 05 · Short takes</p>
        <h2>Keep each answer to 100 words.</h2>
        <p>The three-word line is the exception. It is exactly three words, from the person who knows you best.</p>
      </header>

      <Field label="In three words, how would the person who knows you best describe you?" error={error('words')}>
        <div className="word-boxes">
          {writing.threeWords.map((word, index) => (
            <input
              key={index}
              aria-label={`Word ${index + 1}`}
              value={word}
              maxLength={24}
              onChange={(event) => setWord(index, event.target.value)}
            />
          ))}
        </div>
      </Field>

      <Field id="study" label="What do you intend on studying, and why?" error={error('study')}>
        <textarea
          id="study"
          rows={6}
          value={writing.study}
          onChange={(event) => patch({ study: event.target.value.slice(0, 5000) })}
        />
        <Count value={writing.study} max={LIMITS.short} />
      </Field>

      <section className="prompt-block">
        <h3>You’re hosting a dinner party. Pick up to three guests.</h3>
        <p>
          Their careers must be related to women’s rights movements in some way. The place cards hold the names. The
          100 words are what you would talk about, and why you invited them.
        </p>
        {error('guests') ? <p className="field-error">{error('guests')}</p> : null}
        <div className="places">
          {writing.guests.map((guest, index) => (
            <article key={guest.id} className="place-card">
              <header>
                <h4>Place {index + 1}</h4>
                <button
                  type="button"
                  className="btn-text"
                  onClick={() => patch({ guests: writing.guests.filter((item) => item.id !== guest.id) })}
                >
                  Remove
                </button>
              </header>
              <Field id={`guest-${guest.id}`} label="Name" error={error(`guest-${guest.id}`)}>
                <input
                  id={`guest-${guest.id}`}
                  value={guest.name}
                  maxLength={60}
                  onChange={(event) => updateGuest(guest.id, { name: event.target.value })}
                />
              </Field>
              <Field id={`role-${guest.id}`} label="Career or role" error={error(`role-${guest.id}`)}>
                <input
                  id={`role-${guest.id}`}
                  value={guest.role}
                  maxLength={80}
                  onChange={(event) => updateGuest(guest.id, { role: event.target.value })}
                />
              </Field>
            </article>
          ))}
          {writing.guests.length < 3 && (
            <button
              type="button"
              className="place-add"
              onClick={() =>
                patch({
                  guests: [...writing.guests, { id: uid(), name: '', role: '' }],
                })
              }
            >
              Set another place
            </button>
          )}
        </div>
        <Field id="dinner" label="What would you talk about, and why did you invite them?" error={error('dinner')}>
          <textarea
            id="dinner"
            rows={6}
            value={writing.dinner}
            onChange={(event) => patch({ dinner: event.target.value.slice(0, 5000) })}
          />
          <Count value={writing.dinner} max={LIMITS.short} />
        </Field>
      </section>

      <section className="prompt-block">
        <h3>If you could teach a college class, create a piece of artwork, or write a book, what would you teach or create, and why?</h3>
        <Field label="Choose one" error={error('makeKind')}>
          <div className="choice-grid">
            {MAKE_KINDS.map((item) => (
              <Choice
                key={item.id}
                pressed={writing.makeKind === item.id}
                title={item.label}
                onClick={() => patch({ makeKind: item.id })}
              />
            ))}
          </div>
        </Field>
        <Field id="make" label={kind?.prompt || 'What would you teach or create, and why?'} error={error('make')}>
          <textarea
            id="make"
            rows={6}
            value={writing.make}
            onChange={(event) => patch({ make: event.target.value.slice(0, 5000) })}
          />
          <Count value={writing.make} max={LIMITS.short} />
        </Field>
      </section>
    </div>
  );
}

export function LongStep({ app, setSection, error }) {
  const [focus, setFocus] = useState(null);
  const writing = app.writing;

  function patch(partial) {
    setSection('writing', { ...writing, ...partial });
  }

  useEffect(() => {
    if (!focus) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (event) => {
      if (event.key === 'Escape') setFocus(null);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', onKey);
    };
  }, [focus]);

  const prompts = {
    changed: {
      kicker: 'Long take 1',
      title: 'What changed the way you think?',
      body: 'What is a historical event, piece of writing, or artwork that completely changed the way you think, or contributed to the person you are?',
    },
    pairs: {
      kicker: 'Long take 2',
      title: 'The best things come in pairs.',
      body: 'Connect something totally unrelated to a part of women’s studies — women’s history, feminism, or a common stereotype. Be creative.',
    },
  };

  function essay(id) {
    const prompt = prompts[id];
    return (
      <section className="prompt-block">
        <p className="eyebrow">{prompt.kicker}</p>
        <h3>{prompt.title}</h3>
        <p>{prompt.body}</p>
        {id === 'pairs' && (
          <div className="examples">
            <p className="hint">Examples to lean on, then leave behind. Write your own pair.</p>
            {EXAMPLES.map((example) => (
              <details key={example.id}>
                <summary>{example.title}</summary>
                <p>{example.body}</p>
              </details>
            ))}
          </div>
        )}
        <Field id={id} label="Your essay" error={error(id)}>
          {focus !== id && (
            <textarea
              id={id}
              rows={10}
              value={writing[id]}
              onChange={(event) => patch({ [id]: event.target.value.slice(0, 8000) })}
            />
          )}
          <div className="essay-tools">
            <Count value={writing[id]} max={LIMITS.long} />
            <button type="button" className="btn btn-small btn-ghost" onClick={() => setFocus(id)}>
              Write in focus
            </button>
          </div>
        </Field>
      </section>
    );
  }

  return (
    <div className="step-body">
      <header className="section-intro">
        <p className="eyebrow">Section 06 · Long takes</p>
        <h2>Two essays. 550 words is the limit.</h2>
        <p>Write until the idea is finished. The counter turns when you get close, and it stops you if you go past.</p>
      </header>
      {essay('changed')}
      {essay('pairs')}
      {focus && (
        <div className="focus-layer" role="dialog" aria-modal="true" aria-label={prompts[focus].title}>
          <div className="focus-bar">
            <div>
              <p className="eyebrow">{prompts[focus].kicker}</p>
              <strong>{prompts[focus].title}</strong>
            </div>
            <Count value={writing[focus]} max={LIMITS.long} />
            <button type="button" className="btn btn-primary" onClick={() => setFocus(null)}>
              Close
            </button>
          </div>
          <textarea
            autoFocus
            value={writing[focus]}
            aria-label={prompts[focus].title}
            onChange={(event) => patch({ [focus]: event.target.value.slice(0, 8000) })}
          />
        </div>
      )}
    </div>
  );
}

function ReviewBlock({ title, onEdit, locked, children }) {
  return (
    <section className="review-block">
      <header>
        <h3>{title}</h3>
        {locked ? null : (
          <button type="button" className="btn-text" onClick={onEdit}>
            Edit
          </button>
        )}
      </header>
      {children}
    </section>
  );
}

export function ReviewStep({ app, go, locked }) {
  const { contact = {}, need, academics, activities, links, writing } = app;
  const flags = [
    need.pell ? 'Pell Grant' : '',
    need.snap ? 'SNAP or Medicaid' : '',
    need.firstGen ? 'First generation' : '',
  ].filter(Boolean);
  const words = writing.threeWords.filter((word) => word.trim());

  return (
    <div className="step-body">
      <header className="section-intro">
        <p className="eyebrow">Section 07</p>
        <h2>Review the file</h2>
        <p>Read it the way a reviewer will. Then submit. The file is saved with your account.</p>
      </header>

      <ReviewBlock title="Contact" locked={locked} onEdit={() => go('#apply/need')}>
        <dl className="read-list">
          <div>
            <dt>Your phone</dt>
            <dd>{contact.studentPhone || '—'}</dd>
          </div>
          <div>
            <dt>Your email</dt>
            <dd>{contact.studentEmail || '—'}</dd>
          </div>
          <div>
            <dt>Parent or guardian</dt>
            <dd>{contact.parentName || '—'}</dd>
          </div>
          <div>
            <dt>Parent phone</dt>
            <dd>{contact.parentPhone || '—'}</dd>
          </div>
          <div>
            <dt>Parent email</dt>
            <dd>{contact.parentEmail || '—'}</dd>
          </div>
        </dl>
      </ReviewBlock>

      <ReviewBlock title="Financial need" locked={locked} onEdit={() => go('#apply/need')}>
        <dl className="read-list">
          <div>
            <dt>Age</dt>
            <dd>{need.age || '—'}</dd>
          </div>
          <div>
            <dt>Place</dt>
            <dd>{[need.city, need.region].filter(Boolean).join(', ') || '—'}</dd>
          </div>
          <div>
            <dt>Household AGI</dt>
            <dd>{need.agi ? `$${Number(need.agi).toLocaleString('en-US')}` : '—'}</dd>
          </div>
          <div>
            <dt>Household</dt>
            <dd>{peopleLabel(Number(need.household) || 1)}</dd>
          </div>
          <div>
            <dt>In college next year</dt>
            <dd>{peopleLabel(Number(need.inCollege) || 1)}</dd>
          </div>
          <div>
            <dt>Student Aid Index</dt>
            <dd>{need.hasSai === 'yes' ? need.sai || '—' : need.hasSai === 'no' ? 'None' : '—'}</dd>
          </div>
          <div>
            <dt>Cost of attendance</dt>
            <dd>{need.coa ? `$${Number(need.coa).toLocaleString('en-US')}` : '—'}</dd>
          </div>
          <div>
            <dt>Aid already awarded</dt>
            <dd>{need.aid !== '' && need.aid != null ? `$${Number(need.aid).toLocaleString('en-US')}` : '—'}</dd>
          </div>
          <div>
            <dt>Flags</dt>
            <dd>{flags.length ? flags.join(', ') : 'None'}</dd>
          </div>
        </dl>
        {String(need.circumstances || '').trim() ? <p>{need.circumstances}</p> : null}
      </ReviewBlock>

      <ReviewBlock title="Academics" locked={locked} onEdit={() => go('#apply/academics')}>
        <p>
          {reportedGpaScale(academics) === 'none' ? (
            <strong>No numerical GPA</strong>
          ) : (
            <>
              <strong>{academics.gpa || '—'}</strong> out of {gpaScaleLabel(reportedGpaScale(academics)) || '—'}
            </>
          )}
          {academics.scale === 'weighted' ? ', weighted' : academics.scale === 'unweighted' ? ', unweighted' : ''}
        </p>
        <p>
          Satisfactory academic progress:{' '}
          {academics.sap === 'yes' ? 'Yes' : academics.sap === 'no' ? 'No' : academics.sap === 'unsure' ? 'Not sure' : '—'}
        </p>
        <p className="hint">
          {academics.transcript
            ? `Transcript: ${academics.transcript.name} · ${formatBytes(academics.transcript.size)}`
            : 'No transcript attached.'}
        </p>
        <p className="hint">
          {academics.extraTranscript
            ? `Additional transcript: ${academics.extraTranscript.name} · ${formatBytes(academics.extraTranscript.size)}`
            : 'No additional transcript.'}
        </p>
        {String(academics.gradeNote || '').trim() ? <p>{academics.gradeNote}</p> : null}
        {String(academics.limitations || '').trim() ? <p>{academics.limitations}</p> : null}
        <p>
          HER member:{' '}
          {academics.herMember === 'yes' ? 'Yes' : academics.herMember === 'no' ? 'No' : '—'}
          {academics.herMember === 'yes' && String(academics.chapter || '').trim()
            ? ` · ${String(academics.chapter).trim()}`
            : ''}
        </p>
      </ReviewBlock>

      <ReviewBlock title="Activities" locked={locked} onEdit={() => go('#apply/activities')}>
        {ACTIVITIES.every((activity) => activityItems(activities.entries, activity.id).length === 0) ? (
          <p className="hint">None added.</p>
        ) : null}
        {ACTIVITIES.flatMap((activity) =>
          activityItems(activities.entries, activity.id).map((entry) => (
            <article key={entry.id} className="read-activity">
              <p className="eyebrow">{activityLabel(activity.id)}</p>
              <h4>{entry.title || 'Untitled'}</h4>
              <p>{entry.impact}</p>
            </article>
          )),
        )}
      </ReviewBlock>

      <ReviewBlock title="Links" locked={locked} onEdit={() => go('#apply/links')}>
        {links.length === 0 && <p className="hint">No links added.</p>}
        <ul className="read-links">
          {links.map((link) => (
            <li key={link.id}>
              <span>{linkLabel(link.type)}</span>
              <a href={link.url} target="_blank" rel="noreferrer">
                {link.label || link.url}
              </a>
            </li>
          ))}
        </ul>
      </ReviewBlock>

      <ReviewBlock title="Short takes" locked={locked} onEdit={() => go('#apply/short')}>
        <p className="three-read">{words.length ? words.join(' · ') : '—'}</p>
        <h4>What you intend to study</h4>
        <p>{writing.study || '—'}</p>
        <p className="hint">{wordCount(writing.study)} words</p>
        <div className="read-places">
          {writing.guests.map((guest) => (
            <article key={guest.id}>
              <strong>{guest.name || 'Unnamed guest'}</strong>
              <span>{guest.role}</span>
            </article>
          ))}
        </div>
        <h4>The dinner</h4>
        <p>{writing.dinner || '—'}</p>
        <p className="hint">{wordCount(writing.dinner)} words</p>
        <h4>{MAKE_KINDS.find((item) => item.id === writing.makeKind)?.label || 'Class, artwork, or book'}</h4>
        <p>{writing.make || '—'}</p>
        <p className="hint">{wordCount(writing.make)} words</p>
      </ReviewBlock>

      <ReviewBlock title="Long takes" locked={locked} onEdit={() => go('#apply/long')}>
        <h4>What changed you</h4>
        <p className="essay-read">{writing.changed || '—'}</p>
        <p className="hint">{wordCount(writing.changed)} / {LIMITS.long} words</p>
        <h4>Pairs</h4>
        <p className="essay-read">{writing.pairs || '—'}</p>
        <p className="hint">{wordCount(writing.pairs)} / {LIMITS.long} words</p>
      </ReviewBlock>
    </div>
  );
}
