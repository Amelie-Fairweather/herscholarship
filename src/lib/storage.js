import { useCallback, useEffect, useRef, useState } from 'react';
import { ACTIVITIES, activityItems, emptyApplication, seedBoard } from './content.js';
import { accountFromUser, quizFromUser, supabase } from './supabase.js';

const APP_KEY = 'her.application.v1';
const BOARD_KEY = 'her.board.v1';

export function uid() {
  return Math.random().toString(36).slice(2, 10);
}

export function fileId() {
  return `HER-${Math.floor(1000 + Math.random() * 9000)}`;
}

function loadRaw(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function mergeApp(saved) {
  const base = emptyApplication();
  if (!saved || typeof saved !== 'object') return base;
  const writing = saved.writing || {};
  return {
    contact: { ...base.contact, ...(saved.contact || {}) },
    need: { ...base.need, ...(saved.need || {}) },
    academics: {
      ...base.academics,
      ...(saved.academics || {}),
      transcript: saved.academics?.transcript || null,
    },
    activities: {
      entries: Object.fromEntries(
        ACTIVITIES.map((activity) => [activity.id, activityItems(saved.activities?.entries, activity.id)]),
      ),
    },
    links: Array.isArray(saved.links) ? saved.links : [],
    writing: {
      ...base.writing,
      ...writing,
      threeWords: [0, 1, 2].map((index) => String((writing.threeWords || [])[index] || '')),
      guests: Array.isArray(writing.guests) ? writing.guests : [],
    },
    meta: {
      ...base.meta,
      ...(saved.meta || {}),
      history: Array.isArray(saved.meta?.history) ? saved.meta.history : [],
      visited: Array.isArray(saved.meta?.visited) ? saved.meta.visited : [],
    },
  };
}

function mergeBoard(saved) {
  if (!saved || !Array.isArray(saved.files) || !Array.isArray(saved.announcements)) return seedBoard();
  return { files: saved.files, announcements: saved.announcements };
}

function usePersisted(key, normalize, fallback) {
  const [pack, setPack] = useState(() => {
    const loaded = loadRaw(key);
    if (!loaded) return { savedAt: null, data: fallback() };
    return { savedAt: loaded.savedAt || null, data: normalize(loaded.data) };
  });
  const serial = useRef(JSON.stringify(pack.data));

  useEffect(() => {
    const next = JSON.stringify(pack.data);
    if (next === serial.current) return undefined;
    const handle = setTimeout(() => {
      const savedAt = new Date().toISOString();
      try {
        localStorage.setItem(key, JSON.stringify({ savedAt, data: pack.data }));
      } catch {
        /* The draft stays in memory if this browser refuses more storage. */
      }
      serial.current = next;
      setPack((current) => ({ ...current, savedAt }));
    }, 180);
    return () => clearTimeout(handle);
  }, [key, pack.data]);

  const setData = useCallback((update) => {
    setPack((current) => {
      const data = typeof update === 'function' ? update(current.data) : update;
      return { ...current, data };
    });
  }, []);

  return [pack.data, setData, pack.savedAt];
}

export function useApplication() {
  return usePersisted(APP_KEY, mergeApp, emptyApplication);
}

export function useBoard() {
  return usePersisted(BOARD_KEY, mergeBoard, seedBoard);
}

const SESSION_KEY = "her.session.v1";

function newerQuiz(onAccount, onThisBrowser) {
  if (!onAccount) return onThisBrowser;
  if (!onThisBrowser) return onAccount;
  return String(onThisBrowser.savedAt || "") > String(onAccount.savedAt || "") ? onThisBrowser : onAccount;
}

function emptySession() {
  return { accounts: [], currentId: null, quizzes: {} };
}

function mergeSession(saved) {
  if (!saved || !Array.isArray(saved.accounts)) return emptySession();
  return {
    accounts: saved.accounts,
    currentId: saved.currentId || null,
    quizzes: saved.quizzes && typeof saved.quizzes === "object" ? saved.quizzes : {},
  };
}

export function useSession() {
  const [data, setData] = usePersisted(SESSION_KEY, mergeSession, emptySession);
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [readerKind, setReaderKind] = useState(null);
  const [readerReady, setReaderReady] = useState(false);
  const [readerError, setReaderError] = useState('');

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data: result }) => {
      if (!active) return;
      setUser(result.session?.user ?? null);
      setAuthReady(true);
    });
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setAuthReady(true);
    });
    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!authReady) return undefined;
    if (!user?.email) {
      setReaderKind(null);
      setReaderError('');
      setReaderReady(true);
      return undefined;
    }
    let active = true;
    setReaderReady(false);
    supabase
      .from('readers')
      .select('kind')
      .eq('email', user.email.toLowerCase())
      .maybeSingle()
      .then(({ data, error }) => {
        if (!active) return;
        if (error && /relation|schema cache|could not find/i.test(error.message || '')) setReaderError('missing');
        else setReaderError('');
        setReaderKind(data?.kind === 'adult' || data?.kind === 'student' ? data.kind : null);
        setReaderReady(true);
      })
      .catch(() => {
        if (!active) return;
        setReaderKind(null);
        setReaderReady(true);
      });
    return () => {
      active = false;
    };
  }, [authReady, user]);

  const account = authReady ? accountFromUser(user) : null;
  const onAccount = quizFromUser(user);
  const onThisBrowser = account ? data.quizzes[account.id] || null : null;
  const quiz = newerQuiz(onAccount, onThisBrowser);
  return {
    account,
    quiz,
    eligible: Boolean(quiz?.eligible),
    setSession: setData,
    authReady,
    readerKind,
    readerReady,
    readerError,
  };
}
