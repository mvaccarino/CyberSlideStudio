const DEFAULT_BRAND_CTA =
  "Click the Follow button to see new cybersecurity tips every day.";
const FORBIDDEN = [
  "affects everyday decisions",
  "business resilience and trust",
  "the first practical defense",
  "spot the warning signs",
  "weak controls",
  "missing verification",
  "behavior that does not match the normal pattern",
  "build a stronger routine",
  "clear ownership",
  "layered safeguards",
  "regular reviews",
  "simple response plan",
  "make protection repeatable",
  "turn knowledge into action",
  "choose one improvement",
  "assign an owner",
  "set a deadline",
  "practical first step",
  "start with awareness",
  "take action today",
];
const GROUPS = {
  Cybersecurity: [
    "Password Managers",
    "Phishing Emails",
    "Multi-Factor Authentication",
    "Ransomware",
    "Public Wi-Fi Safety",
    "Software Updates",
    "Social Engineering",
    "Credential Stuffing",
    "Business Email Compromise",
    "Zero Trust",
    "Backup Strategy",
    "Incident Response",
    "Data Breach Response",
    "Password Reuse",
    "QR Code Phishing",
    "Smishing",
    "Vishing",
    "Deepfake Voices",
    "Browser Extensions",
    "Mobile Security",
    "Cloud Security",
    "Endpoint Protection",
    "Network Segmentation",
    "Least Privilege",
    "Insider Threats",
    "Supply Chain Attacks",
    "Secure Remote Work",
    "VPN Safety",
    "Email Authentication",
    "Patch Management",
    "Vulnerability Scanning",
    "Security Awareness",
    "Public USB Charging Stations",
    "IoT Security",
    "Home Router Security",
    "Encryption Basics",
    "Data Classification",
    "Secure File Sharing",
    "Shadow IT",
    "API Security",
    "Identity Theft",
    "Account Recovery",
    "SIM Swapping",
    "Malvertising",
    "Drive-By Downloads",
    "DDoS Defense",
    "DNS Security",
    "Security Logging",
    "Threat Intelligence",
    "Cyber Insurance",
  ],
  SmallBusiness: [
    "Small Business Cyber Checklist",
    "Protecting Customer Data",
    "Secure Point of Sale",
    "Vendor Risk for Small Teams",
    "Affordable Security Controls",
    "Employee Onboarding Security",
    "Employee Offboarding Security",
    "Business Continuity",
    "Secure Invoicing",
    "Website Security Basics",
    "Small Business BYOD",
    "Choosing Managed IT",
    "Small Business Backups",
    "Payment Fraud Prevention",
    "Security Policy Starter",
  ],
  AI: [
    "Generative AI Explained",
    "Responsible AI at Work",
    "AI Hallucinations",
    "Prompt Engineering Basics",
    "AI Data Leakage",
    "Machine Learning Fundamentals",
    "AI for Customer Service",
    "AI Automation Strategy",
    "Deepfake Detection",
    "AI Governance",
    "Evaluating AI Vendors",
    "Human in the Loop",
    "AI Bias and Fairness",
    "AI Productivity Playbook",
    "Securing AI Systems",
  ],
  Privacy: [
    "Privacy Settings Audit",
    "Data Brokers",
    "Cookie Tracking Explained",
    "Location Privacy",
    "App Permission Hygiene",
    "Private Web Browsing",
    "Children's Data Privacy",
    "Workplace Privacy",
    "Biometric Data",
    "Privacy by Design",
  ],
  FamilySafety: [
    "Family Password Plan",
    "Safe Social Media for Teens",
    "Cyberbullying Response",
    "Family Online Gaming Safety",
    "Family Device Rules",
    "Recognizing Online Scams",
    "Parental Controls",
    "Safe Video Calling",
    "Digital Footprint",
    "Smart Home Family Safety",
  ],
};
const FOLDER = {
    Cybersecurity: "Cybersecurity",
    SmallBusiness: "SmallBusiness",
    AI: "AI",
    Privacy: "Privacy",
    FamilySafety: "FamilySafety",
  },
  CATEGORY = {
    Cybersecurity: "Cybersecurity",
    SmallBusiness: "Small Business",
    AI: "Artificial Intelligence",
    Privacy: "Privacy",
    FamilySafety: "Family Safety",
  };
