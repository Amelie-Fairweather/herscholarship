// Need level from the answers the application collects: household income, state or
// country, how many people are in college, college cost, gift aid, SNAP, and
// first-generation status. Asset, medical, and school-poverty questions are not
// on the form, so those points are not invented.

const HIGH_COST = 1.12;
const RAISED_COST = 1.06;
const LOWER_COST = 0.92;

const STATE_COST = {
  california: HIGH_COST,
  ca: HIGH_COST,
  hawaii: HIGH_COST,
  hi: HIGH_COST,
  'new york': HIGH_COST,
  ny: HIGH_COST,
  massachusetts: HIGH_COST,
  ma: HIGH_COST,
  'new jersey': HIGH_COST,
  nj: HIGH_COST,
  washington: HIGH_COST,
  wa: HIGH_COST,
  'district of columbia': HIGH_COST,
  dc: HIGH_COST,
  'washington dc': HIGH_COST,
  alaska: RAISED_COST,
  ak: RAISED_COST,
  connecticut: RAISED_COST,
  ct: RAISED_COST,
  maryland: RAISED_COST,
  md: RAISED_COST,
  colorado: RAISED_COST,
  co: RAISED_COST,
  oregon: RAISED_COST,
  or: RAISED_COST,
  'new hampshire': RAISED_COST,
  nh: RAISED_COST,
  virginia: RAISED_COST,
  va: RAISED_COST,
  'rhode island': RAISED_COST,
  ri: RAISED_COST,
  mississippi: LOWER_COST,
  ms: LOWER_COST,
  arkansas: LOWER_COST,
  ar: LOWER_COST,
  alabama: LOWER_COST,
  al: LOWER_COST,
  'west virginia': LOWER_COST,
  wv: LOWER_COST,
  kentucky: LOWER_COST,
  ky: LOWER_COST,
  oklahoma: LOWER_COST,
  ok: LOWER_COST,
  kansas: LOWER_COST,
  ks: LOWER_COST,
  iowa: LOWER_COST,
  ia: LOWER_COST,
  missouri: LOWER_COST,
  mo: LOWER_COST,
  tennessee: LOWER_COST,
  tn: LOWER_COST,
  indiana: LOWER_COST,
  in: LOWER_COST,
  louisiana: LOWER_COST,
  la: LOWER_COST,
  'south carolina': LOWER_COST,
  sc: LOWER_COST,
  ohio: LOWER_COST,
  oh: LOWER_COST,
  michigan: LOWER_COST,
  mi: LOWER_COST,
  wisconsin: LOWER_COST,
  wi: LOWER_COST,
  'north carolina': LOWER_COST,
  nc: LOWER_COST,
  georgia: LOWER_COST,
  ga: LOWER_COST,
  'new mexico': LOWER_COST,
  nm: LOWER_COST,
  idaho: LOWER_COST,
  id: LOWER_COST,
  montana: LOWER_COST,
  mt: LOWER_COST,
  'north dakota': LOWER_COST,
  nd: LOWER_COST,
  'south dakota': LOWER_COST,
  sd: LOWER_COST,
  nebraska: LOWER_COST,
  ne: LOWER_COST,
  wyoming: LOWER_COST,
  wy: LOWER_COST,
  maine: LOWER_COST,
  me: LOWER_COST,
};

export const NEED_LEVELS = [
  { id: 'high', label: 'High need' },
  { id: 'need', label: 'Need' },
  { id: 'moderate', label: 'Moderate need' },
  { id: 'low', label: 'Low need' },
  { id: 'stable', label: 'Stable' },
];

export const US_READING_REGIONS = ['Northeast', 'Midwest', 'South', 'West'];

const US_REGION_NAMES = {
  Northeast: [
    'connecticut', 'ct', 'maine', 'me', 'massachusetts', 'ma', 'mass', 'new hampshire', 'nh', 'n h',
    'rhode island', 'ri', 'r i', 'vermont', 'vt', 'new jersey', 'nj', 'n j', 'new york', 'ny', 'n y',
    'pennsylvania', 'pa',
  ],
  Midwest: [
    'illinois', 'il', 'indiana', 'in', 'michigan', 'mi', 'ohio', 'oh', 'wisconsin', 'wi', 'iowa', 'ia',
    'kansas', 'ks', 'minnesota', 'mn', 'missouri', 'mo', 'nebraska', 'ne', 'north dakota', 'nd', 'n d',
    'south dakota', 'sd', 's d',
  ],
  South: [
    'delaware', 'de', 'florida', 'fl', 'georgia', 'ga', 'maryland', 'md', 'north carolina', 'nc', 'n c',
    'south carolina', 'sc', 's c', 'virginia', 'va', 'west virginia', 'wv', 'w v', 'alabama', 'al',
    'kentucky', 'ky', 'mississippi', 'ms', 'tennessee', 'tn', 'arkansas', 'ar', 'louisiana', 'la',
    'oklahoma', 'ok', 'texas', 'tx', 'district of columbia', 'dc', 'd c', 'washington dc', 'washington d c',
  ],
  West: [
    'arizona', 'az', 'colorado', 'co', 'idaho', 'id', 'montana', 'mt', 'nevada', 'nv', 'new mexico', 'nm',
    'n m', 'utah', 'ut', 'wyoming', 'wy', 'alaska', 'ak', 'california', 'ca', 'hawaii', 'hi', 'oregon', 'or',
    'washington', 'wa',
  ],
};

