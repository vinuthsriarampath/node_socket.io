import React, { createContext, useState, useEffect } from 'react';
import { authGlobals } from './AuthGlobals';
import { refreshToken } from '../services/AuthService';

interface AuthContextType {
  accessToken: string | null;
  setAccessToken: (token: string | null) => void;
  isLoggedIn: () => Promise<boolean>;
  clearAuth: () => void;
  initializing: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
export default AuthContext;

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [accessToken, setAccessTokenState] = useState<string | null>(null);
  const [initializing, setInitializing] = useState(true);

  const setAccessToken = (token: string | null) => {
    setAccessTokenState(token);
    authGlobals.setAccessToken(token);
  };

  const isLoggedIn = async () => {
    if (accessToken) {
      return true;
    }
    try {
      const data = await refreshToken();
      if (data && data.accessToken) {
        setAccessToken(data.accessToken);
        return true;
      }
      setAccessToken(null);
      return false;
    } catch {
      setAccessToken(null);
      return false;
    }
  };
  const clearAuth = () => setAccessToken(null);

  // On mount, try to fetch a new access token using refresh token
  useEffect(() => {
    const bootstrapAuth = async () => {
      if (authGlobals.accessToken) {
        setAccessToken(authGlobals.accessToken);
        setInitializing(false);
        return;
      }
      try {
        const data = await refreshToken();
        setAccessToken(data.accessToken);
      } catch {
        console.log("error in context")
        setAccessToken(null);
      } finally {
        console.log("context finally")
        setInitializing(false);
      }
    };
    bootstrapAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ accessToken, setAccessToken, isLoggedIn, clearAuth, initializing }}>
      {children}
    </AuthContext.Provider>
  );
};