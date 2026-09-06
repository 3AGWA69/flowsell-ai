import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'FlowSell AI — WhatsApp Sales Assistant',
  description: 'AI sales assistant demo for Egyptian online stores.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="ar" dir="rtl"><body>{children}</body></html>;
}
