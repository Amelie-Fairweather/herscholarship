import { ACTIVITIES, LIMITS, activityItems, gpaLimit, reportedGpaScale } from './content.js';

export function wordCount(text) {
  const trimmed = String(text || '').trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

function issue(step, field, message) {
  return { step, field, message };
}

function isUrl(value) {
  try {
    const url = new URL(String(value || '').trim());
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function phoneDigits(value) {
  return String(value || '').replace(/\D/g, '');
}

function phoneOk(value) {
  const count = phoneDigits(value).length;
  return count >= 8 && count <= 15;
}

function emailOk(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());
}

function contactProblems(app) {
  const contact = app.contact || {};
  const out = [];
  if (!phoneOk(contact.studentPhone)) out.push(issue('need', 'studentPhone', 'Add your phone number, with the area code.'));
  if (!emailOk(contact.studentEmail)) out.push(issue('need', 'studentEmail', 'Add your email.'));
  if (String(contact.parentName || '').trim().length < 2) {
    out.push(issue('need', 'parentName', 'Add a parent or guardian name.'));
  }
  if (!phoneOk(contact.parentPhone)) out.push(issue('need', 'parentPhone', 'Add a parent or guardian phone number, with the area code.'));
  if (!emailOk(contact.parentEmail)) out.push(issue('need', 'parentEmail', 'Add a parent or guardian email.'));
  return out;
}

function needProblems(app) {
  const out = [...contactProblems(app)];
  const age = String(app.need.age || '').trim();
  if (!age) out.push(issue('need', 'age', 'Add your age.'));
  else if (!/^\d+$/.test(age) || Number(age) < 13 || Number(age) > 100) {
    out.push(issue('need', 'age', 'Enter an age from 13 to 100.'));
  }
  if (!String(app.need.city || '').trim()) out.push(issue('need', 'city', 'Add your city.'));
  if (!String(app.need.region || '').trim()) out.push(issue('need', 'region', 'Add your state or country.'));
  const inCollege = Number(app.need.inCollege);
  const household = Number(app.need.household) || 1;
  if (!Number.isInteger(inCollege) || inCollege < 1 || inCollege > household) {
    out.push(issue('need', 'inCollege', 'Say how many people in the household will be in college next year.'));
  }
  const agi = dollarAmount(app.need.agi);
  if (agi == null) out.push(issue('need', 'agi', 'Add your household’s adjusted gross income from last year’s tax return.'));
  else if (!Number.isFinite(agi) || agi < 0) out.push(issue('need', 'agi', 'Enter the adjusted gross income as a dollar amount.'));
  if (app.need.hasSai !== 'yes' && app.need.hasSai !== 'no') {
    out.push(issue('need', 'hasSai', 'Say whether you have a Student Aid Index from the FAFSA.'));
  }
  if (app.need.hasSai === 'yes') {
    const sai = String(app.need.sai ?? '').trim();
    const value = Number(sai);
    if (!/^-?\d+$/.test(sai) || value < -1500 || value > 999999) {
      out.push(issue('need', 'sai', 'Enter a Student Aid Index from -1,500 to 999,999.'));
    }
  }
  const coa = dollarAmount(app.need.coa);
  if (coa == null) out.push(issue('need', 'coa', 'Add your target school’s annual cost of attendance.'));
  else if (!Number.isFinite(coa) || coa <= 0) out.push(issue('need', 'coa', 'Enter the cost of attendance as a dollar amount.'));
  const aid = dollarAmount(app.need.aid);
  if (aid == null) out.push(issue('need', 'aid', 'Add the grant and scholarship aid you have already been awarded. Use 0 if none.'));
  else if (!Number.isFinite(aid) || aid < 0) out.push(issue('need', 'aid', 'Enter aid already awarded as a dollar amount, or 0.'));
  if (wordCount(app.need.circumstances) > LIMITS.short) {
    out.push(issue('need', 'circumstances', 'Keep special financial circumstances to 100 words.'));
  }
  return out;
}

function dollarAmount(value) {
  const text = String(value ?? '').trim();
  if (!text) return null;
  if (!/^\d+(\.\d{1,2})?$/.test(text)) return NaN;
  return Number(text);
}

function academicProblems(app) {
  const out = [];
  const { scale, gpa, transcript } = app.academics;
  const gpaScale = reportedGpaScale(app.academics);
  if (scale !== 'unweighted' && scale !== 'weighted') {
    out.push(issue('academics', 'scale', 'Say whether the GPA is unweighted or weighted.'));
  }
  if (!gpaScale) {
    out.push(issue('academics', 'gpaScale', 'Choose the scale your GPA is out of.'));
  }
  const max = gpaLimit(gpaScale, scale);
  const value = String(gpa || '').trim();
  if (gpaScale === 'none') {
    if (value) out.push(issue('academics', 'gpa', 'Leave GPA blank when the scale is None.'));
  } else if (gpaScale) {
    const ceiling = max === 100 ? '100' : Number(max).toFixed(2);
    if (!value) out.push(issue('academics', 'gpa', 'Add your current GPA.'));
    else if (!/^\d{1,3}(\.\d{1,2})?$/.test(value) || Number(value) <= 0 || Number(value) > max) {
      out.push(issue('academics', 'gpa', `Enter a GPA above 0 and up to ${ceiling}.`));
    }
  }
  if (!transcript?.path) {
    out.push(issue('academics', 'transcript', 'Attach a transcript, as a PDF or a photo. It uploads with your account.'));
  }
  if (wordCount(app.academics.gradeNote) > LIMITS.short) {
    out.push(issue('academics', 'gradeNote', 'Keep the additional school information to 100 words.'));
  }
  if (wordCount(app.academics.limitations) > LIMITS.short) {
    out.push(issue('academics', 'limitations', 'Keep the limitations answer to 100 words.'));
  }
  if (app.academics.herMember !== 'yes' && app.academics.herMember !== 'no') {
    out.push(issue('academics', 'herMember', 'Say whether you are a HER member.'));
  }
  if (app.academics.herMember === 'yes' && !String(app.academics.chapter || '').trim()) {
    out.push(issue('academics', 'chapter', 'List your chapter name.'));
  }
  if (!['yes', 'no', 'unsure'].includes(app.academics.sap)) {
    out.push(issue('academics', 'sap', 'Say whether you are meeting satisfactory academic progress.'));
  }
  return out;
}

function activityProblems(app) {
  const out = [];
  let total = 0;
  ACTIVITIES.forEach((activity) => {
    const list = activityItems(app.activities.entries, activity.id);
    total += list.length;
    list.forEach((entry) => {
      if (!entry.title.trim()) {
        out.push(issue('activities', `title-${activity.id}-${entry.id}`, 'Name each activity you add.'));
      }
      if (!entry.impact.trim()) {
        out.push(issue('activities', `impact-${activity.id}-${entry.id}`, 'Add a statement of impact for each activity.'));
      } else if (entry.impact.length > LIMITS.impact) {
        out.push(issue('activities', `impact-${activity.id}-${entry.id}`, 'Keep each statement of impact to 150 characters.'));
      }
    });
  });
  if (total === 0) {
    out.push(issue('activities', 'selected', 'Add at least one activity. Each area holds up to four.'));
  }
  return out;
}

function linkProblems(app) {
  return (app.links || []).flatMap((link) => {
    if (!String(link.url || '').trim()) return [issue('links', link.id, 'Add a URL, or remove the empty link.')];
    if (!isUrl(link.url)) return [issue('links', link.id, 'Use a full link, starting with https://.')];
    return [];
  });
}

function shortProblems(app) {
  const writing = app.writing;
  const out = [];
  const words = (writing.threeWords || []).map((word) => String(word || '').trim()).filter(Boolean);
  if (words.length !== 3) out.push(issue('short', 'words', 'Give exactly three words.'));
  if (!String(writing.study || '').trim()) {
    out.push(issue('short', 'study', 'Say what you intend to study, and why.'));
  } else if (wordCount(writing.study) > LIMITS.short) {
    out.push(issue('short', 'study', 'Keep the study answer to 100 words.'));
  }
  const guests = writing.guests || [];
  if (guests.length === 0) out.push(issue('short', 'guests', 'Invite at least one guest. Three is the maximum.'));
  if (guests.length > 3) out.push(issue('short', 'guests', 'Invite three guests at most.'));
  guests.forEach((guest, index) => {
    const label = `Guest ${index + 1}`;
    if (!String(guest.name || '').trim()) out.push(issue('short', `guest-${guest.id}`, `${label} needs a name.`));
    if (!String(guest.role || '').trim()) {
      out.push(issue('short', `role-${guest.id}`, `${label} needs a career or role tied to women’s rights.`));
    }
  });
  if (!String(writing.dinner || '').trim()) {
    out.push(issue('short', 'dinner', 'Write what you would talk about, and why you invited them.'));
  } else if (wordCount(writing.dinner) > LIMITS.short) {
    out.push(issue('short', 'dinner', 'Keep the dinner-party answer to 100 words.'));
  }
  if (!writing.makeKind) out.push(issue('short', 'makeKind', 'Choose a class, an artwork, or a book.'));
  if (!String(writing.make || '').trim()) {
    out.push(issue('short', 'make', 'Say what you would teach or create, and why.'));
  } else if (wordCount(writing.make) > LIMITS.short) {
    out.push(issue('short', 'make', 'Keep this answer to 100 words.'));
  }
  return out;
}

function longProblems(app) {
  const out = [];
  if (!String(app.writing.changed || '').trim()) {
    out.push(issue('long', 'changed', 'Write about what changed the way you think.'));
  } else if (wordCount(app.writing.changed) > LIMITS.long) {
    out.push(issue('long', 'changed', 'Keep this long take to 550 words.'));
  }
  if (!String(app.writing.pairs || '').trim()) out.push(issue('long', 'pairs', 'Write the pairs essay.'));
  else if (wordCount(app.writing.pairs) > LIMITS.long) {
    out.push(issue('long', 'pairs', 'Keep the pairs essay to 550 words.'));
  }
  return out;
}

const CONTENT_STEPS = ['need', 'academics', 'activities', 'links', 'short', 'long'];

export function problemsFor(step, app) {
  switch (step) {
    case 'need':
      return needProblems(app);
    case 'academics':
      return academicProblems(app);
    case 'activities':
      return activityProblems(app);
    case 'links':
      return linkProblems(app);
    case 'short':
      return shortProblems(app);
    case 'long':
      return longProblems(app);
    case 'review':
      return CONTENT_STEPS.flatMap((id) => problemsFor(id, app));
    default:
      return [];
  }
}

export function readyCount(app) {
  const openedLinks = (app.meta.visited || []).includes('links') || (app.links || []).length > 0;
  return CONTENT_STEPS.filter((step) => {
    if (problemsFor(step, app).length > 0) return false;
    if (step === 'links' && !openedLinks) return false;
    return true;
  }).length;
}

export function isStarted(app) {
  const { contact, need, academics, activities, links, writing, meta } = app;
  const reach = contact || {};
  return Boolean(
    meta.submittedAt ||
      meta.sample ||
      (meta.visited && meta.visited.length) ||
      reach.studentPhone ||
      reach.studentEmail ||
      reach.parentName ||
      reach.parentPhone ||
      reach.parentEmail ||
      need.age ||
      need.city ||
      need.region ||
      String(need.agi || '').trim() ||
      need.hasSai ||
      String(need.sai || '').trim() ||
      String(need.coa || '').trim() ||
      String(need.aid || '').trim() ||
      need.pell ||
      need.snap ||
      need.firstGen ||
      String(need.circumstances || '').trim() ||
      Number(need.household) !== 1 ||
      Number(need.inCollege) !== 1 ||
      academics.scale ||
      academics.gpaScale ||
      academics.gpa ||
      academics.transcript ||
      academics.extraTranscript ||
      String(academics.gradeNote || '').trim() ||
      String(academics.limitations || '').trim() ||
      academics.herMember ||
      String(academics.chapter || '').trim() ||
      academics.sap ||
      ACTIVITIES.some((activity) => activityItems(activities.entries, activity.id).length) ||
      links.length ||
      writing.threeWords.some((word) => String(word || '').trim()) ||
      writing.study ||
      writing.guests.length ||
      writing.dinner ||
      writing.makeKind ||
      writing.make ||
      writing.changed ||
      writing.pairs,
  );
}

export function unmetNeed(need) {
  const coa = dollarAmount(need?.coa);
  const aid = dollarAmount(need?.aid);
  if (!Number.isFinite(coa) || !Number.isFinite(aid)) return null;
  return Math.max(0, Math.round(coa - aid));
}

export function needContext(need) {
  const unmet = unmetNeed(need);
  if (unmet == null) return null;
  const people = Number(need?.household) || 1;
  const college = Math.min(people, Math.max(1, Number(need?.inCollege) || 1));
  const peopleNoun = people === 1 ? 'person' : 'people';
  const collegeNoun = college === 1 ? 'person' : 'people';
  return {
    title: `$${unmet.toLocaleString('en-US')} unmet`,
    copy: `Cost of attendance minus aid already awarded. ${people} ${peopleNoun} in the household, ${college} ${collegeNoun} in college next year. An adult checks this against a FAFSA Submission Summary or tax return before the award.`,
  };
}

export function continueHash(app) {
  if (app.meta.submittedAt) return '#apply/done';
  const next = CONTENT_STEPS.find((step) => problemsFor(step, app).length > 0);
  return `#apply/${next || 'review'}`;
}
