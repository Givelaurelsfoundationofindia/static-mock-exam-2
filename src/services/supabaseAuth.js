import { createClient } from '@supabase/supabase-js';

// Direct browser-to-Supabase authentication service for GTST+ Student Portal
export const SUPABASE_URL = 
  import.meta.env?.VITE_SUPABASE_URL ||
  import.meta.env?.NEXT_PUBLIC_SUPABASE_URL ||
  "https://dxhhoadmmczmjxasgacu.supabase.co";

export const NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY =
  import.meta.env?.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env?.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  "sb_publishable_dHF-uQTRMLVWKD3ViawuzQ_ngNAj_ga";

export const SUPABASE_ANON_KEY = NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

// Official Supabase JS Client instance
export const supabase = createClient(SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true
  }
});

/**
 * Strictly authenticates against the live Supabase registrations table.
 * Does NOT generate fake/mock data.
 * Rejects unregistered Aadhaar numbers and invalid passwords.
 */
export async function supabaseStudentLogin(aadhaarNumber, password) {
  const cleanAadhaar = String(aadhaarNumber || '').replace(/\D/g, '');
  const cleanPassword = String(password || '').trim();

  if (cleanAadhaar.length !== 12) {
    return {
      success: false,
      message: 'Please enter a valid 12-digit Aadhaar number.'
    };
  }

  if (!cleanPassword) {
    return {
      success: false,
      message: 'Please enter your password or Date of Birth.'
    };
  }

  try {
    const { data: result, error: rpcError } = await supabase.rpc('student_login', {
      p_aadhaar: cleanAadhaar,
      p_password: cleanPassword
    });

    if (rpcError) {
      console.error('Supabase authentication error:', rpcError);
      return {
        success: false,
        message: rpcError.message || 'Authentication error from server.'
      };
    }

    if (!result) {
      return {
        success: false,
        message: 'No response from database. Please verify your connection.'
      };
    }

    // Only allow real registered students returned by Supabase
    return result;
  } catch (err) {
    console.error('Supabase network error:', err);
    return {
      success: false,
      message: err.message || 'Network error connecting to database. Please check your internet connection.'
    };
  }
}
