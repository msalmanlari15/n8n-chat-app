'use client'

import React from 'react'
import { useChat } from '@/context/ChatContext'
import { useTheme } from '@/context/ThemeContext'
import { AppSidebar } from '@/components/app-sidebar'
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'

interface MainLayoutProps {
  children: React.ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  const { state } = useChat()
  const { theme } = useTheme()

  return (
    <div className={cn(
      'min-h-screen bg-background text-foreground transition-colors duration-300',
      theme === 'dark' ? 'dark' : ''
    )}>
      <SidebarProvider defaultOpen={false}>
        <AppSidebar />
        <SidebarInset>
          <header className="sticky top-0 z-50 flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 border-b border-border bg-background/95 backdrop-blur-sm">
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
              <div className="flex items-center space-x-4 ml-2">
                <h1 className="text-lg font-semibold text-foreground">
                  Chat Application
                </h1>
                {state.currentSessionId && (
                  <div className="text-sm text-muted-foreground">
                    {state.sessions.find(s => s.id === state.currentSessionId)?.name}
                  </div>
                )}
              </div>
            </div>
            
            {/* Status indicators */}
            <div className="flex items-center space-x-2 ml-auto px-4">
              {state.isLoading && (
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                  <span>Loading...</span>
                </div>
              )}
              
              {state.error && (
                <div className="flex items-center space-x-2 text-sm text-destructive">
                  <div className="w-2 h-2 bg-destructive rounded-full" />
                  <span>Error</span>
                </div>
              )}
            </div>
          </header>
          
          <div className="flex flex-1 flex-col min-h-0">
            {state.currentSessionId ? (
              <div className="flex-1 flex justify-center min-h-0">
                <div className="w-full max-w-none lg:max-w-[75%] flex flex-col min-h-0">
                  {children}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-foreground mb-4">
                    Welcome to Chat App
                  </h2>
                  <p className="text-muted-foreground">
                    Select a conversation or start a new one to begin chatting
                  </p>
                </div>
              </div>
            )}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  )
}