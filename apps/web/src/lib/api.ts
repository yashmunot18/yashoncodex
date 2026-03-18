import axios from 'axios';

const API_URL =
  typeof window !== 'undefined'
    ? (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000')
    : (process.env.NEXT_PUBLIC_API_URL || 'http://api:4000');

export const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
});

export default api;
