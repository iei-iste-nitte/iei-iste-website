
export const SITE = {
  name: "IEI × ISTE",
  campus: "NITTE",
  institute: "NMAM Institute of Technology · Nitte",
  tagline: "Engineering minds. Connecting ideas. Building tomorrow.",
  email: "contact@iei-iste-nitte.example",
  year: 2026,
} as const;

export const NAV_LINKS = [
  { href: "#home", label: "Home" },
  { href: "#about", label: "About" },
  { href: "#events", label: "Events" },
  { href: "#team", label: "Our Team" },
  { href: "#gallery", label: "Gallery" },
  { href: "#contact", label: "Contact" },
] as const;

export const PILLARS = [
  {
    numeral: "I",
    title: "Technical Excellence",
    description: "Learn, experiment and develop skills beyond the classroom.",
  },
  {
    numeral: "II",
    title: "Innovation & Ideas",
    description: "Turn creative ideas into meaningful projects and solutions.",
  },
  {
    numeral: "III",
    title: "Community & Collaboration",
    description: "Connect with curious minds and build something together.",
  },
] as const;

export interface EventItem {
  number: string;
  category: string;
  title: string;
  description: string;
  status: string;
  image?: string;
  imageAlt: string;
}

export const EVENTS: EventItem[] = [
  {
    number: "01",
    category: "WORKSHOP",
    title: "Technical Workshops",
    description: "Hands-on learning through practical technical sessions.",
    status: "Dates to be announced",
    imageAlt: "Students at a technical workshop",
  },
  {
    number: "02",
    category: "COMPETITION",
    title: "Hackathons & Challenges",
    description: "Build, compete and bring innovative ideas to life.",
    status: "Dates to be announced",
    imageAlt: "Teams competing at a hackathon",
  },
  {
    number: "03",
    category: "COMMUNITY",
    title: "Talks & Seminars",
    description: "Learn from experts, innovators and fellow students.",
    status: "Dates to be announced",
    imageAlt: "A speaker presenting at a seminar",
  },
];

export interface TeamMember {
  id: string;
  name?: string;
  role: string;
  society: "IEI" | "ISTE" | "Joint";
  image?: string;
  bio?: string;
}

export const TEAM: TeamMember[] = [
  { id: "chair-iei", role: "Chairperson", society: "IEI" },
  { id: "chair-iste", role: "Chairperson", society: "ISTE" },
  { id: "vice-chair", role: "Vice Chairperson", society: "Joint" },
  { id: "secretary", role: "Secretary", society: "Joint" },
  { id: "treasurer", role: "Treasurer", society: "Joint" },
  { id: "tech-lead", role: "Technical Lead", society: "Joint" },
  { id: "design-lead", role: "Design & Media Lead", society: "Joint" },
  { id: "events-lead", role: "Events Lead", society: "Joint" },
];

export interface GalleryItem {
  id: string;
  caption: string;
  tag: string;
  image?: string;
  alt: string;
}

export const GALLERY: GalleryItem[] = [
  { id: "g1", caption: "Workshop", tag: "Learn", alt: "Workshop session" },
  { id: "g2", caption: "Hackathon", tag: "Compete", alt: "Hackathon teams at work" },
  { id: "g3", caption: "Seminar", tag: "Listen", alt: "Seminar audience" },
  { id: "g4", caption: "The team", tag: "People", alt: "Core team together" },
  { id: "g5", caption: "Build night", tag: "Build", alt: "Late-night build session" },
  { id: "g6", caption: "Campus", tag: "Place", alt: "NMAM Institute of Technology campus" },
];
