import { useState } from "react";
import { Field } from "../components/Bits";
import SchoolLookup from "../components/SchoolLookup";
import { INCOME_CAP, PER_PERSON, incomeLine, money, qualifies } from "../lib/fund";
import { clearApplicationStart, recordApplicationStart } from "../lib/remote";
import { authMessage, supabase } from "../lib/supabase";

const GRADES = [
  ["9", "9th"],
  ["10", "10th"],
  ["11", "11th"],
  ["12", "12th"],
];

const EMPTY = {
  grade: "",
  school: "",
  schoolId: "",
  schoolCity: "",
  schoolState: "",
  schoolKind: "",
  income: "",
  household: 1,
};

export default function Quiz({ go, account, quiz, setSession }) {
  const [form, setForm] = useState(() => ({ ...EMPTY, ...(quiz || {}) }));
  const [errors, setErrors] = useState({});
  const [result, setResult] = useState(() => (quiz ? { eligible: quiz.eligible, reasons: quiz.reasons || [] } : null));
  const [editing, setEditing] = useState(!quiz);
  const [saveError, setSaveError] = useState("");
  const [busy, setBusy] = useState(false);

  const math = incomeLine(form.household);

  function set(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    const next = {};
    if (!form.grade) next.grade = "Choose your grade.";
    if (!form.schoolId) next.school = "Look up your high school and choose it from the list.";
    const income = Number(String(form.income).replace(/[^0-9.]/g, ""));
    if (form.income === "" || !Number.isFinite(income) || income < 0) next.income = "Add your parents' yearly income.";
    setErrors(next);
    setSaveError("");
    if (Object.keys(next).length) return;
    const verdict = qualifies(form);
    const saved = {
      grade: form.grade,
      school: form.school.trim(),
      schoolId: form.schoolId,
      schoolCity: form.schoolCity,
      schoolState: form.schoolState,
      schoolKind: form.schoolKind,
      income: String(Math.round(income)),
      household: form.household,
      eligible: verdict.eligible,
      reasons: verdict.reasons,
      savedAt: new Date().toISOString(),
    };
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ data: { quiz: saved } });
    setBusy(false);
    if (error) {
      setSaveError(authMessage(error));
      return;
    }
    setSession((current) => ({
      ...current,
      quizzes: { ...current.quizzes, [account.id]: saved },
    }));
    if (verdict.eligible) await recordApplicationStart(account);
    else await clearApplicationStart(account.id);
    setResult(verdict);
    setEditing(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (result && !editing) {
    return (
      <div className="page">
        <section className="wrap auth-card result-card">
          {result.eligible ? (
            <>
              <p className="eyebrow">Eligibility</p>
              <h1>Congrats, you passed.</h1>
              <p className="lede">You are a senior and demonstrated necessary financial need.</p>
              <button type="button" className="btn btn-primary" onClick={() => go("#apply/need")}>
                Proceed to application
              </button>
            </>
          ) : (
            <>
              <p className="eyebrow">Eligibility</p>
              <h1>Not this cycle.</h1>
              <p className="lede">The fund can only open the application when every line below is met.</p>
              <ul className="check-list">
                {result.reasons.map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
              </ul>
            </>
          )}
        </section>
      </div>
    );
  }

  return (
    <div className="page">
      <form className="wrap auth-card" onSubmit={submit} noValidate>
        <p className="eyebrow">Eligibility quiz</p>
        <h1>Do you qualify?</h1>
        <p className="lede">
          {`You pass if you are in 12th grade and your parents' yearly income is under $${money(PER_PERSON)} for each person it supports. That line stays under $${money(INCOME_CAP)}.`}
        </p>
        <Field id="quiz-grade" label="Grade" error={errors.grade}>
          <select id="quiz-grade" value={form.grade} onChange={(event) => set("grade", event.target.value)}>
            <option value="">Select your grade</option>
            {GRADES.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </Field>
        <Field id="quiz-school" label="High school" error={errors.school}>
          <SchoolLookup
            id="quiz-school"
            school={
              form.school
                ? { id: form.schoolId, name: form.school, city: form.schoolCity, state: form.schoolState, kind: form.schoolKind }
                : null
            }
            onPick={(next) =>
              setForm((current) => ({
                ...current,
                school: next?.name || "",
                schoolId: next?.id || "",
                schoolCity: next?.city || "",
                schoolState: next?.state || "",
                schoolKind: next?.kind || "",
              }))
            }
          />
        </Field>
        <Field id="quiz-income" label="Parents' yearly income" error={errors.income} hint={`Must be under $${money(math.line)}.`}>
          <input
            id="quiz-income"
            inputMode="numeric"
            value={form.income}
            onChange={(event) => set("income", event.target.value.replace(/[^\d]/g, "").slice(0, 8))}
          />
        </Field>
        <Field label="Number of people supported by that income">
          <div className="stepper">
            <button type="button" aria-label="Fewer people" onClick={() => set("household", Math.max(1, form.household - 1))} disabled={form.household <= 1}>
              −
            </button>
            <strong>{form.household}</strong>
            <button type="button" aria-label="More people" onClick={() => set("household", Math.min(12, Number(form.household) + 1))}>
              +
            </button>
          </div>
          <p className="hint">Including you.</p>
        </Field>
        {saveError ? <p className="field-error">{saveError}</p> : null}
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? "Saving" : "Check eligibility"}
        </button>
      </form>
    </div>
  );
}
