import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { ToastProvider } from '@/components/Toast';

export const metadata = {
  title: { default: 'RENTEX DOMAINS — Your Next Domain. Your Terms.', template: '%s · RENTEX DOMAINS' },
  description: 'Discover premium domains and rent the perfect digital address for your next project.',
};
export const viewport = { themeColor: '#07061a' };

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col">
        <ToastProvider>
          <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-violet-600 focus:px-3 focus:py-2">Skip to content</a>
          <Navbar />
          <main id="main" className="flex-1">{children}</main>
          <Footer />
        </ToastProvider>
      </body>
    </html>
  );
}
