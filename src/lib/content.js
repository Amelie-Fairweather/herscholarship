export const LIMITS = {
  impact: 150,
  short: 100,
  long: 550,
};

export const GPA_SCALES = [
  ...Array.from({ length: 17 }, (_, index) => {
    const value = String(index + 4);
    return { value, label: `${value}.0` };
  }),
  { value: '100', label: '100' },
  { value: 'none', label: 'None' },
];

export function gpaScaleLabel(value) {
  return GPA_SCALES.find((item) => item.value === value)?.label || '';
}

export function reportedGpaScale(academics) {
  if (typeof academics?.gpaScale === 'string') return academics.gpaScale;
  return '4';
}

export function gpaLimit(gpaScale, weighting) {
  if (!gpaScale || gpaScale === 'none') return null;
  const base = Number(gpaScale);
  if (!Number.isFinite(base) || base <= 0) return null;
  if (base >= 100) return 100;
  return weighting === 'weighted' ? base + 1 : base;
}

export const STEPS = [
  { id: 'need', label: 'Financial need', short: 'Need', detail: 'Contact, household income, and Student Aid Index' },
  { id: 'academics', label: 'Academics', short: 'Academics', detail: 'GPA, satisfactory academic progress, and the transcript' },
  { id: 'activities', label: 'Activities', short: 'Activities', detail: 'Up to four in each area' },
  { id: 'links', label: 'Links', short: 'Links', detail: 'Website, LinkedIn, news, or Instagram' },
  { id: 'short', label: 'Short takes', short: 'Short', detail: 'Three words, then 100-word answers' },
  { id: 'long', label: 'Long takes', short: 'Long', detail: 'Two essays, 550 words each' },
  { id: 'review', label: 'Review', short: 'Review', detail: 'Read the file, then submit' },
];

export const SAP_OPTIONS = [
  { id: 'yes', label: 'Yes', copy: 'I am meeting satisfactory academic progress.' },
  { id: 'no', label: 'No', copy: 'I am not meeting it.' },
  { id: 'unsure', label: 'Not sure', copy: 'I have not confirmed it yet.' },
];

export const ACTIVITIES = [
  {
    id: 'school',
    label: 'School based',
    hint: 'A team, a publication, a class project, or a role on campus.',
  },
  {
    id: 'community',
    label: 'Community based',
    hint: 'Work with neighbors, a cultural group, or a local effort.',
  },
  {
    id: 'volunteer',
    label: 'Volunteer based',
    hint: 'Time given to an organization or a cause.',
  },
  {
    id: 'employment',
    label: 'Employment based',
    hint: 'A job, an internship, or paid responsibility.',
  },
  {
    id: 'family',
    label: 'Family / wellbeing',
    hint: 'Care, translation, a household you run, or looking after someone.',
  },
];

