import './globals.css'
import type { Metadata } from 'next'
export const metadata:Metadata={title:'CartPilot — Agentic Commerce',description:'AI-powered commerce agent demo'}
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
