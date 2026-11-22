import { useEffect, useRef, useState } from 'react';
import { ACTIVITIES, activityItems, emptyApplication, stageLabel } from './content.js';
import { evaluateNeed } from './needScore.js';
import { supabase } from './supabase.js';
import { isStarted } from './validate.js';

const CONTACT_KEYS = ['studentPhone', 'studentEmail', 'parentName', 'parentPhone', 'parentEmail'];

const NEED_KEYS = [
  'age',
  'city',
  'region',
  'household',
  'inCollege',
  'agi',
  'hasSai',
  'sai',
  'coa',
  'aid',
  'pell',
  'snap',
  'firstGen',
  'circumstances',
];

let tail = Promise.resolve();

function enqueue(task) {
  const run = tail.then(task, task);
  tail = run.then(
    () => {},
    () => {},
  );
  return run;
}

function fileMeta(file) {
  if (!file || typeof file !== 'object') return null;
  if (!file.name && !file.path) return null;
  return {
    name: String(file.name || ''),
    size: Number(file.size) || 0,
    type: String(file.type || ''),
    path: String(file.path || ''),
  };
}

function pickContact(contact) {
  const base = emptyApplication().contact;
  const limits = { studentPhone: 22, studentEmail: 120, parentName: 80, parentPhone: 22, parentEmail: 120 };
  const next = { ...base };
  CONTACT_KEYS.forEach((key) => {
    if (contact && contact[key] != null) next[key] = String(contact[key]).trim().slice(0, limits[key]);
  });
  return next;
}

function pickNeed(need) {
  const base = emptyApplication().need;
  const next = { ...base };
  NEED_KEYS.forEach((key) => {
    if (need && need[key] != null) next[key] = need[key];
  });
  return next;
}

function historyFrom(body, events) {
  const posted = (events || []).map((event) => ({
    at: event.created_at,
    status: event.status,
    round: stageLabel(event.status),
    note: event.note || '',
  }));
  const earlier = Array.isArray(body?.history) ? body.history : [];
  if (!posted.length) return earlier;
  const submit = earlier.find((item) => item.status === 'submitted');
  return submit ? [submit, ...posted] : posted;
}

export function applicationFromRemote(row, need, events, fallbackNeed, contact, fallbackContact) {
  const base = emptyApplication();
  const body = row?.body && typeof row.body === 'object' ? row.body : {};
  const writing = body.writing || {};
  return {
    contact: contact && typeof contact === 'object' ? pickContact(contact) : fallbackContact || base.contact,
    need: need && typeof need === 'object' ? { ...base.need, ...pickNeed(need) } : fallbackNeed || base.need,
    academics: {
      ...base.academics,
      ...(body.academics || {}),
      transcript: fileMeta(body.academics?.transcript),
      extraTranscript: fileMeta(body.academics?.extraTranscript),
    },
    activities: {
      entries: Object.fromEntries(
        ACTIVITIES.map((activity) => [activity.id, activityItems(body.activities?.entries, activity.id)]),
      ),
    },
    links: Array.isArray(body.links) ? body.links : [],
    writing: {
      ...base.writing,
      ...writing,
      threeWords: [0, 1, 2].map((index) => String((writing.threeWords || [])[index] || '')),
      guests: Array.isArray(writing.guests) ? writing.guests : [],
    },
    meta: {
      ...base.meta,
      applicationId: row?.file_number || null,
      submittedAt: row?.submitted_at || null,
      status: row?.status || 'draft',
      history: historyFrom(body, events),
      visited: Array.isArray(body.visited) ? body.visited : [],
      sample: false,
    },
  };
}

function payload(account, application, quiz) {
  const need = pickNeed(application.need);
  const contact = pickContact(application.contact);
  const academics = {
    ...application.academics,
    transcript: fileMeta(application.academics?.transcript),
    extraTranscript: fileMeta(application.academics?.extraTranscript),
  };
  return {
    row: {
      user_id: account.id,
      file_number: application.meta.applicationId || '',
      status: application.meta.status || 'draft',
      submitted_at: application.meta.submittedAt,
      applicant_name: account.name || '',
      place: [need.city, need.region].filter(Boolean).join(', '),
      body: {
        profile: { age: need.age, city: need.city, region: need.region },
        academics,
        activities: application.activities,
        links: application.links,
        writing: application.writing,
        school: quiz
          ? {
              name: quiz.school || '',
              city: quiz.schoolCity || '',
              state: quiz.schoolState || '',
            }
          : null,
        history: application.meta.history || [],
        visited: application.meta.visited || [],
        evaluation: (() => {
          const result = evaluateNeed(need);
          return { tier: result.tier, score: result.score };
        })(),
      },
    },
    need,
    contact,
  };
}

export function explainSaveError(error) {
  const message = String(error?.message || '');
  if (/student and parent contact/i.test(message)) {
    return 'Add the student and parent contact, then submit again.';
  }
  if (/this file is submitted/i.test(message)) {
    return 'This file is already submitted. Reload the page to see the saved copy.';
  }
  if (/application_contact|submit_application/i.test(message)) {
    return 'Run the database setup again so phone numbers are saved with each application. Your answers are still in this browser.';
  }
  if (/relation|schema cache|could not find the table|bucket/i.test(message)) {
    return 'The application database is not set up yet. Your answers are still saved in this browser.';
  }
  return 'Saved in this browser. It has not reached your account yet.';
}