const STATE_TO_REGION = Object.fromEntries(
  Object.entries(US_REGION_NAMES).flatMap(([group, names]) => names.map((name) => [name, group])),
);

const TERRITORIES = {
  'puerto rico': 'Puerto Rico',
  pr: 'Puerto Rico',
  guam: 'Guam',
  gu: 'Guam',
  'virgin islands': 'U.S. Virgin Islands',
  'us virgin islands': 'U.S. Virgin Islands',
  'u s virgin islands': 'U.S. Virgin Islands',
  vi: 'U.S. Virgin Islands',
  usvi: 'U.S. Virgin Islands',
  'american samoa': 'American Samoa',
  as: 'American Samoa',
  'northern mariana islands': 'Northern Mariana Islands',
  'northern marianas': 'Northern Mariana Islands',
  mp: 'Northern Mariana Islands',
  cnmi: 'Northern Mariana Islands',
};

const COUNTRY_ALIASES = {
  uk: 'United Kingdom',
  'u k': 'United Kingdom',
  britain: 'United Kingdom',
  'great britain': 'United Kingdom',
  uae: 'United Arab Emirates',
  'republic of georgia': 'Georgia (country)',
  'country of georgia': 'Georgia (country)',
};

function normalizePlace(raw) {
  return String(raw || '')
    .trim()
    .replace(/\./g, '')
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

function labelPlace(value) {
  const small = new Set(['of', 'the', 'and']);
  return value
    .split(' ')
    .map((word, index) => {
      if (index > 0 && small.has(word)) return word;
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
}

export function readingGroup(raw) {
  let text = normalizePlace(raw);
  if (!text) return 'Region not listed';
  text = text.replace(/,\s*(usa|u s a|united states(?: of america)?)$/i, '').trim();
  if (text === 'usa' || text === 'us' || text === 'u s a' || text === 'united states' || text === 'united states of america') {
    return 'United States';
  }
  if (STATE_TO_REGION[text]) return STATE_TO_REGION[text];
  if (TERRITORIES[text]) return TERRITORIES[text];
  if (COUNTRY_ALIASES[text]) return COUNTRY_ALIASES[text];
  return labelPlace(text);
}

export function compareReadingRegions(a, b) {
  const rank = (name) => {
    const index = US_READING_REGIONS.indexOf(name);
    if (index !== -1) return index;
    if (name === 'Region not listed') return 10000;
    return 100;
  };
  const diff = rank(a) - rank(b);
  return diff || a.localeCompare(b);
}

const MEASURED_MAX = 70;

function dollars(value) {
  const number = Number(String(value ?? '').replace(/,/g, ''));
  return Number.isFinite(number) ? number : 0;
}

function stateCost(region) {
  const key = String(region || '')
    .trim()
    .toLowerCase()
    .replace(/\./g, '');
  return STATE_COST[key] || 1;
}

function livingWage(household) {
  const people = Math.min(12, Math.max(1, Math.round(Number(household) || 1)));
  const base = [0, 42000, 62000, 78000, 92000, 104000];
  return people <= 5 ? base[people] : 104000 + (people - 5) * 11000;
}

function incomePoints(ratio) {
  if (ratio <= 0.6) return 35;
  if (ratio <= 1) return 35 - 17.5 * (ratio - 0.6);
  if (ratio <= 1.5) return 28 - 20 * (ratio - 1);
  if (ratio <= 2.25) return 18 - 16 * (ratio - 1.5);
  return Math.max(0, 5 - 5 * (ratio - 2.25));
}

function gapPoints(unmet) {
  if (unmet >= 15000) return 25;
  if (unmet >= 10000) return 20;
  if (unmet >= 6000) return 14;
  if (unmet >= 2500) return 7;
  return 0;
}

export function needLevel(score) {
  if (score >= 80) return NEED_LEVELS[0];
  if (score >= 62) return NEED_LEVELS[1];
  if (score >= 40) return NEED_LEVELS[2];
  if (score >= 20) return NEED_LEVELS[3];
  return NEED_LEVELS[4];
}

export function evaluateNeed(need) {
  const household = Math.min(12, Math.max(1, Number(need?.household) || 1));
  const inCollege = Math.min(household, Math.max(1, Number(need?.inCollege) || 1));
  const multiplier = inCollege >= 3 ? 0.7 : inCollege === 2 ? 0.8 : 1;
  const wage = livingWage(household) * stateCost(need?.region);
  const ratio = wage > 0 ? (dollars(need?.agi) * multiplier) / wage : 0;
  const income = incomePoints(ratio);
  const gap = gapPoints(dollars(need?.coa) - dollars(need?.aid));
  const hardship = need?.snap ? 6 : 0;
  const context = need?.firstGen ? 4 : 0;
  const score = Math.max(0, Math.min(100, Math.round(((income + gap + hardship + context) / MEASURED_MAX) * 100)));
  const level = needLevel(score);
  return { score, tier: level.id, label: level.label };
}

export function applicationRegion(file, need) {
  const region = need?.region || file?.body?.profile?.region;
  if (String(region || '').trim()) return readingGroup(region);
  const place = String(file?.place || '');
  const last = place.split(',').pop()?.trim();
  return last ? readingGroup(last) : 'Region not listed';
}
