import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'ML Scraper',
  description: 'Mercado Libre Scraper',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className="bg-[#1e1e1e] text-white">
        {children}
      </body>
    </html>
  )
}
