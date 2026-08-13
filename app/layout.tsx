import type { Metadata } from 'next';
import '../src/design-system/tokens.css';
import './globals.css';

export const metadata: Metadata = {
  title: 'Gen-UI · A2UI proof of concept',
  description:
    'An agent that decides what to render in chat, composing live widgets from a design-system catalog over the A2UI protocol.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
