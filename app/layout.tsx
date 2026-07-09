import type { Metadata, Viewport } from "next";
import { BottomNav } from "@/components/navigation/BottomNav";
import "./globals.css";

export const metadata: Metadata = {
  title: "RunPlan AI",
  description: "A mobile-first training plan editor for runners.",
  applicationName: "RunPlan AI",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "RunPlan AI",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#f8fafc",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-background text-foreground">
        {children}
        <BottomNav />
      </body>
    </html>
  );
}
