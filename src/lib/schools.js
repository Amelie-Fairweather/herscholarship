const PUBLIC_SCHOOLS =
  "https://nces.ed.gov/opengis/rest/services/K12_School_Locations/EDGE_GEOCODE_PUBLICSCH_2425/MapServer/0/query";
const PRIVATE_SCHOOLS =
  "https://nces.ed.gov/opengis/rest/services/K12_School_Locations/EDGE_GEOCODE_PRIVATESCH_2324/MapServer/0/query";

const STATES = new Set([
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "DC", "FL", "GA", "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA",
  "ME", "MD", "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ", "NM", "NY", "NC", "ND", "OH", "OK", "OR",
  "PA", "RI", "SC", "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY", "PR", "GU", "VI", "AS", "MP",
]);

const HIGH_WORDS = ["HIGH", "SECONDARY", "SENIOR", "ACADEMY", "PREPARATORY", "PREP", "COLLEGIATE"];

export function titleCase(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/(^|[\s\-/'’.])([a-z])/g, (_, lead, letter) => `${lead}${letter.toUpperCase()}`)
    .replace(/\b(Of|And|The|For|At|In|De|Du)\b/g, (word, _group, offset) => (offset > 0 ? word.toLowerCase() : word));
}

function escapeLike(value) {
  return value.toUpperCase().replace(/[%_]/g, "").replace(/'/g, "''").slice(0, 60);
}

export function parseSchoolQuery(raw) {
  const cleaned = String(raw || "").trim().replace(/\s+/g, " ");
  const match = cleaned.match(/^(.*?)(?:,\s*|\s+)([A-Za-z]{2})$/);
  if (match && STATES.has(match[2].toUpperCase()) && match[1].trim()) {
    return { name: match[1].trim(), state: match[2].toUpperCase() };
  }
  return { name: cleaned, state: "" };
}

function whereFor(name, state, highOnly) {
  const like = `UPPER(NAME) LIKE '%${escapeLike(name)}%'`;
  const stateClause = state ? ` AND STATE = '${state}'` : "";
  const high = highOnly ? ` AND (${HIGH_WORDS.map((word) => `UPPER(NAME) LIKE '%${word}%'`).join(" OR ")})` : "";
  return `${like}${stateClause}${high}`;
}

async function fetchLayer(url, where, idField, kind, signal) {
  const params = new URLSearchParams({
    where,
    outFields: `NAME,CITY,STATE,${idField}`,
    returnGeometry: "false",
    orderByFields: "NAME",
    resultRecordCount: "8",
    f: "json",
  });
  const response = await fetch(`${url}?${params}`, { signal });
  if (!response.ok) throw new Error("directory");
  const data = await response.json();
  if (data.error) throw new Error("directory");
  return (data.features || []).map((feature) => {
    const row = feature.attributes || {};
    return {
      id: `${kind}:${row[idField]}`,
      name: titleCase(row.NAME),
      city: titleCase(String(row.CITY || "").trim()),
      state: String(row.STATE || "").trim(),
      kind,
    };
  });
}

function merge(rows, name) {
  const seen = new Set();
  const unique = [];
  const query = name.toUpperCase();
  rows.forEach((row) => {
    if (!row.id || seen.has(row.id) || !row.name) return;
    seen.add(row.id);
    unique.push(row);
  });
  unique.sort((a, b) => relevance(a.name, query) - relevance(b.name, query) || a.name.localeCompare(b.name));
  return unique.slice(0, 8);
}

function relevance(school, query) {
  const name = school.toUpperCase();
  if (name === query) return 0;
  if (name.startsWith(query)) return 1;
  if (name.includes(` ${query}`)) return 2;
  return 3;
}

export async function searchHighSchools(raw, signal) {
  const { name, state } = parseSchoolQuery(raw);
  if (name.length < 3) return [];
  const [publicStrict, privateStrict] = await Promise.all([
    fetchLayer(PUBLIC_SCHOOLS, whereFor(name, state, true), "NCESSCH", "Public", signal),
    fetchLayer(PRIVATE_SCHOOLS, whereFor(name, state, true), "PPIN", "Private", signal),
  ]);
  let rows = merge([...publicStrict, ...privateStrict], name);
  if (rows.length >= 4) return rows;
  const [publicBroad, privateBroad] = await Promise.all([
    fetchLayer(PUBLIC_SCHOOLS, whereFor(name, state, false), "NCESSCH", "Public", signal),
    fetchLayer(PRIVATE_SCHOOLS, whereFor(name, state, false), "PPIN", "Private", signal),
  ]);
  return merge([...rows, ...publicBroad, ...privateBroad], name);
}
