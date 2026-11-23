import { useCallback, useEffect, useState } from "react";
import Nav from "./components/Nav";
import { STEPS } from "./lib/content";
import { useCloudApplication } from "./lib/remote";
import { supabase } from "./lib/supabase";
import { useApplication, useSession } from "./lib/storage";
import Account, { NeedAccount } from "./pages/Account";
import Apply from "./pages/Apply";
import Home from "./pages/Home";
import Quiz from "./pages/Quiz";
import Read from "./pages/Read";
import Story, { SubmittedFund } from "./pages/Story";

const PAGES = ["home", "login", "create", "story", "quiz", "apply", "read"];

function parseRoute() {
  const raw = window.location.hash.replace(/^#/, "") || "home";
  const [page, step] = raw.split("/");
  if (page === "apply") return { page: "apply", step: step || "need" };
  if (PAGES.includes(page)) return { page, step: "" };
  return { page: "home", step: "" };
}

function scrollTop() {
  const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
  window.scrollTo({ top: 0, behavior });
}

export default function App() {
  const [route, setRoute] = useState(parseRoute);
  const [open, setOpen] = useState(false);
  const [application, setApplication, savedAt] = useApplication();
  const { account, quiz, eligible, setSession, readerKind, readerReady, readerError } = useSession();
  const cloud = useCloudApplication({ account, quiz, application, setApplication, savedAt });

  const go = useCallback((hash) => {
    const next = hash.startsWith("#") ? hash : `#${hash}`;
    if (window.location.hash === next) scrollTop();
    else window.location.hash = next;
    setOpen(false);
  }, []);

  useEffect(() => {
    const onChange = () => setRoute(parseRoute());
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);

  useEffect(() => {
    scrollTop();
    const titles = {
      home: "Her Education Required",
      login: "Log in · Her Education Required",
      create: "Create account · Her Education Required",
      story: "The scholarship fund · Her Education Required",
      quiz: "Eligibility · Her Education Required",
      apply: "Application · Her Education Required",
      read: "Reading desk · Her Education Required",
    };
    document.title = titles[route.page] || "Her Education Required";
  }, [route.page, route.step]);

  useEffect(() => {
    if (route.page !== "apply") return undefined;
    if (!STEPS.some((item) => item.id === route.step)) return undefined;
    setApplication((current) => {
      const visited = current.meta.visited || [];
      if (visited.includes(route.step)) return current;
      return { ...current, meta: { ...current.meta, visited: [...visited, route.step] } };
    });
    return undefined;
  }, [route.page, route.step, setApplication]);

  async function logout() {
    await supabase.auth.signOut();
    go("#home");
  }

  let screen = null;
  const submitted = Boolean(application.meta.submittedAt);
  if (route.page === "home") screen = <Home go={go} account={account} submitted={submitted} />;
  else if (route.page === "login" || route.page === "create") {
    screen = (
      <Account mode={route.page} go={go} account={account} />
    );
  } else if (route.page === "story") {
    screen = !account ? (
      <NeedAccount
        go={go}
        title="Create an account to open the fund."
        copy="The flip-through is for seniors who have an account."
      />
    ) : submitted ? (
      <SubmittedFund go={go} application={application} />
    ) : (
      <Story go={go} />
    );
  } else if (route.page === "quiz") {
    screen = account ? (
      <Quiz go={go} account={account} quiz={quiz} setSession={setSession} />
    ) : (
      <NeedAccount go={go} title="Create an account before the quiz." copy="The quiz opens after a 12th grade account." />
    );
  } else if (route.page === "apply") {
    screen = !account ? (
      <NeedAccount go={go} title="Create an account before the application." copy="Seniors sign up, pass the quiz, then start the file." />
    ) : !eligible ? (
      <NeedAccount
        go={go}
        title="The application opens after you pass."
        copy="Take the eligibility quiz first. If you pass, the application opens."
        primary="Take eligibility quiz"
        primaryTo="#quiz"
        secondary="Back to the fund"
        secondaryTo="#story"
      />
    ) : (
      <Apply
        step={route.step}
        go={go}
        application={application}
        setApplication={setApplication}
        savedAt={savedAt}
        account={account}
        quiz={quiz}
        cloud={cloud}
      />
    );
  } else if (route.page === "read") {
    screen = !account ? (
      <NeedAccount
        go={go}
        title="Readers sign in to open the desk."
        copy="This page is for people reading applications. Students apply from their own account."
      />
    ) : !readerReady ? (
      <div className="page">
        <section className="wrap page-head">
          <h1>Reading desk.</h1>
          <p className="lede">Checking your account.</p>
        </section>
      </div>
    ) : readerError === 'missing' ? (
      <div className="page">
        <section className="wrap page-head">
          <h1>Reading desk.</h1>
          <p className="lede">The reading desk is not connected to the database yet.</p>
        </section>
      </div>
    ) : !readerKind ? (
      <NeedAccount
        go={go}
        title="This desk is for readers."
        copy="Your account can apply. Reading opens only for people the fund adds as readers."
        primary="Back home"
        primaryTo="#home"
        secondary=""
      />
    ) : (
      <Read account={account} readerKind={readerKind} />
    );
  }

  return (
    <>
      <Nav go={go} open={open} setOpen={setOpen} account={account} readerKind={readerKind} onLogout={logout} />
      <main id="main">{screen}</main>
    </>
  );
}
