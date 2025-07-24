import type { Metadata } from 'next'
import { Montserrat } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { cn } from '@/lib/utils'

const montserrat = Montserrat({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-montserrat'
})

export const metadata: Metadata = {
  title: 'Chat Application',
  description: 'Modern chat application with n8n workflow integration',
  keywords: ['chat', 'ai', 'n8n', 'workflow', 'automation'],
  authors: [{ name: 'Chat App Team' }],
  creator: 'Chat App Team',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f8f5f0' },
    { media: '(prefers-color-scheme: dark)', color: '#1c2a1f' }
  ],
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body 
        className={cn(
          'min-h-screen bg-background font-sans antialiased',
          montserrat.variable
        )}
      >
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}