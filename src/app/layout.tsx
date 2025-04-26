
import type {Metadata} from 'next';
import { Inter } from 'next/font/google'; // Import Inter font
import './globals.css';
import { Toaster } from "@/components/ui/toaster";

// Configure Inter font
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter', // Optional: if you want to use it as a CSS variable
});

export const metadata: Metadata = {
  title: 'Resume Insights AI - Analyze & Generate Resumes',
  description: 'Leverage AI to analyze your resume against job descriptions, get improvement suggestions, find suitable roles, and generate professional resumes.',
  keywords: 'resume analyzer, resume generator, AI resume, job fit, career advice, resume builder, ATS checker',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.className}>
      <body className="antialiased"> {/* antialiased is often default but good to keep */}
        {children}
        <Toaster />
      </body>
    </html>
  );
}
