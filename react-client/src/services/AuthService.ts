import axios from 'axios';
import { useContext } from 'react';
import AuthContext from '../context/AuthContext';

const apiUrl = 'http://localhost:8080/api/auth';

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export const registerUser = async (userDetails: any) => {
  const response = await axios.post(`${apiUrl}/register`, userDetails);
  return response.data;
};

export const login = async (credentials: any) => {
  const response = await axios.post<{ accessToken: string }>(`${apiUrl}/login`, credentials, { withCredentials: true });
  return response.data;
};

export const refreshToken = async () => {
  const response = await axios.post<{ accessToken: string }>(`${apiUrl}/refresh`, {}, { withCredentials: true });
  return response.data;
};

export const logout = async () => {
  const response = await axios.post(`${apiUrl}/logout`, {}, { withCredentials: true });
  return response.data;
};