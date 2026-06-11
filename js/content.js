/* =====================================================================
   C&C ASSET ADVISORS — Content (public-facing)
   Voice: elite operator competency. Advisory, not sales. Tight, confident.
   ===================================================================== */
(function () {
  const DIVISIONS = [
    {
      id: "residential",
      index: "01",
      rn: "I",
      name: "Residential",
      tag: "Buyers, sellers & first moves",
      theme: "warm",
      world: "residential",
      lead: "For buyers, sellers, and future owners",
      statement:
        "Modern residential advisory for Dallas–Fort Worth buyers and sellers — representation handled with clarity, and marketed with media most firms outsource.",
      points: [
        { h: "Buyer & seller representation", p: "Capable representation from first search to final signature. We advise the decision — we don't push the deal." },
        { h: "Off-market search", p: "Access to homes before they list. We work the market and the network directly, so you see what others don't." },
        { h: "In-house media studio", p: "Photography, cinematic film, and listing media produced entirely in-house — your home presented at a standard most firms outsource and few match." }
      ],
      services: ["Buyer representation", "Listing & seller representation", "Off-market search", "Property Media Studio", "Relocation"],
      cta: "Start a residential conversation"
    },
    {
      id: "investment",
      index: "02",
      rn: "II",
      name: "Private Investment",
      tag: "For investors, owners & families",
      theme: "dark",
      world: "investment",
      lead: "For investors, owners, and families",
      statement:
        "Discreet advisory for private clients evaluating, acquiring, improving, and exiting real estate — with operational intelligence and long-term alignment.",
      points: [
        { h: "Operational intelligence", p: "We know what happens after closing — build-out costs, TI, timelines, the realities of running an asset. Field knowledge most advisors don't have." },
        { h: "Broker authority", p: "Decades of transaction experience and licensed broker authority — structure, judgment, and institutional credibility on every engagement." },
        { h: "Financial discipline", p: "Underwriting, valuation, and modeling that turn complex numbers into clear, confident decisions." }
      ],
      services: ["Acquisition & disposition", "Asset repositioning", "Portfolio strategy", "Land & development", "Family real estate"],
      cta: "Request a private consultation"
    },
    {
      id: "commercial",
      index: "03",
      rn: "III",
      name: "Commercial",
      tag: "A partnership model",
      theme: "cool",
      world: "commercial",
      lead: "For owners, tenants, and operators",
      statement:
        "Commercial advisory built on a partnership model — C&C at the center, a trusted network of specialists around it, directed by operators who run active commercial construction across DFW every day.",
      points: [
        { h: "We understand how buildings work", p: "We manage large-scale commercial construction across DFW daily — feasibility, TI cost, timelines. Ground-level intelligence you can't learn from a desk." },
        { h: "The right specialist, every time", p: "Commercial rewards specialization. We stay at the center of the engagement — holding the relationship and directing the right specialist for the asset, the market, and the deal." },
        { h: "On your side, through completion", p: "Guide, qualify, connect, and stay involved — your interest represented from first conversation to close." }
      ],
      services: ["Site & feasibility advisory", "Tenant & landlord representation", "Build-out & TI guidance", "Specialist network", "Acquisition & disposition"],
      network: {
        hub: ["C&C", "Brokerage"],
        markets: ["Industrial", "Office", "Retail", "Multifamily"],
        disciplines: ["Construction", "Lending", "Legal"],
        big: "Construction",
        caption: "One relationship at the hub — the right specialist for every asset class."
      },
      cta: "Discuss a commercial requirement"
    }
  ];

  /* The idea — client evolution, three front doors (kept tight) */
  const ARC_INTRO = "Every client starts somewhere different. Every one stays for the decisions that follow.";
  const ARC = [
    { t: "The first home", d: "Considered representation for the place you actually live." },
    { t: "The first investment", d: "A property to hold — and the confidence to hold it." },
    { t: "A portfolio", d: "Strategy across multiple assets and markets." },
    { t: "A footprint", d: "Commercial space, land, and development." }
  ];
  const ARC_CLOSE = "Same firm. Different door. One standard.";

  const TEAM_INTRO =
    "Operational command, broker authority, and financial analysis — three senior lenses, working as one on every engagement.";

  const TEAM = [
    {
      id: "dalton",
      name: "Dalton",
      fullName: "Dalton Carabajal",
      email: "dalton@ccassetadvisors.com",
      title: "Founder & Managing Partner",
      world: "investment",
      focus: "Real estate & construction",
      summary: "A decade-plus building real estate and construction in tandem — residential, investment, and commercial, from the ground up.",
      bio: [
        "Dalton founded C&C to advise with the discernment of an operator, not the urgency of a salesperson. For over a decade he has worked real estate and construction in tandem — starting inside an investment and management company before branching off on his own. Licensed since 2019, he has worked every part of the business from the ground up: residential, investment, and commercial.",
        "He previously owned and operated a residential general contracting business, and today manages active commercial construction across Dallas–Fort Worth — shell finishes, build-outs, and tenant interiors — coordinating directly with owners, brokers, and asset managers. That field-level command of how buildings actually get built informs every assignment the firm takes on."
      ],
      credentials: ["Licensed since 2019", "10+ yrs real estate & construction", "Business Marketing & Mgmt · Texas Tech"]
    },
    {
      id: "irma",
      name: "Irma",
      fullName: "Irma Carabajal",
      email: "irma@ccassetadvisors.com",
      title: "Broker, Co-Owner & Senior Advisor",
      world: "commercial",
      focus: "Brokerage, investment & strategy",
      summary: "A broker of 25+ years and founder of the first RE/MAX Commercial Division in Texas.",
      bio: [
        "Irma is a real estate broker with over 25 years of industry experience across both residential and commercial markets. She owned the first RE/MAX Commercial Division in Texas and operated three commercial offices — in Dallas, Rockwall, and Grand Prairie — and now manages C&C Asset Advisors. Fluent in English and Spanish, she specializes in investments, strategic portfolio management, development, and contract negotiations.",
        "She holds a Master of Education from Texas A&M University–Commerce and is currently pursuing a Doctorate in Leadership in Education, further honing her strategic leadership. A newly certified member of the Texas Real Estate Teachers Association, she also serves as an online real estate instructor specializing in finance and principles for adult learners."
      ],
      credentials: ["Real Estate Broker", "M.Ed., Texas A&M–Commerce", "Doctorate in Leadership (in progress)", "CDEI · Insurance License", "TX Real Estate Teachers Assn.", "English & Spanish"]
    },
    {
      id: "landon",
      name: "Landon",
      fullName: "Landon Hoelscher",
      email: "landon@ccassetadvisors.com",
      title: "Investment Analyst & Residential Lead",
      world: "residential",
      focus: "Financial analysis & underwriting",
      summary: "Finance-trained — turns complex underwriting and valuation into clear, confident decisions.",
      bio: [
        "Landon brings analytical firepower to the firm. A finance graduate with a background in finance and accounting, he leads underwriting, valuation, and capital strategy across residential and investment engagements — translating complex numbers into clear, confident decisions for clients and partners.",
        "He also leads the residential division, where financial fluency lets him advise buyers and sellers on structure, affordability, and long-term value with a precision most agents simply can't offer."
      ],
      credentials: ["B.B.A. Finance", "Finance & accounting background", "Underwriting, valuation & capital strategy"]
    }
  ];

  const TEAM_NOTE =
    "Behind the core team, C&C deploys a vetted bench — associate agents, analysts, media producers, and specialist partners across legal, lending, inspection, and commercial brokerage. Work is allocated where it's done best, so capacity scales to the engagement without diluting the standard.";

  /* How we operate — competency, not philosophy */
  const STANDARD_STATEMENT =
    "We operate as a firm built to last — analytical, operationally fluent, and deliberate. We don't chase volume or react to noise. We advise, execute, and build relationships that compound over years.";
  const STANDARD = [
    { k: "01", t: "Advisory, not sales", d: "We ask what you're trying to accomplish — not whether you're ready to buy. The work is guidance, and it shows." },
    { k: "02", t: "Operational intelligence", d: "We run active construction and underwrite real deals. We advise from the field and the numbers — never from a script." },
    { k: "03", t: "Discretion by default", d: "The most valuable conversations happen quietly. Most of the work is done before anything is public." },
    { k: "04", t: "The long view", d: "We measure the work in decades and in trust — relationships that compound, not deals that close once." }
  ];
  const STANDARD_CLOSE = "Our telos is the multiplication of aligned flourishing.";

  const FIRM = {
    office: "519 E. Interstate 30 #323, Rockwall, TX 75085",
    phone: "+1 (469) 479-9656",
    phoneHref: "tel:+14694799656",
    legal: [
      { t: "Information About Brokerage Services", href: "https://www.trec.texas.gov/forms/information-about-brokerage-services" },
      { t: "Consumer Protection Notice", href: "https://www.trec.texas.gov/forms/consumer-protection-notice" }
    ]
  };

  const CONTACT = [
    { id: "residential", label: "Residential", q: "Buying or selling a home." },
    { id: "investment", label: "Private Investment", q: "Acquiring, holding, or repositioning assets." },
    { id: "commercial", label: "Commercial", q: "A commercial requirement or partnership." }
  ];

  window.CC = { DIVISIONS, ARC, ARC_INTRO, ARC_CLOSE, TEAM, TEAM_INTRO, TEAM_NOTE, STANDARD, STANDARD_STATEMENT, STANDARD_CLOSE, CONTACT, FIRM };
})();
