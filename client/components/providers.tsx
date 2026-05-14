"use client";

import { GoogleOAuthProvider } from "@react-oauth/google";
import { ThemeProvider } from "next-themes";

const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";

export function Providers({ children }: { children: React.ReactNode }) {
  const theme = (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      disableTransitionOnChange
    >
      {children}
    </ThemeProvider>
  );

  if (!googleClientId) return theme;

  return (
    <GoogleOAuthProvider clientId={googleClientId}>{theme}</GoogleOAuthProvider>
  );
}
