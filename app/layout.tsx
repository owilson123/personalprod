import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/app/contexts/ThemeContext";

export const metadata: Metadata = {
  title: "Command Center",
  description: "Personal productivity dashboard with finance tracking",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
