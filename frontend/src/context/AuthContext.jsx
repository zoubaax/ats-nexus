import React, { createContext, useContext, useState, useEffect } from 'react';
import { login as apiLogin, register as apiRegister, getMe, getSettings, updateSettings } from '../lib/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('ats_token'));
  const [loading, setLoading] = useState(true);
  const [selectedProvider, setSelectedProvider] = useState('groq');
  const [aiKeys, setAiKeys] = useState({ groq: '', nvidia: '', gemini: '', openai: '', ollama_url: 'http://localhost:11434' });

  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          const userData = await getMe();
          setUser(userData);

          // Fetch Settings & Saved Keys from Neon DB
          try {
            const settingsData = await getSettings();
            if (settingsData.default_ai_provider) {
              setSelectedProvider(settingsData.default_ai_provider);
            }
            if (settingsData.ai_keys) {
              setAiKeys((prev) => ({ ...prev, ...settingsData.ai_keys }));
            }
          } catch (settingsErr) {
            console.warn('Could not load user settings from DB:', settingsErr);
          }
        } catch (err) {
          console.error('Session expired or invalid token:', err);
          logout();
        }
      }
      setLoading(false);
    };
    initAuth();
  }, [token]);

  const saveAiKeys = async (newKeys, newProvider) => {
    const updatedKeys = { ...aiKeys, ...newKeys };
    const providerToSave = newProvider || selectedProvider;
    
    setAiKeys(updatedKeys);
    if (newProvider) setSelectedProvider(newProvider);

    if (token) {
      try {
        await updateSettings({
          default_ai_provider: providerToSave,
          ai_keys: updatedKeys,
        });
      } catch (err) {
        console.error('Failed to sync AI settings with Neon DB:', err);
      }
    }
  };

  const changeProvider = async (provider) => {
    setSelectedProvider(provider);
    if (token) {
      try {
        await updateSettings({
          default_ai_provider: provider,
          ai_keys: aiKeys,
        });
      } catch (err) {
        console.error('Failed to update provider in Neon DB:', err);
      }
    }
  };

  const getActiveKey = () => {
    return aiKeys[selectedProvider] || '';
  };

  const loginUser = async (email, password) => {
    const data = await apiLogin(email, password);
    setToken(data.access_token);
    setUser(data.user);
    return data;
  };

  const registerUser = async (email, password, fullName) => {
    const data = await apiRegister(email, password, fullName);
    setToken(data.access_token);
    setUser(data.user);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('ats_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login: loginUser,
        register: registerUser,
        logout,
        selectedProvider,
        setSelectedProvider: changeProvider,
        aiKeys,
        saveAiKeys,
        getActiveKey,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