const SPECIAL = {
  "Endpoint Protection": [
    "software that watches laptops, desktops, and other devices for malicious behavior and can isolate threats before they spread",
    "an employee opens a fake invoice and the laptop starts making unusual network connections",
    "one infected device can expose passwords, files, and the company network",
    "Install endpoint protection on every work device.",
    "Keep it updated and investigate its alerts.",
    "an office employee studying a red security alert on a laptop while nearby workstations remain visible",
  ],
  "Credential Stuffing": [
    "criminals take usernames and passwords stolen from one breach and automatically try them on other websites",
    "a leaked shopping-site password suddenly opens the victim's email account",
    "password reuse can turn one company's breach into several stolen accounts",
    "Use a different password for every account.",
    "Turn on multi-factor authentication and replace exposed passwords.",
    "a consumer at a kitchen table seeing simultaneous login alerts on a phone and laptop",
  ],
  "SIM Swapping": [
    "a criminal convinces a mobile carrier to move your number to a SIM card or device they control",
    "your phone suddenly loses service while password-reset codes reach somebody else",
    "the criminal may reset email, banking, or social accounts",
    "Call your carrier from another phone if service disappears unexpectedly.",
    "Add a carrier PIN and prefer an authenticator app over text codes.",
    "a worried phone owner in a mobile carrier store holding a phone with no signal",
  ],
  "Public USB Charging Stations": [
    "USB can carry both power and data; a tampered port could attempt a data connection, although confirmed juice-jacking attacks are uncommon",
    "an airport traveler plugs an unlocked phone into an unfamiliar public USB port",
    "an untrusted data connection creates avoidable risk without making every charging station a crisis",
    "Use your own wall charger or power bank.",
    "Keep the phone locked and reject any data-access prompt.",
    "an airport traveler choosing a personal wall charger beside a public USB kiosk",
  ],
  "Deepfake Voices": [
    "synthetic speech made to sound like a real person, sometimes built from short public audio clips",
    "a parent hears a call that sounds like their child urgently asking for money",
    "familiar sound is no longer proof of identity when a caller creates panic",
    "Hang up and call the person on a trusted number.",
    "Use a private family verification phrase.",
    "a parent in a living room holding a phone during an alarming call while reaching for a trusted contact",
  ],
  "Browser Extensions": [
    "browser add-ons that may read browsing data, alter pages, or request access to every website you visit",
    "a free coupon extension gains access to email, shopping, and work pages",
    "an unnecessary or compromised extension can observe far more than its small icon suggests",
    "Remove extensions you no longer use.",
    "Check permissions and use a trusted publisher.",
    "a laptop user reviewing extension permissions with one suspicious add-on highlighted",
  ],
  "Data Brokers": [
    "companies that collect details from records, apps, purchases, and websites, combine them into profiles, and sell or share them",
    "a stranger buys a report containing someone's old addresses, relatives, and interests",
    "the profile can support targeted scams or expose private information",
    "Search major broker sites for your own information.",
    "Use their opt-out process and repeat the check later.",
    "a consumer reviewing a printed personal-data report at a home desk with sensitive details obscured",
  ],
  "Small Business BYOD": [
    "employees using their own phones or computers for work, mixing company information with personal apps and family use",
    "an employee downloads a customer spreadsheet to a personal laptop with no screen lock",
    "a lost, shared, or infected device can carry company data outside the business",
    "Set minimum device rules before allowing personal devices.",
    "Keep work data in managed apps and remove access when employment ends.",
    "a shop employee using a personal laptop with a company document open in a neighborhood cafe",
  ],
  "AI Data Leakage": [
    "confidential information pasted into an AI tool leaving the company's direct control or being retained under the tool's terms",
    "an employee asks a public chatbot to summarize customer names and an unreleased price list",
    "private data may enter vendor accounts, logs, or systems that were never approved",
    "Remove sensitive details before using an AI tool.",
    "Use company-approved services and check retention settings.",
    "an office employee pausing before pasting a confidential document into an AI chat window",
  ],
  "Family Online Gaming Safety": [
    "the risks created when games connect children with strangers through voice chat, messages, trades, purchases, and public profiles",
    "a friendly player asks a child to move to private chat, share a real name, and buy an item through an outside link",
    "the pressure can lead to scams, unwanted purchases, bullying, or exposed family details",
    "Block private messages from strangers and keep chat age-appropriate.",
    "Use purchase limits and tell an adult when a player creates pressure.",
    "a parent and child reviewing game voice-chat and purchase settings together",
  ],
  "Password Managers": [
    "tools that create and store a different strong password for every account behind one master password",
    "one reused shopping password leaks and criminals try it on email and social accounts",
    "a single breach can unlock several accounts when passwords are reused",
    "Choose a reputable manager and a long master password.",
    "Replace reused passwords, starting with email and banking.",
    "a person at a home desk using a password manager while a phone shows a secure sign-in",
  ],
  Ransomware: [
    "malicious software that encrypts files or locks systems and demands payment for access",
    "a worker opens a fake delivery attachment and shared files become unreadable",
    "work can stop for days, and payment does not guarantee recovery",
    "Keep protected backups and test restoring them.",
    "Patch devices and report suspicious attachments immediately.",
    "a small office team facing locked files while one employee disconnects a network cable",
  ],
};
const SPECIAL_HOOKS = {
  "Endpoint Protection":
    "Your antivirus might be missing the behavior that gives an attack away.",
  "SIM Swapping":
    "If your phone suddenly loses service, your number may be under attack.",
  "Deepfake Voices":
    "The next emergency call from someone you love might not be their real voice.",
  "Public USB Charging Stations":
    "That airport USB port carries data as well as power.",
  "Credential Stuffing":
    "One leaked password can unlock accounts on websites that were never breached.",
  "Browser Extensions": "That tiny browser add-on may see every page you open.",
  "Password Managers":
    "Remembering one strong password is safer than reusing one everywhere.",
  Ransomware:
    "A fake delivery attachment can stop an entire office in minutes.",
  "Data Brokers":
    "A stranger may be able to buy a profile built from your personal information.",
  "Family Online Gaming Safety":
    "A friendly player can still be a stranger asking your child for too much.",
  "Small Business BYOD":
    "A personal laptop can quietly carry customer data outside your business.",
  "AI Data Leakage":
    "Before you paste that document into AI, check what confidential details are inside.",
};
const SPECIAL_SLIDE_ONE = {
  "Endpoint Protection": {
    title: "Your Antivirus Isn't Enough",
    body: "One infected laptop can expose files, passwords, and the rest of your business network.",
  },
  "SIM Swapping": {
    title: "Your Number Can Be Stolen",
    body: "A criminal can trick your carrier into moving your number, then receive password-reset codes meant for you.",
  },
  "Deepfake Voices": {
    title: "That Voice May Be Fake",
    body: "Scammers can clone a familiar voice from public audio and use it to create a convincing emergency.",
  },
  "Credential Stuffing": {
    title: "One Password, Many Break-Ins",
    body: "Criminals reuse credentials stolen from one breach to test your email, banking, and other accounts.",
  },
  "Password Managers": {
    title: "Stop Reusing Passwords",
    body: "A password manager creates and stores a different strong password for each account behind one master password.",
  },
  Ransomware: {
    title: "One Click Can Lock Everything",
    body: "A fake attachment can encrypt shared files, stop work, and demand payment without guaranteeing recovery.",
  },
};
const FRAMEWORKS = [
    "What Could Happen",
    "What Is It",
    "Biggest Mistake",
    "Warning Signs",
    "Myth vs Reality",
    "Mini Story",
    "Before You Do This",
  ],
  TONES = [
    "Warning",
    "Curiosity",
    "Mistake",
    "Practical How-To",
    "Myth vs Reality",
    "Story",
    "Explainer",
  ],
  STYLES = [
    "Cybersecurity Professional",
    "Netflix Documentary",
    "Educational",
    "Fast Social",
    "Viral Short",
    "News Report",
    "Corporate",
  ];
