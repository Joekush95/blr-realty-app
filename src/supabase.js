// ─── Supabase Client ──────────────────────────────────────────────────────────
// Storage: expo-sqlite via a custom AsyncStorage-compatible adapter.
// This stores Supabase session tokens in a local SQLite database instead of
// relying on the in-memory or React Native AsyncStorage defaults, giving
// persistent sessions that survive app restarts without any native module setup.

import 'react-native-url-polyfill/auto';
import * as SQLite from 'expo-sqlite';
import { createClient } from '@supabase/supabase-js';

// ── SQLite storage adapter ────────────────────────────────────────────────────
// Opens (or creates) a small SQLite database and exposes a key-value API that
// matches the AsyncStorage interface Supabase auth expects.
const db = SQLite.openDatabaseSync('blr_realty_storage.db');

// Create the KV table synchronously on module load
db.execSync(`
  CREATE TABLE IF NOT EXISTS kv_storage (
    key   TEXT PRIMARY KEY NOT NULL,
    value TEXT
  );
`);

const SQLiteStorageAdapter = {
  async getItem(key) {
    try {
      const row = db.getFirstSync(
        'SELECT value FROM kv_storage WHERE key = ?',
        key
      );
      return row ? row.value : null;
    } catch {
      return null;
    }
  },

  async setItem(key, value) {
    try {
      db.runSync(
        'INSERT OR REPLACE INTO kv_storage (key, value) VALUES (?, ?)',
        key,
        value
      );
    } catch (err) {
      console.warn('[SQLiteStorage] setItem error:', err);
    }
  },

  async removeItem(key) {
    try {
      db.runSync('DELETE FROM kv_storage WHERE key = ?', key);
    } catch (err) {
      console.warn('[SQLiteStorage] removeItem error:', err);
    }
  },
};

// ── Replace these with your actual Supabase project values ───────────────────
// Found in: Supabase Dashboard → Project Settings → API
const SUPABASE_URL = 'https://YOUR_PROJECT_ID.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: SQLiteStorageAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
