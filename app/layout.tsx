import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Unsent Letters — Say it here. Someone will listen.',
  description: 'An anonymous, gentle place to write what you cannot say out loud and find kindness from strangers.',
}

export const viewport: Viewport = { themeColor: '#1a1840', colorScheme: 'dark light', userScalable: true }

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>
}