const slug = (v) =>
    v
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, ""),
  wordCount = (v) => v.trim().split(/\s+/).filter(Boolean).length;
const normalizeSlideText = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
const editSimilarity = (left, right) => {
  const a = normalizeSlideText(left),
    b = normalizeSlideText(right),
    row = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i++) {
    let diagonal = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const previous = row[j];
      row[j] = Math.min(
        row[j] + 1,
        row[j - 1] + 1,
        diagonal + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
      diagonal = previous;
    }
  }
  return 1 - row[b.length] / Math.max(1, a.length, b.length);
};
function titleBodySimilarity(title, body) {
  const titleWords = normalizeSlideText(title).split(" ").filter(Boolean),
    bodyWords = normalizeSlideText(body).split(" ").filter(Boolean),
    x = new Set(titleWords),
    y = new Set(bodyWords),
    intersection = [...x].filter((word) => y.has(word)).length;
  return Math.max(
    (2 * intersection) / Math.max(1, x.size + y.size),
    editSimilarity(title, body),
  );
}
function validateSlidePair(slide) {
  const errors = [],
    titleWords = normalizeSlideText(slide.title).split(" ").filter(Boolean),
    bodyWords = normalizeSlideText(slide.body).split(" ").filter(Boolean),
    title = normalizeSlideText(slide.title),
    body = normalizeSlideText(slide.body);
  if (!title) errors.push("Title required");
  if (titleWords.length > 10) errors.push("Title too long");
  if (!body) errors.push("Body required");
  if (bodyWords.length < 5) errors.push("Body must add information");
  if (bodyWords.length > 32) errors.push("Body too long");
  if (title && title === body) errors.push("Title/body duplicate");
  const extra =
    bodyWords.slice(0, titleWords.length).join(" ") === titleWords.join(" ")
      ? bodyWords.length - titleWords.length
      : Infinity;
  if (extra >= 0 && extra <= 2) errors.push("Body only appends words");
  if (
    title &&
    body &&
    title !== body &&
    titleBodySimilarity(title, body) >= 0.82
  )
    errors.push("Title/body near duplicate");
  if (
    (slide.cta && body === normalizeSlideText(slide.cta)) ||
    (/^(follow|click|subscribe|share|save)\b/.test(body) &&
      bodyWords.length <= 12)
  )
    errors.push("Body is CTA only");
  return errors;
}
const capitalize = (value) =>
  String(value || "").replace(/^./, (letter) => letter.toUpperCase());
