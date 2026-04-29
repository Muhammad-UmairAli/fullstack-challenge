'use client';

import React, { createContext, useContext } from 'react';
import type { ReactNode } from 'react';

/**
 * 👤 SESSION CONTEXT
 * Provides the user profile to all client components in the tree.
 */

type User = {
  id: string;
  email: string;
  name?: string;
} | null;

interface SessionContextType {
  user: User;
  isAuthenticated: boolean;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function SessionProvider({
  children,
  user,
}: {
  children: ReactNode;
  user: User;
}) {
  return (
    <SessionContext.Provider value={{ user, isAuthenticated: !!user }}>
      {children}
    </SessionContext.Provider>
  );
}

/**
 * 🎣 USE USER HOOK
 * The standard way to access the current session in client components.
 */
export function useUser() {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a SessionProvider');
  }
  return context;
}
