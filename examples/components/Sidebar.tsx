/**
 * Sidebar Component - ShadCN sidebar-07 pattern
 * Collapsible sidebar with session management and theme toggle
 */

import React, { useState } from 'react';
import { 
  Sidebar, 
  SidebarContent, 
  SidebarHeader, 
  SidebarFooter, 
  SidebarGroup, 
  SidebarGroupContent, 
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuAction,
  SidebarProvider,
  SidebarTrigger
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { 
  MessageCircle, 
  Plus, 
  Settings, 
  Moon, 
  Sun, 
  MoreHorizontal,
  Edit2,
  Trash2,
  User
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ChatSession, SessionListProps, Theme } from '../types';

// Session item component
const SessionItem: React.FC<{
  session: ChatSession;
  isActive: boolean;
  onSelect: () => void;
  onRename: (newName: string) => void;
  onDelete: () => void;
}> = ({ session, isActive, onSelect, onRename, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(session.name);

  const handleRename = () => {
    if (editName.trim() && editName !== session.name) {
      onRename(editName.trim());
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleRename();
    } else if (e.key === 'Escape') {
      setEditName(session.name);
      setIsEditing(false);
    }
  };

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        onClick={onSelect}
        isActive={isActive}
        className={cn(
          "group relative h-12 justify-start",
          isActive && "bg-primary/10 text-primary"
        )}
      >
        <MessageCircle className="h-4 w-4 mr-3" />
        
        {isEditing ? (
          <input
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={handleRename}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent border-none outline-none text-sm"
            autoFocus
          />
        ) : (
          <div className="flex-1 text-left">
            <div className="text-sm font-medium truncate">{session.name}</div>
            <div className="text-xs text-muted-foreground">
              {session.metadata.messageCount} messages
            </div>
          </div>
        )}

        {/* Badge for active sessions */}
        {session.metadata.isActive && (
          <Badge variant="secondary" className="ml-2">
            Active
          </Badge>
        )}
      </SidebarMenuButton>

      {/* Context menu */}
      <SidebarMenuAction>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setIsEditing(true)}>
              <Edit2 className="h-4 w-4 mr-2" />
              Rename
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={onDelete}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuAction>
    </SidebarMenuItem>
  );
};

// Theme toggle component
const ThemeToggle: React.FC<{ theme: Theme; onToggle: () => void }> = ({ 
  theme, 
  onToggle 
}) => {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onToggle}
      className="h-8 w-8 p-0"
      title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {theme === 'light' ? (
        <Moon className="h-4 w-4" />
      ) : (
        <Sun className="h-4 w-4" />
      )}
    </Button>
  );
};

