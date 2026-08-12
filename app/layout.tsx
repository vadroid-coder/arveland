import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ArveMaa",
  description: "Arvete haldus — invoicing admin panel",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="et">
      <body>{children}</body>
    </html>
  );
}
