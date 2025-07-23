'use client'

import React from 'react'
import { MainLayout } from '@/components/layout/MainLayout'
import { ChatInterface } from '@/components/chat/ChatInterface'

export default function ChatPage() {
  return (
    <MainLayout>
      <ChatInterface />
    </MainLayout>
  )
}