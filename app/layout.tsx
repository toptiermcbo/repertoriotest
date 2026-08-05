import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Top Tier Maracaibo – Repertorio Musical',
  description: 'Elige los géneros y artistas que quieres y envía el pedido por WhatsApp.',
  icons: {
    icon: '/logo-toptier.png',
    apple: '/logo-toptier.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#111111',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className="bg-background">
      <body className={`${inter.className} antialiased`}>
        {children}
      </body>
    </html>
  )
}