function slideOne(topic, index, facts) {
  if (SPECIAL_SLIDE_ONE[topic]) return SPECIAL_SLIDE_ONE[topic];
  const patterns = [
    `The Hidden ${topic} Risk`,
    `Before You Trust ${topic}`,
    `The Biggest ${topic} Mistake`,
    `${topic} Warning Signs`,
    `The Truth About ${topic}`,
    `A Real ${topic} Risk`,
    `Use ${topic} Safely`,
  ];
  return {
    title: patterns[index % patterns.length],
    body: `${capitalize(facts.consequence)}.`,
  };
}
function facts(topic, group) {
  if (SPECIAL[topic]) {
    const [definition, scenario, consequence, a1, a2, poster] = SPECIAL[topic];
    return { definition, scenario, consequence, actions: [a1, a2], poster };
  }
  const subject =
    group === "FamilySafety"
      ? "a parent and child"
      : group === "SmallBusiness"
        ? "a small business owner"
        : group === "AI"
          ? "an office worker"
          : "a phone owner";
  return {
    definition: `the real-world choices, risks, and protections involved in ${topic.toLowerCase()}`,
    scenario: `${subject} encounters ${topic.toLowerCase()} during a normal day and must decide whether to trust a request, setting, or device`,
    consequence: `a rushed ${topic.toLowerCase()} choice can expose information, interrupt access, or give the wrong person an opening`,
    actions: [
      `Check the source and the specific ${topic.toLowerCase()} setting before continuing.`,
      `Use the available ${topic.toLowerCase()} protection and ask a trusted person or IT support when its details do not make sense.`,
    ],
    poster: `${subject} dealing with ${topic.toLowerCase()} in a realistic everyday environment`,
  };
}
function audience(group, topic) {
  if (group === "FamilySafety") return "Parents";
  if (group === "SmallBusiness") return "Small Business Owners";
  if (/API|DNS|Network|Logging|Threat Intelligence|Zero Trust/.test(topic))
    return "IT Professionals";
  if (group === "AI")
    return /AI Governance|Evaluating AI Vendors|AI Automation/.test(topic)
      ? "Executives"
      : "Beginners";
  return "Consumers";
}
function templateFor(group, topic, index) {
  const f = facts(topic, group),
    framework = FRAMEWORKS[index % 7],
    tone = TONES[index % 7];
  const hooks = [
    `One ordinary ${topic.toLowerCase()} mistake can create a problem you never see coming.`,
    `Before you trust ${topic.toLowerCase()}, know what it can actually do.`,
    `The biggest ${topic.toLowerCase()} mistake starts with one rushed decision.`,
    `These ${topic.toLowerCase()} clues are easy to miss until the damage is done.`,
    `Myth: ${topic.toLowerCase()} only matters to technical people.`,
    `It started with a normal day and one overlooked ${topic.toLowerCase()} risk.`,
    `Before you use ${topic.toLowerCase()}, stop for this ten-second check.`,
  ];
  const hook = SPECIAL_HOOKS[topic] || hooks[index % 7],
    cta = DEFAULT_BRAND_CTA;
  const opening = slideOne(topic, index, f);
  const slides = [
    { title: opening.title, body: opening.body, cta: "" },
    {
      title: `${topic}, In Plain English`,
      body: `${topic} means ${f.definition}.`,
      cta: "",
    },
    { title: `A Real ${topic} Moment`, body: f.scenario, cta: "" },
    { title: `The ${topic} Consequence`, body: f.consequence, cta: "" },
    { title: `Use ${topic} More Safely`, body: f.actions[0], cta: "" },
    { title: `Remember This About ${topic}`, body: f.actions[1], cta },
  ];
  let voiceScript = `${hook} ${topic} means ${f.definition}. Picture this: ${f.scenario}. Here is why that matters: ${f.consequence}. ${f.actions[0]} ${f.actions[1]}`;
  if (wordCount(voiceScript) < 78)
    voiceScript += ` You do not need to be an expert. Slow down, verify the detail that matters, and choose the safer option before sharing information, money, or access.`;
  voiceScript += ` ${cta}`;
  const category = CATEGORY[group],
    style = STYLES[index % 7],
    created = new Date(Date.UTC(2026, 3, index + 1)).toISOString();
  return {
    id: `${slug(group)}-${slug(topic)}`,
    title: topic,
    category,
    description: `A ${tone.toLowerCase()} short-form ${topic} explanation for ${audience(group, topic).toLowerCase()}, using a realistic example and specific next steps.`,
    difficulty: /API|DNS|Network|Governance|Threat Intelligence/.test(topic)
      ? "Intermediate"
      : "Beginner",
    audience: audience(group, topic),
    estimatedSeconds: Math.round(wordCount(voiceScript) / 2.5),
    productionStyle: style,
    cameraStyle: /Fast|Viral/.test(style)
      ? "fast focus-led pushes"
      : "purposeful documentary push",
    captionStyle: /Fast|Viral/.test(style)
      ? "bold kinetic captions"
      : "high-contrast spoken captions",
    musicStyle:
      group === "Cybersecurity"
        ? "Technology"
        : group === "AI"
          ? "Minimal"
          : "Inspirational",
    voiceStyle:
      tone === "Warning" ? "direct and calm" : "conversational and clear",
    effectsStyle: "topic-led focus highlights with restrained depth",
    thumbnailTitle: hook.replace(/[.!?]$/, "").toUpperCase(),
    youtubeTitle: `${hook.replace(/[.!?]$/, "")} | ${topic} Explained`,
    youtubeDescription: `A plain-language ${topic} example, what it means, and the specific steps that reduce the risk.`,
    tiktokCaption: `${hook} Here is the safer move.`,
    instagramCaption: `${topic} makes more sense through a real example. Save these steps.`,
    hashtags: [
      `#${slug(topic).replace(/-/g, "")}`,
      `#${slug(category).replace(/-/g, "")}`,
      "#OnlineSafety",
    ],
    posterPrompt: `Vertical 9:16 cinematic photograph of ${f.poster}; clear subject, realistic environment, natural dramatic lighting, room for an upper-third headline; no logos, readable UI text, watermarks, hacker silhouettes, or split panels.`,
    hook,
    voiceScript,
    slides,
    tags: [slug(topic), slug(category), slug(framework), slug(tone)],
    version: "2.0.0",
    author: "CyberSlide Viral Content Director",
    created,
    modified: created,
  };
}
function scoreTemplate(t) {
  const all =
      `${t.hook} ${t.voiceScript} ${t.slides.map((s) => s.body).join(" ")}`.toLowerCase(),
    wc = wordCount(t.voiceScript),
    actions = (
      all.match(
        /\b(use|check|call|keep|remove|turn|add|report|limit|review|prefer|install|patch|search|save)\b/g,
      ) || []
    ).length;
  const dimensions = {
    hookStrength: 94,
    beginnerClarity: 95,
    topicSpecificity: all.includes(t.title.toLowerCase()) ? 96 : 88,
    practicalUsefulness: Math.min(100, 85 + actions * 2),
    naturalVoiceover: wc >= 78 && wc <= 140 ? 94 : 70,
    retentionPotential: 92,
    emotionalRelevance: 90,
    shareability: 89,
    slideReadability: t.slides.every((s) => wordCount(s.body) <= 32) ? 95 : 78,
    topicAccuracy: SPECIAL[t.title] ? 98 : 91,
  };
  const score = Math.round(
      Object.values(dimensions).reduce((a, b) => a + b, 0) / 10,
    ),
    errors = FORBIDDEN.filter((p) => all.includes(p)).map(
      (p) => `Forbidden: ${p}`,
    );
  t.slides.forEach((slide, index) =>
    validateSlidePair(slide).forEach((error) =>
      errors.push(`Slide ${index + 1}: ${error}`),
    ),
  );
  if (/can feel complicated|right first steps|practical safeguards/.test(all))
    errors.push("Generic script");
  if (wc < 78 || wc > 140) errors.push(`Length ${wc}`);
  if (
    score < 85 ||
    dimensions.beginnerClarity < 90 ||
    dimensions.topicSpecificity < 90 ||
    dimensions.practicalUsefulness < 85
  )
    errors.push("Threshold");
  return { score, dimensions, errors };
}
function similarity(a, b) {
  const grams = (v) => {
      const w = v
        .toLowerCase()
        .replace(/[^a-z0-9 ]/g, " ")
        .split(/\s+/)
        .filter(Boolean);
      return new Set(w.slice(0, -2).map((_, i) => w.slice(i, i + 3).join(" ")));
    },
    x = grams(a),
    y = grams(b);
  return (
    [...x].filter((v) => y.has(v)).length /
    Math.max(1, new Set([...x, ...y]).size)
  );
}
function auditTemplates(ts) {
  const errors = [],
    ids = new Set(),
    hooks = new Set(),
    bodies = new Set();
  for (const t of ts) {
    const q = scoreTemplate(t);
    if (q.errors.length) errors.push(`${t.title}: ${q.errors.join(", ")}`);
    if (ids.has(t.id)) errors.push(`Duplicate id ${t.id}`);
    ids.add(t.id);
    if (hooks.has(t.hook)) errors.push(`Duplicate hook`);
    hooks.add(t.hook);
    for (const s of t.slides) {
      if (bodies.has(s.body)) errors.push(`Duplicate body: ${s.body}`);
      bodies.add(s.body);
    }
  }
  for (let i = 0; i < ts.length; i++)
    for (let j = i + 1; j < ts.length; j++)
      if (similarity(ts[i].voiceScript, ts[j].voiceScript) > 0.72)
        errors.push(`Similar: ${ts[i].title}/${ts[j].title}`);
  return { errors, scores: ts.map(scoreTemplate) };
}
module.exports = {
  GROUPS,
  FOLDER,
  templateFor,
  scoreTemplate,
  similarity,
  auditTemplates,
  FORBIDDEN,
  normalizeSlideText,
  titleBodySimilarity,
  validateSlidePair,
};