export const LINK_TYPES = [
  { id: 'website', label: 'Website', placeholder: 'https://' },
  { id: 'linkedin', label: 'LinkedIn', placeholder: 'https://www.linkedin.com/in/' },
  { id: 'news', label: 'News coverage', placeholder: 'https://' },
  { id: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/' },
];

export const MAKE_KINDS = [
  { id: 'class', label: 'Teach a class', prompt: 'What would you teach, and why?' },
  { id: 'art', label: 'Create a piece of artwork', prompt: 'What would you make, and why?' },
  { id: 'book', label: 'Write a book', prompt: 'What would you write, and why?' },
];

export const EXAMPLES = [
  {
    id: 'salt',
    title: 'Salt and pepper shakers',
    body: 'Salt and pepper sit on almost every kitchen table as an inseparable pair, but they carry completely different expectations. Salt is treated as the quiet, essential background ingredient, while pepper is expected to bring the heat. Common gender stereotypes put women and men in that same pair: women as salt, keeping things running and staying subtle, and men as pepper, bold and at the center. Feminism argues that human traits are not hardcoded into table shakers. Anyone can be as quiet or as bold as they choose.',
  },
  {
    id: 'wipers',
    title: 'Windshield wipers',
    body: 'Windshield wipers move as a matching pair, clearing rain so a driver can see. A woman named Mary Anderson invented the windshield wiper in 1903. Critics at the time called the invention useless and distracting. Today every car relies on that pair of blades. It is a reminder of how often women’s contributions to ordinary technology were overlooked when they were new.',
  },
  {
    id: 'shoes',
    title: 'Left and right shoes',
    body: 'Left and right shoes look nearly identical. Force a right shoe onto a left foot and it does not fit. Double standards work the same way. The same act — being direct or ambitious at work — is called confidence in a man and bossy in a woman. Two identical behaviors are shoved into different boxes.',
  },
];

export const ROUNDS = [
  {
    id: 'round-1',
    kicker: 'Round 1',
    title: 'The file opens',
    dates: 'Nov 1, 2026 – Jan 15, 2027',
    state: 'Open now',
    body: 'One application holds the whole file: need, academics, activities, links, and writing. Submit when it is complete. A submitted file waits here until a reader posts the next status.',
  },
  {
    id: 'round-2',
    kicker: 'Round 2',
    title: 'Two readers',
    dates: 'Jan 16 – Feb 27, 2027',
    state: 'Next',
    body: 'Two readers take the file together. Need is read beside the writing. When a file moves forward, or stops, that status is posted on the board.',
  },
  {
    id: 'round-3',
    kicker: 'Round 3',
    title: 'Finalists',
    dates: 'March 2027',
    state: 'Upcoming',
    body: 'Finalists have a short conversation. The agenda is the application already written. There is no separate essay in this round.',
  },
  {
    id: 'decision',
    kicker: 'Decision',
    title: 'The award',
    dates: 'April 6, 2027',
    state: 'Upcoming',
    body: 'The $10,000 decision is posted on this page the morning letters go out. Every file ends with a status: awarded, or not advanced.',
  },
];

export const STATUS_META = {
  draft: { label: 'Draft', tone: 'muted' },
  submitted: { label: 'Submitted', tone: 'rose' },
  in_review: { label: 'In review', tone: 'gold' },
  round_2: { label: 'Advanced to Round 2', tone: 'rose' },
  finalist: { label: 'Finalist', tone: 'gold' },
  awarded: { label: 'Awarded', tone: 'good' },
  not_advanced: { label: 'Not advanced', tone: 'muted' },
};

export const MOVES = {
  submitted: [
    {
      status: 'in_review',
      label: 'Post “In review”',
      round: 'Round 1',
      note: 'Two readers have the file. A decision has not been posted.',
    },
  ],
  in_review: [
    {
      status: 'round_2',
      label: 'Advance to Round 2',
      round: 'Round 2',
      note: 'The file moved to Round 2. Both readers are staying with it.',
    },
    {
      status: 'not_advanced',
      label: 'Do not advance',
      round: 'Round 1',
      note: 'The file will not move past Round 1 this cycle.',
    },
  ],
  round_2: [
    {
      status: 'finalist',
      label: 'Name as finalist',
      round: 'Round 3',
      note: 'The file is a finalist. The next step is a conversation, using the application already written.',
    },
    {
      status: 'not_advanced',
      label: 'Do not advance',
      round: 'Round 2',
      note: 'The file will not move past Round 2 this cycle.',
    },
  ],
  finalist: [
    {
      status: 'awarded',
      label: 'Award $10,000',
      round: 'Decision',
      note: 'The $10,000 award is posted. A letter follows this status.',
    },
    {
      status: 'not_advanced',
      label: 'Close without the award',
      round: 'Decision',
      note: 'The file reached the final round and will not receive the award this cycle.',
    },
  ],
};

export function stageLabel(status) {
  if (status === 'submitted' || status === 'in_review') return 'Round 1';
  if (status === 'round_2') return 'Round 2';
  if (status === 'finalist') return 'Round 3';
  if (status === 'awarded' || status === 'not_advanced') return 'Decision';
  return 'Draft';
}

export function emptyApplication() {
  return {
    contact: {
      studentPhone: '',
      studentEmail: '',
      parentName: '',
      parentPhone: '',
      parentEmail: '',
    },
    need: {
      age: '',
      city: '',
      region: '',
      household: 1,
      inCollege: 1,
      agi: '',
      hasSai: '',
      sai: '',
      coa: '',
      aid: '',
      pell: false,
      snap: false,
      firstGen: false,
      circumstances: '',
    },
    academics: {
      scale: '',
      gpaScale: '',
      gpa: '',
      transcript: null,
      extraTranscript: null,
      gradeNote: '',
      limitations: '',
      herMember: '',
      chapter: '',
      sap: '',
    },
    activities: {
      entries: {
        school: [],
        community: [],
        volunteer: [],
        employment: [],
        family: [],
      },
    },
    links: [],
    writing: {
      threeWords: ['', '', ''],
      study: '',
      guests: [],
      dinner: '',
      makeKind: '',
      make: '',
      changed: '',
      pairs: '',
    },
    meta: {
      applicationId: null,
      submittedAt: null,
      status: 'draft',
      history: [],
      visited: [],
      sample: false,
    },
  };
}

export function sampleApplication() {
  const base = emptyApplication();
  return {
    ...base,
    need: {
      age: '17',
      city: 'El Paso',
      region: 'Texas',
      household: 5,
      inCollege: 1,
      agi: '42000',
      hasSai: 'yes',
      sai: '1200',
      coa: '28000',
      aid: '8000',
      pell: true,
      snap: false,
      firstGen: true,
      circumstances: 'A parent was out of work for four months after surgery.',
    },
    academics: {
      scale: 'unweighted',
      gpaScale: '4',
      gpa: '3.72',
      transcript: {
        name: 'Marisol-A-transcript.pdf',
        size: 248331,
        type: 'application/pdf',
      },
      extraTranscript: null,
      gradeNote: 'Junior-year chemistry was regraded after the lab. The updated mark is on the transcript.',
      limitations: 'I missed six weeks of sophomore year for surgery. The incomplete became a B.',
      herMember: 'yes',
      chapter: 'El Paso High',
      sap: 'yes',
    },
    activities: {
      entries: {
        school: [
          {
            id: 'sample-school',
            title: 'Debate captain',
            impact:
              'I opened novice debate so younger students could compete without already knowing the club. Twelve finished the season.',
          },
        ],
        volunteer: [
          {
            id: 'sample-volunteer',
            title: 'Saturday library holds',
            impact:
              'I shelve holds on Saturdays and call patrons when their books arrive. Most are older and do not use the app.',
          },
        ],
        family: [
          {
            id: 'sample-family',
            title: 'Care for my brother',
            impact:
              'I get my brother to school and the clinic, and I translate the forms. Homework starts after that, around nine.',
          },
        ],
      },
    },
    links: [
      {
        id: 'sample-news',
        type: 'news',
        url: 'https://example.com/el-paso-debate-novices',
        label: 'Local story on novice debate',
      },
      {
        id: 'sample-ig',
        type: 'instagram',
        url: 'https://instagram.com/marisol.reads',
        label: 'Notes from the books I finish',
      },
    ],
    writing: {
      threeWords: ['Steady', 'Curious', 'Blunt'],
      study:
        'I want to study public health. My little brother uses an inhaler, and the clinic that helps us is forty minutes away. I am good at chemistry, but the reason is the waiting room, and the lab comes second. I want training that puts care closer to people who already qualify for it and still cannot reach it.',
      guests: [
        { id: 'g1', name: 'Mary Anderson', role: 'Inventor of the windshield wiper' },
        { id: 'g2', name: 'Phyllis Schlafly', role: 'Organizer against the Equal Rights Amendment' },
        { id: 'g3', name: 'bell hooks', role: 'Writer and teacher' },
      ],
      dinner:
        'I would sit Mary Anderson beside Phyllis Schlafly and ask what each of them means by protection. Anderson made a tool people mocked, then every driver needed it. Schlafly organized against the Equal Rights Amendment and called that stance a shield. bell hooks would take the third chair and ask who the shield was for. I invited the argument, and the person who would keep it honest.',
      makeKind: 'class',
      make:
        'I would teach a college class called Ordinary Patents. We would start with a kitchen and a car and ask who made the objects, who got paid, and who was written out. The course is practice in noticing when a story skips a person, and in putting that person back at the table.',
      changed:
        'The first time I read the Combahee River Collective Statement, I thought it would be a document I could admire from a distance. It was written in 1977 by Black feminists who were tired of being told to wait their turn by movements that wanted their labor and not their full lives. What changed me was a sentence I had been telling myself. I treated my life as roles that were supposed to take turns: student, daughter, worker, girl. The statement refuses the line. It says the people who stand in several places at once are not a special interest added at the end. They are the point. I started noticing where I split myself to make a room comfortable. At school I talked about grades and left the inhaler, the bus fare, and my mother’s shift off the page. The statement did not hand me a personality. It handed me permission to let the whole file exist at once. That is the person I am still becoming: someone who will not cut a life into the piece a form prefers.',
      pairs:
        'Library due-date stamps and the shape of a woman’s week have nothing to do with each other until you hold them up as a pair. A due-date stamp looks neutral. Everyone gets the same two weeks. That sameness is the trick. A student who works after school and takes a younger sibling to the clinic loses the book to a fine, while a student with a quiet evening renews it on the way home. The rule was identical. The lives were not. Women’s studies has spent decades on this kind of pair: a policy written as universal, and a woman whose time was already spoken for by paid work and by care. The fine is a few dollars. The idea underneath it is old. Equal time on paper can still bill the person who had less time to begin with. I think about that whenever a rule is praised because it treats everyone the same.',
    },
    meta: {
      ...base.meta,
      sample: true,
      visited: STEPS.map((step) => step.id),
    },
  };
}

export function seedBoard() {
  return {
    announcements: [
      {
        id: 'open-2027',
        at: '2026-11-01T15:00:00.000Z',
        round: 'Round 1',
        title: 'Applications are open',
        body: 'Round 1 is live through January 15, 2027. Start a file, save it, and submit when it is complete. Each time a file moves, the status is posted here.',
      },
      {
        id: 'how-to-read',
        at: '2026-11-08T16:00:00.000Z',
        round: 'Round 1',
        title: 'How to read a status',
        body: 'Submitted means the file is in. In review means two readers have it. Advanced means it moved to the next round. Awarded and not advanced are final for the cycle.',
      },
      {
        id: 'last-decision',
        at: '2026-04-06T15:00:00.000Z',
        round: 'Decision',
        title: 'Last cycle’s decisions were posted',
        body: 'The April 2026 award went up on this page the morning the letters went out. Those files stay visible so this cycle can see the whole path.',
      },
    ],
    files: [
      {
        id: 'HER-2204',
        name: 'Elena V.',
        place: 'El Paso, TX',
        cycle: 'current',
        status: 'in_review',
        history: [
          {
            at: '2026-11-02T15:00:00.000Z',
            status: 'submitted',
            round: 'Round 1',
            note: 'Application submitted. Readers have not opened it yet.',
          },
          {
            at: '2026-11-06T18:10:00.000Z',
            status: 'in_review',
            round: 'Round 1',
            note: 'Two readers have the file. A decision has not been posted.',
          },
        ],
      },
      {
        id: 'HER-2188',
        name: 'Priya S.',
        place: 'Queens, NY',
        cycle: 'current',
        status: 'submitted',
        history: [
          {
            at: '2026-11-09T20:12:00.000Z',
            status: 'submitted',
            round: 'Round 1',
            note: 'Application submitted. Readers have not opened it yet.',
          },
        ],
      },
      {
        id: 'HER-2175',
        name: 'Camille R.',
        place: 'New Orleans, LA',
        cycle: 'current',
        status: 'submitted',
        history: [
          {
            at: '2026-11-10T14:40:00.000Z',
            status: 'submitted',
            round: 'Round 1',
            note: 'Application submitted. Readers have not opened it yet.',
          },
        ],
      },
      {
        id: 'HER-3011',
        name: 'Noor A.',
        place: 'Dearborn, MI',
        cycle: 'last',
        status: 'not_advanced',
        history: [
          {
            at: '2026-01-14T15:00:00.000Z',
            status: 'submitted',
            round: 'Round 1',
            note: 'Application submitted.',
          },
          {
            at: '2026-01-28T15:00:00.000Z',
            status: 'in_review',
            round: 'Round 1',
            note: 'Two readers have the file.',
          },
          {
            at: '2026-02-20T15:00:00.000Z',
            status: 'not_advanced',
            round: 'Round 2',
            note: 'The file will not move past Round 2 this cycle.',
          },
        ],
      },
      {
        id: 'HER-3004',
        name: 'June P.',
        place: 'Oakland, CA',
        cycle: 'last',
        status: 'awarded',
        history: [
          {
            at: '2026-01-12T15:00:00.000Z',
            status: 'submitted',
            round: 'Round 1',
            note: 'Application submitted.',
          },
          {
            at: '2026-01-22T15:00:00.000Z',
            status: 'in_review',
            round: 'Round 1',
            note: 'Two readers have the file.',
          },
          {
            at: '2026-02-14T15:00:00.000Z',
            status: 'round_2',
            round: 'Round 2',
            note: 'The file moved to Round 2.',
          },
          {
            at: '2026-03-08T15:00:00.000Z',
            status: 'finalist',
            round: 'Round 3',
            note: 'Named a finalist. The conversation used the file already written.',
          },
          {
            at: '2026-04-06T15:00:00.000Z',
            status: 'awarded',
            round: 'Decision',
            note: 'The $10,000 award is posted.',
          },
        ],
      },
    ],
  };
}

export function prettyWhen(iso, withTime = false) {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString(
    'en-US',
    withTime
      ? { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }
      : { month: 'short', day: 'numeric', year: 'numeric' },
  );
}

export function formatBytes(size) {
  if (size == null || Number.isNaN(size)) return '';
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export const ACTIVITY_LIMIT = 4;

export function activityItems(entries, id) {
  const raw = entries?.[id];
  const list = Array.isArray(raw) ? raw : raw && typeof raw === 'object' ? [raw] : [];
  return list.slice(0, ACTIVITY_LIMIT).map((item, index) => ({
    id: String(item?.id || `${id}-${index}`),
    title: String(item?.title || ''),
    impact: String(item?.impact || ''),
  }));
}

export function activityLabel(id) {
  return ACTIVITIES.find((item) => item.id === id)?.label || id;
}

export function linkLabel(id) {
  return LINK_TYPES.find((item) => item.id === id)?.label || 'Link';
}
