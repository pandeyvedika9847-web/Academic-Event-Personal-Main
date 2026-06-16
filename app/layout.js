import "./globals.css";
import { APP_COPY, PUBLIC_CONFIG } from "@/lib/config/public";

export const metadata = {
  title: `${PUBLIC_CONFIG.appName} (${PUBLIC_CONFIG.appShortName}) - ${APP_COPY.tagline}`,
  description: `${APP_COPY.description} Built for ${PUBLIC_CONFIG.universityName}.`,
  keywords: `academic events, ${PUBLIC_CONFIG.appShortName}, ${PUBLIC_CONFIG.universityName}, seminars, workshops, conferences`,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>{children}</body>
    </html>
  );
}
