import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";
import { VideoCallProvider } from "@/contexts/VideoCallContext"
import { LoadingProvider } from "@/components/providers/LoadingProvider"
// import { VideoCallHubProvider } from "@/components/providers/VideoCallHubProvider"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FastBite Group - Team Collaboration Platform",
  description:
    "Real-time collaboration and communication platform for teams and communities",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          <VideoCallProvider>
            <LoadingProvider>
              {/* <VideoCallHubProvider> */}
              {children}
              {/* </VideoCallHubProvider> */}
            </LoadingProvider>
          </VideoCallProvider>
        </Providers>
      </body>
    </html>
  )
}
