import { useEffect, useId, useRef, useState } from "react";
import { parseSchoolQuery, searchHighSchools } from "../lib/schools";

export default function SchoolLookup({ id, school, onPick }) {
  const listId = useId();
  const rootRef = useRef(null);
  const [query, setQuery] = useState(school?.name || "");
  const [selected, setSelected] = useState(school?.id ? school : null);
  const [results, setResults] = useState([]);
  const [status, setStatus] = useState("idle");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    if (!armed) return undefined;
    if (selected && query.trim() === selected.name) return undefined;
    const { name } = parseSchoolQuery(query);
    if (name.length < 3) {
      setResults([]);
      setStatus("idle");
      setOpen(false);
      return undefined;
    }
    setResults([]);
    setStatus("loading");
    setOpen(true);
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setStatus("loading");
      setOpen(true);
      try {
        const rows = await searchHighSchools(query, controller.signal);
        if (controller.signal.aborted) return;
        setResults(rows);
        setActive(0);
        setStatus(rows.length ? "ready" : "empty");
      } catch (error) {
        if (error.name === "AbortError") return;
        setResults([]);
        setStatus("error");
      }
    }, 280);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [armed, query, selected]);

  useEffect(() => {
    function onPointer(event) {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    }
    document.addEventListener("pointerdown", onPointer);
    return () => document.removeEventListener("pointerdown", onPointer);
  }, []);

  function choose(next) {
    setSelected(next);
    setQuery(next.name);
    setOpen(false);
    onPick(next);
  }

  function edit(value) {
    setArmed(true);
    setQuery(value);
    if (selected) {
      setSelected(null);
      onPick(null);
    }
  }

  function onKeyDown(event) {
    if (event.key === "Escape") {
      setOpen(false);
      return;
    }
    if (!open || status === "loading" || !results.length) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((current) => (current + 1) % results.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((current) => (current - 1 + results.length) % results.length);
    } else if (event.key === "Enter") {
      event.preventDefault();
      choose(results[active] || results[0]);
    }
  }

  const showList = open && status !== "idle";

  return (
    <div className="school-lookup" ref={rootRef}>
      <input
        id={id}
        role="combobox"
        aria-expanded={showList}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={showList && results[active] ? `${listId}-${active}` : undefined}
        placeholder="Search by school name"
        autoComplete="off"
        value={query}
        onChange={(event) => edit(event.target.value)}
        onFocus={() => {
          setArmed(true);
          if (results.length || status === "empty" || status === "error" || status === "loading") setOpen(true);
        }}
        onKeyDown={onKeyDown}
      />
      {selected ? (
        <p className="hint school-picked">
          {selected.kind} school · {selected.city}, {selected.state}
        </p>
      ) : (
        <p className="hint">Type at least three letters, then choose your school. Add a state, like “Lincoln, NE”, if several match.</p>
      )}
      {showList ? (
        <ul className="school-results" id={listId} role="listbox">
          {status === "loading" ? <li className="school-note">Looking up schools…</li> : null}
          {status === "error" ? <li className="school-note">The school directory didn’t answer. Try the search again.</li> : null}
          {status === "empty" ? <li className="school-note">No schools match that. Try a shorter name or add the state.</li> : null}
          {results.map((schoolRow, index) => (
            <li key={schoolRow.id}>
              <button
                type="button"
                id={`${listId}-${index}`}
                role="option"
                aria-selected={index === active}
                className={index === active ? "is-active" : ""}
                onMouseEnter={() => setActive(index)}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => choose(schoolRow)}
              >
                <strong>{schoolRow.name}</strong>
                <small>
                  {schoolRow.city}, {schoolRow.state} · {schoolRow.kind}
                </small>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
