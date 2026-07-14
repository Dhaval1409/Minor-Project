import { Space_Grotesk, Inter, IBM_Plex_Mono, Geist } from 'next/font/google';
import './globals.css';
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-space',
});
const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
});
const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-mono',
});

export const metadata = {
  title: 'Aria — Hire an AI Employee',
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={cn(spaceGrotesk.variable, inter.variable, ibmPlexMono.variable, "font-sans", geist.variable)}
    >
      <body>{children}</body>
    </html>
  );
}