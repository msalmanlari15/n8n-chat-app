'use client'

import React from 'react'
import { ThemeProvider } from '@/context/ThemeContext'
import { ChatProvider } from '@/context/ChatContext'

interface ProvidersProps {
  children: React.ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider>
      <ChatProvider>
        {children}
      </ChatProvider>
    </ThemeProvider>
  )
}