export async function pushApplication(account, application, quiz) {
  if (!account?.id) return { error: new Error('Sign in again before sending the file.') };
  const packed = payload(account, application, quiz);
  if ((application.meta.status || 'draft') !== 'draft') {
    const { data, error } = await supabase.rpc('submit_application', {
      next_file_number: packed.row.file_number,
      next_name: packed.row.applicant_name,
      next_place: packed.row.place,
      next_body: packed.row.body,
      next_need: packed.need,
      next_contact: packed.contact,
    });
    if (error) return { error };
    const row = data && typeof data === 'object' ? data : {};
    return {
      error: null,
      row: {
        status: row.status || 'submitted',
        submitted_at: row.submitted_at || application.meta.submittedAt,
        file_number: row.file_number || packed.row.file_number,
      },
    };
  }
  const { data, error } = await supabase
    .from('applications')
    .upsert(packed.row, { onConflict: 'user_id' })
    .select('status, submitted_at, file_number')
    .single();
  if (error) return { error };
  const { error: needError } = await supabase
    .from('application_need')
    .upsert({ user_id: account.id, need: packed.need }, { onConflict: 'user_id' });
  if (needError) return { error: needError };
  const { error: contactError } = await supabase.from('application_contact').upsert(
    { user_id: account.id, contact: packed.contact, updated_at: new Date().toISOString() },
    { onConflict: 'user_id' },
  );
  if (contactError) return { error: contactError };
  return { error: null, row: data };
}

export function pushQueued(account, application, quiz) {
  return enqueue(() => pushApplication(account, application, quiz));
}

export async function loadOwn(userId) {
  const [appRes, needRes, contactRes, eventRes] = await Promise.all([
    supabase.from('applications').select('*').eq('user_id', userId).maybeSingle(),
    supabase.from('application_need').select('need').eq('user_id', userId).maybeSingle(),
    supabase.from('application_contact').select('contact').eq('user_id', userId).maybeSingle(),
    supabase.from('status_events').select('status, note, created_at').eq('applicant_id', userId).order('created_at'),
  ]);
  if (appRes.error) return { error: appRes.error, row: null, need: null, contact: null, events: [] };
  return {
    error: contactRes.error || null,
    row: appRes.data,
    need: needRes.error ? null : needRes.data?.need || null,
    contact: contactRes.error ? null : contactRes.data?.contact || null,
    events: eventRes.data || [],
  };
}

export async function loadStatus(userId) {
  const [appRes, eventRes] = await Promise.all([
    supabase.from('applications').select('status, submitted_at, file_number, body').eq('user_id', userId).maybeSingle(),
    supabase.from('status_events').select('status, note, created_at').eq('applicant_id', userId).order('created_at'),
  ]);
  if (appRes.error || !appRes.data) return { error: appRes.error || null };
  return {
    error: null,
    status: appRes.data.status,
    submittedAt: appRes.data.submitted_at,
    fileNumber: appRes.data.file_number,
    history: historyFrom(appRes.data.body || {}, eventRes.data || []),
  };
}

