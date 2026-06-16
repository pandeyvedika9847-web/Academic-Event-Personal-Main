const trimTrailingSlash = (value) => value.replace(/\/$/, "");

const DEFAULT_SITE_URL = "http://localhost:3000";
const DEFAULT_API_ORIGIN = "http://localhost:4000";

const siteUrl = trimTrailingSlash(process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_SITE_URL);
const apiOrigin = trimTrailingSlash(
  process.env.NEXT_PUBLIC_API_ORIGIN || DEFAULT_API_ORIGIN
);

export const PUBLIC_CONFIG = Object.freeze({
  appName: process.env.NEXT_PUBLIC_APP_NAME || "Academic Events Hub",
  appShortName: process.env.NEXT_PUBLIC_APP_SHORT_NAME || "AEH",
  universityName:
    process.env.NEXT_PUBLIC_UNIVERSITY_NAME || "Banaras Hindu University",
  supportEmail:
    process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "support@academicevents.local",
  siteUrl,
  apiOrigin,
  apiBaseUrl: trimTrailingSlash(
    process.env.NEXT_PUBLIC_API_URL || `${apiOrigin}/api`
  ),
  socketUrl: trimTrailingSlash(process.env.NEXT_PUBLIC_SOCKET_URL || apiOrigin),
  googleClientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "",
});

export const APP_COPY = Object.freeze({
  tagline: "Never miss a relevant academic opportunity again",
  description:
    "The academic pulse of your campus. Discover seminars, workshops, conferences, lectures, and training programs in one place.",
});
