import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Unsent Letters — Leave something kind here',
  description: 'An anonymous place to write what you cannot say out loud and find encouragement from strangers.',
}

export const viewport: Viewport = { themeColor: '#e8f3f8', colorScheme: 'light dark' }

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>
}
