export const PER_PERSON = 65000;
export const INCOME_CAP = 200000;

export const STORY = [
  {
    kicker: "Why",
    title: "The why.",
    paragraphs: [
      "Her Education Required is a student-led network dedicated to the inclusion of women’s history in social studies curriculum. Beyond advocating for better education on women’s history, we also promote the advancement of high school girls into higher education. Welcome to the Her Education Required Scholarship Fund, a need/merit-based scholarship intended to fund college-level education.",
    ],
  },
  {
    kicker: "Who",
    title: "The who.",
    paragraphs: [
      "This money was raised from hundreds of student fundraisers around the world. HER chapters are dedicated to making the fund a possibility, and to promoting the advancement of high school girls. You can start a chapter at hereducation.org.",
    ],
  },
  {
    kicker: "Application",
    title: "Scholarship application.",
    paragraphs: [
      "Your application responses will be viewed and assessed by student leaders in the HER network. You will be factored into your region/country, and assessed by a student with understanding of that region. We recommend disclosing any barriers that may be specific to your school/district in the application. Your financial need is assessed by an adult, and will not be reviewed by students.",
      "We recommend joining the chapter at your high school, or starting one at hereducation.org.",
    ],
  },
  {
    kicker: "Details",
    title: "Application details.",
    steps: [
      "Round one begins by completing the following application. Round one applications are due January 20th, 2027.",
      "Round two, the scholarship pool is narrowed down to seven applicants, interviews with HER members are organized, and an adult officer verifies financial need with a FAFSA Submission Summary or the first two pages of a tax return, plus the college aid award letter.",
      "HER Scholar is selected in March.",
    ],
  },
];

export function money(value) {
  return Number(value).toLocaleString("en-US");
}

export function householdCount(value) {
  const people = Number(value);
  if (!Number.isFinite(people) || people < 1) return 1;
  return Math.min(12, Math.round(people));
}

export function incomeLine(household) {
  const people = householdCount(household);
  const raw = people * PER_PERSON;
  return {
    people,
    raw,
    line: Math.min(INCOME_CAP, raw),
    capped: raw >= INCOME_CAP,
  };
}

export function qualifies(answers) {
  const income = Number(String(answers.income ?? "").replace(/[^0-9.]/g, ""));
  const math = incomeLine(answers.household);
  const noun = math.people === 1 ? "person" : "people";
  const reasons = [];
  if (answers.grade !== "12") reasons.push("You need to be in 12th grade.");
  if (!Number.isFinite(income) || income >= math.line) {
    reasons.push(
      `Your parents' yearly income needs to be under $${money(math.line)} for ${math.people} ${noun}.`,
    );
  }
  return {
    eligible: reasons.length === 0,
    reasons,
    income: Number.isFinite(income) ? income : null,
    line: math.line,
    people: math.people,
  };
}
