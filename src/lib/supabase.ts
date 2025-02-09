import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: {
    flowType: 'pkce',
    autoRefreshToken: true,
    detectSessionInUrl: true,
    persistSession: true,
    storage: window.localStorage,
    storageKey: 'supabase.auth.token',
    redirectTo: window.location.origin
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
  db: {
    schema: 'public',
  },
  global: {
    headers: {
      'X-Client-Info': 'supabase-js-web',
    },
  },
});

// Add connection health check
let isConnected = false;

export const checkConnection = async () => {
  try {
    const { error } = await supabase.from('messages').select('count', { count: 'exact', head: true });
    isConnected = !error;
    return isConnected;
  } catch (err) {
    isConnected = false;
    return false;
  }
};

// Initialize connection check
checkConnection();

// Retry logic for failed requests
export const retryOperation = async (
  operation: () => Promise<any>,
  maxRetries = 3,
  delay = 1000
): Promise<any> => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
      await checkConnection();
    }
  }
};

// Handle sign out with cleanup
export const signOut = async () => {
  try {
    // Clear any realtime subscriptions
    const channels = supabase.getChannels();
    channels.forEach(channel => {
      supabase.removeChannel(channel);
    });

    // Clear local storage
    const storageKey = supabase.auth.storageKey;
    if (storageKey) {
      window.localStorage.removeItem(storageKey);
    }

    // Sign out from Supabase
    const { error } = await supabase.auth.signOut();
    if (error) throw error;

    // Clear any remaining auth data
    window.localStorage.removeItem('supabase.auth.token');
    window.localStorage.removeItem('supabase.auth.refreshToken');

    // Redirect to home page
    window.location.href = '/';

    return { error: null };
  } catch (error) {
    console.error('Error during sign out:', error);
    return { error };
  }
};