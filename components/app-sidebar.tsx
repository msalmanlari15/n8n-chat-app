"use client"

import * as React from "react"
import { useState, useMemo } from "react"
import { 
  MessageCircle, 
  Plus, 
  Settings, 
  Moon, 
  Sun, 
  Search, 
  X, 
  Edit2, 
  Trash2
} from "lucide-react"

import { useChat } from "@/context/ChatContext"
import { useTheme } from "@/context/ThemeContext"
import { useSession } from "@/hooks/useSession"
import { ChatSession } from "@/types"
import { formatRelativeTime, sortSessionsByActivity, getSessionActivityStatus, groupSessionsByTime } from "@/lib/date-utils"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { state, currentMessages } = useChat()
  const { theme, toggleTheme } = useTheme()
  const { createSession, selectSession, renameSession, deleteSession } = useSession()
  
  // Local state for enhanced features
  const [searchQuery, setSearchQuery] = useState("")
  const [showSearch, setShowSearch] = useState(false)
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState("")
  const [hoveredSessionId, setHoveredSessionId] = useState<string | null>(null)

  const handleNewSession = () => {
    createSession("New Chat")
  }

  const handleSessionSelect = (sessionId: string) => {
    selectSession(sessionId)
  }

  const handleStartRename = (sessionId: string, currentName: string) => {
    setEditingSessionId(sessionId)
    setEditingName(currentName)
  }

  const handleFinishRename = async (sessionId: string) => {
    if (editingName.trim()) {
      await renameSession(sessionId, editingName.trim())
    }
    setEditingSessionId(null)
    setEditingName("")
  }

  const handleCancelRename = () => {
    setEditingSessionId(null)
    setEditingName("")
  }

  const handleDeleteSession = async (sessionId: string) => {
    if (confirm('Are you sure you want to delete this session?')) {
      await deleteSession(sessionId)
    }
  }

  // Filter and group sessions
  const filteredAndGroupedSessions = useMemo(() => {
    let sessions = state.sessions
    
    if (searchQuery.trim()) {
      sessions = sessions.filter(session =>
        session.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }
    
    return groupSessionsByTime(sessions)
  }, [state.sessions, searchQuery])

  const formatMessageCount = (count: number) => {
    if (count === 0) return 'No messages'
    if (count === 1) return '1 message'
    return `${count} messages`
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <div className="flex items-center gap-2">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <MessageCircle className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Chat App</span>
                  <span className="truncate text-xs">AI Assistant</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSearch(!showSearch)}
                  className="group-data-[collapsible=icon]:hidden h-6 w-6 p-0"
                >
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        
        {/* Search Bar */}
        {showSearch && (
          <div className="px-2 pb-2 group-data-[collapsible=icon]:hidden">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-sidebar-foreground/50" />
              <input
                type="text"
                placeholder="Search sessions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-10 py-2 bg-sidebar-accent border border-sidebar-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-sidebar-primary focus:border-transparent"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sidebar-foreground/50 hover:text-sidebar-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        )}
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>
            <div className="flex items-center justify-between w-full group-data-[collapsible=icon]:justify-center">
              <span className="group-data-[collapsible=icon]:hidden">Conversations</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleNewSession}
                className="h-6 w-6 p-0"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </SidebarGroupLabel>
          <SidebarGroupContent className="group-data-[collapsible=icon]:hidden">
            {state.sessions.length === 0 ? (
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton onClick={handleNewSession} className="h-12">
                    <Plus className="size-4" />
                    <span>Start New Chat</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            ) : Object.keys(filteredAndGroupedSessions).length === 0 ? (
              <SidebarMenu>
                <SidebarMenuItem>
                  <div className="flex items-center gap-3 px-3 py-4 text-sidebar-foreground/60">
                    <Search className="size-4" />
                    <span className="text-sm">No sessions found</span>
                  </div>
                </SidebarMenuItem>
              </SidebarMenu>
            ) : (
              Object.entries(filteredAndGroupedSessions).map(([category, sessions]) => (
                <div key={category} className="mb-8">
                  {/* Category Header */}
                  <div className="px-4 py-3 text-sm font-semibold text-sidebar-foreground/80 uppercase tracking-wide border-b border-sidebar-border/50">
                    {category}
                  </div>
                  
                  {/* Sessions in this category */}
                  <div className="mt-2">
                    <SidebarMenu>
                      {sessions.map((session: ChatSession) => {
                        const activityStatus = getSessionActivityStatus(session.metadata.lastActivity)
                        
                        return (
                          <SidebarMenuItem key={session.id} className="relative mb-2">
                            <div 
                              onMouseEnter={() => setHoveredSessionId(session.id)}
                              onMouseLeave={() => setHoveredSessionId(null)}
                            >
                              <SidebarMenuButton
                                asChild
                                isActive={state.currentSessionId === session.id}
                                className="h-10 px-4 rounded-lg hover:bg-sidebar-accent/80 transition-colors"
                              >
                                <button
                                  onClick={() => handleSessionSelect(session.id)}
                                  className="w-full text-left"
                                >
                              <div className="flex items-center w-full">
                                {editingSessionId === session.id ? (
                                  <input
                                    type="text"
                                    value={editingName}
                                    onChange={(e) => setEditingName(e.target.value)}
                                    onBlur={() => handleFinishRename(session.id)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        handleFinishRename(session.id)
                                      } else if (e.key === 'Escape') {
                                        handleCancelRename()
                                      }
                                    }}
                                    className="flex-1 bg-transparent border border-sidebar-border/30 rounded-md px-3 py-1 text-sm focus:outline-none focus:border-sidebar-border/50 focus:bg-transparent focus:ring-0"
                                    autoFocus
                                    onClick={(e) => e.stopPropagation()}
                                    style={{ maxWidth: 'calc(100% - 5rem)' }}
                                  />
                                ) : (
                                  <div className="flex-1 min-w-0" style={{ paddingRight: '5rem' }}>
                                    <div className="truncate font-medium text-sm">{session.name}</div>
                                  </div>
                                )}
                              </div>
                                </button>
                              </SidebarMenuButton>
                              
                              {/* Session Actions */}
                              <div className={`absolute right-4 top-1/2 transform -translate-y-1/2 flex items-center gap-2 transition-opacity group-data-[collapsible=icon]:hidden ${hoveredSessionId === session.id ? 'opacity-100' : 'opacity-0'}`}>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleStartRename(session.id, session.name)
                                  }}
                                  className="h-8 w-8 p-0 hover:bg-sidebar-accent rounded-md"
                                  title="Rename session"
                                >
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleDeleteSession(session.id)
                                  }}
                                  className="h-8 w-8 p-0 hover:bg-destructive/20 hover:text-destructive rounded-md"
                                  title="Delete session"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </SidebarMenuItem>
                          )
                        })}
                    </SidebarMenu>
                  </div>
                </div>
              ))
            )}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={toggleTheme}>
              {theme === 'light' ? <Moon className="size-4" /> : <Sun className="size-4" />}
              <span>Toggle Theme</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton>
              <Settings className="size-4" />
              <span>Settings</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      
      <SidebarRail />
    </Sidebar>
  )
}