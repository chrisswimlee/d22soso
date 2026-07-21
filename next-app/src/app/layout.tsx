import type { Metadata } from "next";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import SiteNav from "@/components/SiteNav";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-display",
  subsets: ["latin"],
  weight: "400",
});

const SITE_URL = "https://d22soso.com";
const SITE_NAME = "Wayne \u201CD22-soso\u201D Chiang";
const DESCRIPTION =
  "Wayne \u201CD22-soso\u201D Chiang \u2014 first official StarCraft: Brood War World Champion (1999), high-stakes poker player, and inventor of patented casino game 2 Hand Hold\u2019em.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Wayne \u201CD22-soso\u201D Chiang \u2014 Pioneer of Esports & Casino Inventor",
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
    title: "Wayne \u201CD22-soso\u201D Chiang \u2014 Pioneer of Esports & Casino Inventor",
    description: DESCRIPTION,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    site: "@D22_soso",
    creator: "@D22_soso",
    title: "Wayne \u201CD22-soso\u201D Chiang \u2014 Pioneer of Esports & Casino Inventor",
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
  jobTitle: [
    "Casino Game Inventor",
    "Talent Manager, World Series of Poker",
    "Professional Poker Player",
  ],
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
      description: "Patented casino card game (US Patents 11,117,045, 11,731,032, and 12,005,342).",
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
    "https://www.instagram.com/D22_soso/",
    "https://www.youtube.com/@WayneChiangPoker",
    "https://liquipedia.net/starcraft/Soso",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col text-slate-200">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }}
        />
        <SiteNav />
        <main className="flex flex-1 flex-col">{children}</main>
        <footer className="border-t border-gold/10 py-6">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <span>&copy; {new Date().getFullYear()} Wayne Chiang. All rights reserved.</span>
            <span className="text-slate-600">Esports · Poker · Casino Innovation</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
