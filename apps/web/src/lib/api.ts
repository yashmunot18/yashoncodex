import axios from 'axios';

// Client-side: uses public URL (browser → host)
// Server-side: uses internal Docker URL (container → container)
const CLIENT_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
const SERVER_API_URL = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const API_URL =
  typeof window !== 'undefined' ? CLIENT_API_URL : SERVER_API_URL;

export const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
});

export default api;