// Main sidebar component
export const ChatSidebar: React.FC<SessionListProps & {
  theme: Theme;
  onThemeToggle: () => void;
  userInfo?: {
    name: string;
    email: string;
    avatar?: string;
  };
}> = ({
  sessions,
  currentSessionId,
  onSessionSelect,
  onSessionRename,
  onSessionDelete,
  onNewSession,
  theme,
  onThemeToggle,
  userInfo = { name: 'User', email: 'user@example.com' }
}) => {
  // Group sessions by date
  const groupedSessions = sessions.reduce((groups, session) => {
    const date = new Date(session.createdAt).toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(session);
    return groups;
  }, {} as Record<string, ChatSession[]>);

  // Sort dates (most recent first)
  const sortedDates = Object.keys(groupedSessions).sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
  );

  return (
    <Sidebar collapsible="icon" className="border-r">
      {/* Header */}
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <div className="flex items-center gap-2">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <MessageCircle className="size-4" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-semibold">Chat App</span>
                  <span className="text-xs text-muted-foreground">
                    v1.0.0
                  </span>
                </div>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* Content */}
      <SidebarContent>
        {/* New Chat Button */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={onNewSession} className="h-10">
                  <Plus className="h-4 w-4 mr-2" />
                  New Chat
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Sessions */}
        <SidebarGroup>
          <SidebarGroupLabel>Recent Chats</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {sortedDates.map(date => (
                <div key={date}>
                  {/* Date separator */}
                  <div className="px-3 py-1 text-xs text-muted-foreground font-medium">
                    {date === new Date().toDateString() ? 'Today' : 
                     date === new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString() ? 'Yesterday' : 
                     new Date(date).toLocaleDateString()}
                  </div>
                  
                  {/* Sessions for this date */}
                  {groupedSessions[date].map(session => (
                    <SessionItem
                      key={session.id}
                      session={session}
                      isActive={session.id === currentSessionId}
                      onSelect={() => onSessionSelect(session.id)}
                      onRename={(newName) => onSessionRename(session.id, newName)}
                      onDelete={() => onSessionDelete(session.id)}
                    />
                  ))}
                </div>
              ))}
              
              {/* Empty state */}
              {sessions.length === 0 && (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  No chats yet. Click "New Chat" to get started!
                </div>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage src={userInfo.avatar} alt={userInfo.name} />
                    <AvatarFallback className="rounded-lg">
                      {userInfo.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{userInfo.name}</span>
                    <span className="truncate text-xs text-muted-foreground">
                      {userInfo.email}
                    </span>
                  </div>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side="right"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <Avatar className="h-8 w-8 rounded-lg">
                      <AvatarImage src={userInfo.avatar} alt={userInfo.name} />
                      <AvatarFallback className="rounded-lg">
                        {userInfo.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">{userInfo.name}</span>
                      <span className="truncate text-xs text-muted-foreground">
                        {userInfo.email}
                      </span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onThemeToggle}>
                  {theme === 'light' ? (
                    <Moon className="h-4 w-4 mr-2" />
                  ) : (
                    <Sun className="h-4 w-4 mr-2" />
                  )}
                  {theme === 'light' ? 'Dark' : 'Light'} Mode
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <User className="h-4 w-4 mr-2" />
                  Profile
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
};

// Example usage with SidebarProvider
export const ChatSidebarExample: React.FC = () => {
  const [theme, setTheme] = useState<Theme>('light');
  const [currentSessionId, setCurrentSessionId] = useState<string | null>('1');
  
  const exampleSessions: ChatSession[] = [
    {
      id: '1',
      name: 'Data Analysis Project',
      createdAt: new Date(),
      updatedAt: new Date(),
      messages: [],
      metadata: {
        messageCount: 15,
        lastActivity: new Date(),
        isActive: true
      }
    },
    {
      id: '2',
      name: 'API Integration Help',
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      messages: [],
      metadata: {
        messageCount: 8,
        lastActivity: new Date(Date.now() - 24 * 60 * 60 * 1000),
        isActive: false
      }
    }
  ];

  const handleSessionSelect = (sessionId: string) => {
    setCurrentSessionId(sessionId);
    console.log('Selected session:', sessionId);
  };

  const handleSessionRename = (sessionId: string, newName: string) => {
    console.log('Rename session:', sessionId, 'to:', newName);
  };

  const handleSessionDelete = (sessionId: string) => {
    console.log('Delete session:', sessionId);
  };

  const handleNewSession = () => {
    console.log('Create new session');
  };

  return (
    <SidebarProvider>
      <div className="flex h-screen">
        <ChatSidebar
          sessions={exampleSessions}
          currentSessionId={currentSessionId}
          onSessionSelect={handleSessionSelect}
          onSessionRename={handleSessionRename}
          onSessionDelete={handleSessionDelete}
          onNewSession={handleNewSession}
          theme={theme}
          onThemeToggle={() => setTheme(theme === 'light' ? 'dark' : 'light')}
          userInfo={{
            name: 'John Doe',
            email: 'john@example.com'
          }}
        />
        
        <div className="flex-1 p-4">
          <div className="flex items-center gap-2 mb-4">
            <SidebarTrigger />
            <h1 className="text-xl font-semibold">Chat Application</h1>
          </div>
          
          <div className="text-muted-foreground">
            Main chat area would go here. Current session: {currentSessionId || 'None'}
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
};