const TRANSCRIPT_TYPES = {
  'application/pdf': 'pdf',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

export function transcriptType(file) {
  const type = String(file?.type || '').toLowerCase();
  if (type === 'image/jpg' || type === 'image/pjpeg') return 'image/jpeg';
  if (TRANSCRIPT_TYPES[type]) return type;
  const name = String(file?.name || '');
  if (/\.pdf$/i.test(name)) return 'application/pdf';
  if (/\.png$/i.test(name)) return 'image/png';
  if (/\.jpe?g$/i.test(name)) return 'image/jpeg';
  if (/\.webp$/i.test(name)) return 'image/webp';
  return '';
}

export function uploadFailure(error) {
  const message = String(error?.message || '');
  if (/mime type/i.test(message)) return 'Send a PDF, JPG, or PNG under 10 MB.';
  if (/exceeded|too large|payload/i.test(message)) return 'Keep the transcript under 10 MB.';
  if (/bucket not found/i.test(message)) return 'Transcript storage is not available yet.';
  if (/row-level security|unauthorized|access denied/i.test(message)) {
    return 'The transcript could not be saved with your account. Sign out, sign back in, and choose the file again.';
  }
  return message
    ? `The transcript could not be uploaded. ${message}`
    : 'The transcript could not be uploaded. Your other answers are still saved in this browser.';
}

export async function uploadTranscript(userId, key, file) {
  const contentType = transcriptType(file);
  if (!contentType) return { error: new Error('Send a PDF or a photo of the transcript.'), path: '' };
  const ext = TRANSCRIPT_TYPES[contentType];
  const safeName = String(file.name || `transcript.${ext}`)
    .replace(/[^\w.\-() ]+/g, '')
    .slice(-80);
  const path = `${userId}/${key}/${safeName || `transcript.${ext}`}`;
  const body = file.type === contentType ? file : new File([file], safeName || `transcript.${ext}`, { type: contentType });
  let { error } = await supabase.storage.from('transcripts').upload(path, body, {
    contentType,
    upsert: false,
  });
  if (error && /already exists|duplicate/i.test(String(error.message || ''))) {
    await supabase.storage.from('transcripts').remove([path]);
    ({ error } = await supabase.storage.from('transcripts').upload(path, body, {
      contentType,
      upsert: false,
    }));
  }
  if (error) return { error, path: '' };
  return { error: null, path };
}

export async function removeTranscript(path) {
  if (!path) return { error: null };
  const { error } = await supabase.storage.from('transcripts').remove([path]);
  return { error };
}

export async function transcriptUrl(path) {
  if (!path) return '';
  const { data, error } = await supabase.storage.from('transcripts').createSignedUrl(path, 60 * 30);
  if (error) return '';
  return data?.signedUrl || '';
}

export function useCloudApplication({ account, quiz, application, setApplication, savedAt }) {
  const [phase, setPhase] = useState('local');
  const [message, setMessage] = useState('');
  const [cloudOn, setCloudOn] = useState(false);
  const savedAtRef = useRef(savedAt);
  const applicationRef = useRef(application);
  const quizRef = useRef(quiz);
  const accountRef = useRef(account);
  const lastPushed = useRef('');
  savedAtRef.current = savedAt;
  applicationRef.current = application;
  quizRef.current = quiz;
  accountRef.current = account;

  useEffect(() => {
    if (!account?.id) {
      setCloudOn(false);
      setPhase('local');
      setMessage('');
      return undefined;
    }
    let cancel = false;
    setCloudOn(false);
    setPhase('loading');
    setMessage('');
    loadOwn(account.id).then((remote) => {
      if (cancel) return;
      const local = applicationRef.current;
      if (remote.row) {
        const remoteLocked = remote.row.status && remote.row.status !== 'draft';
        const remoteAt = remote.row.updated_at || '';
        const localAt = savedAtRef.current || '';
        if (remoteLocked || local.meta.status !== 'draft' || !localAt || remoteAt > localAt) {
          const next = applicationFromRemote(
            remote.row,
            remote.need,
            remote.events,
            local.need,
            remote.contact,
            local.contact,
          );
          lastPushed.current = JSON.stringify(next);
          setApplication(next);
        }
      }
      if (remote.error) {
        setMessage(explainSaveError(remote.error));
        setPhase('error');
      } else {
        setPhase('local');
      }
      setCloudOn(true);
    });
    return () => {
      cancel = true;
    };
  }, [account?.id, setApplication]);

  useEffect(() => {
    if (!cloudOn || !account?.id) return undefined;
    const snapshot = application;
    const serial = JSON.stringify(snapshot);
    if ((snapshot.meta.status || 'draft') !== 'draft') return undefined;
    if (serial === lastPushed.current) return undefined;
    if (!isStarted(snapshot) && snapshot.meta.status === 'draft') {
      setPhase('local');
      return undefined;
    }
    const handle = setTimeout(() => {
      setPhase('saving');
      pushQueued(accountRef.current, snapshot, quizRef.current).then((result) => {
        if (JSON.stringify(applicationRef.current) !== serial) return;
        if (result.error) {
          setPhase('error');
          setMessage(explainSaveError(result.error));
          return;
        }
        lastPushed.current = serial;
        setPhase('saved');
        setMessage('');
        if (result.row && result.row.status !== snapshot.meta.status) {
          setApplication((current) => ({
            ...current,
            meta: {
              ...current.meta,
              status: result.row.status,
              submittedAt: result.row.submitted_at,
              applicationId: result.row.file_number || current.meta.applicationId,
            },
          }));
        }
      });
    }, 800);
    return () => clearTimeout(handle);
  }, [application, cloudOn, account?.id, setApplication]);

  useEffect(() => {
    if (!cloudOn || !account?.id) return undefined;
    if (!application.meta.status || application.meta.status === 'draft') return undefined;
    let active = true;
    async function pull() {
      const fresh = await loadStatus(account.id);
      if (!active || fresh.error || !fresh.status) return;
      setApplication((current) => {
        if (current.meta.status === 'draft') return current;
        if (current.meta.status === fresh.status && current.meta.submittedAt === fresh.submittedAt) return current;
        return {
          ...current,
          meta: {
            ...current.meta,
            status: fresh.status,
            submittedAt: fresh.submittedAt,
            applicationId: fresh.fileNumber || current.meta.applicationId,
            history: fresh.history,
          },
        };
      });
    }
    pull();
    const timer = setInterval(pull, 20000);
    window.addEventListener('focus', pull);
    return () => {
      active = false;
      clearInterval(timer);
      window.removeEventListener('focus', pull);
    };
  }, [cloudOn, account?.id, application.meta.status, setApplication]);

  return { phase: cloudOn || phase === 'error' ? phase : 'loading', message };
}
