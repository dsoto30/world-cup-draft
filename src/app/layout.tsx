import type { Metadata } from 'next'
import { Anybody, Hanken_Grotesk } from 'next/font/google'
import './globals.css'

const anybody = Anybody({
  variable: '--font-anybody',
  subsets: ['latin'],
  display: 'swap',
})

const hanken = Hanken_Grotesk({
  variable: '--font-hanken',
  subsets: ['latin'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'World Cup Legends Draft',
  description: 'Build your ultimate World Cup Legends squad',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" data-scroll-behavior="smooth" className={`${anybody.variable} ${hanken.variable}`}>
      <body className="min-h-screen bg-surface text-on-surface antialiased">
        {children}
      </body>
    </html>
  )
}
