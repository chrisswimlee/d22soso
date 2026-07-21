import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_URL = "https://d22soso.com";
const SITE_NAME = "Wayne \u201CD22-soso\u201D Chiang";
const DESCRIPTION =
  "Wayne \u201CD22-soso\u201D Chiang \u2014 first official StarCraft: Brood War World Champion (1999), inventor of patented casino games 2 Hand Hold\u2019em and Badugi Chase, and WSOP Talent Manager.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Wayne \u201CD22-soso\u201D Chiang \u2014 Esports Legacy & Casino Innovations",
    template: "%s | Wayne \u201CD22-soso\u201D Chiang",
  },
  description: DESCRIPTION,
  applicationName: SITE_NAME,
  authors: [{ name: "Wayne Chiang" }],
  creator: "Wayne Chiang",
  publisher: "Wayne Chiang",
  keywords: [
    "Wayne Chiang",
    "D22-soso",
    "SoSOWAC",
    "StarCraft Brood War World Champion",
    "esports pioneer",
    "2 Hand Hold'em",
    "Badugi Chase",
    "casino game inventor",
    "patented casino games",
    "WSOP",
    "Live at the Bike",
    "poker",
  ],
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: "Wayne \u201CD22-soso\u201D Chiang \u2014 Esports Legacy & Casino Innovations",
    description: DESCRIPTION,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    site: "@D22_soso",
    creator: "@D22_soso",
    title: "Wayne \u201CD22-soso\u201D Chiang \u2014 Esports Legacy & Casino Innovations",
    description: DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  category: "technology",
};

const personSchema = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Wayne Chiang",
  alternateName: ["D22-soso", "SoSOWAC"],
  url: SITE_URL,
  description: DESCRIPTION,
  jobTitle: ["Casino Game Inventor", "Talent Manager, World Series of Poker", "Professional Poker Player"],
  gender: "Male",
  nationality: "American",
  alumniOf: {
    "@type": "CollegeOrUniversity",
    name: "University of California, San Diego",
  },
  knowsAbout: [
    "Esports",
    "StarCraft: Brood War",
    "Game design",
    "Casino game invention",
    "Poker",
    "Competitive strategy",
  ],
  award: [
    "First official StarCraft: Brood War Season 1 Ladder Tournament World Champion (1999)",
    "First StarCraft tournament winner (1998)",
    "StarCraft's first play-by-play tournament caster (1998)",
  ],
  owns: [
    {
      "@type": "CreativeWork",
      name: "2 Hand Hold'em",
      description: "Patented casino card game (US Patents 11,117,045 and 11,731,032).",
    },
    {
      "@type": "CreativeWork",
      name: "Badugi Chase",
      description: "Patented single-draw lowball casino card game.",
    },
  ],
  sameAs: [
    "https://x.com/D22_soso",
    "https://twitter.com/D22_soso",
    "https://liquipedia.net/starcraft/Soso",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col text-slate-200">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }}
        />
        <header className="sticky top-0 z-50 border-b border-white/5 bg-slate-950/40 backdrop-blur-md">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
            <span className="text-sm font-semibold tracking-tight text-slate-100">D22-soso</span>
            <nav className="flex items-center gap-4 text-sm text-slate-400 sm:gap-6">
              <a className="transition-colors hover:text-slate-100" href="#esports">Esports</a>
              <a className="transition-colors hover:text-slate-100" href="#casino">Casino</a>
              <a className="transition-colors hover:text-slate-100" href="#contact">Licensing</a>
            </nav>
          </div>
        </header>
        <main className="flex flex-1 flex-col">{children}</main>
        <footer className="border-t border-white/5 py-6">
          <div className="mx-auto w-full max-w-6xl px-4 text-sm text-slate-500 sm:px-6">
            &copy; {new Date().getFullYear()} Wayne Chiang. Esports Legacy &amp; Casino Innovations.
          </div>
        </footer>
      </body>
    </html>
  );
}
