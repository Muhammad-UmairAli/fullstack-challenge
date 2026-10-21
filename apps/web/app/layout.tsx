import type { Metadata } from 'next';
import { Inter, Space_Grotesk, JetBrains_Mono } from 'next/font/google';
import { getServerSession } from '../lib/auth-server';
import { SessionProvider } from '../components/providers/session-provider';
import { ThemeProvider } from '../components/providers/theme-provider';
import { themeInitScript } from '../lib/theme';
import './globals.css';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

const spaceGrotesk = Space_Grotesk({
  variable: '--font-space-grotesk',
  subsets: ['latin'],
});

const jetBrainsMono = JetBrains_Mono({
  variable: '--font-jetbrains-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'um.air | Fullstack Engineer',
  description: 'The personal space and professional portfolio of Umair.',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getServerSession();

  return (
    // themeInitScript adds the saved theme class to <html> before hydration, so
    // its class attribute intentionally differs from the server render.
    <html
      lang="en"
      className={`${inter.variable} ${spaceGrotesk.variable} ${jetBrainsMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="flex min-h-full flex-col">
        <ThemeProvider>
          <SessionProvider user={user}>{children}</SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
