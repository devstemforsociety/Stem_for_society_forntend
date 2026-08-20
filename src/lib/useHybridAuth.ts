import { toastError } from "@/lib/utils";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  signInWithGoogle as supabaseSignInWithGoogle,
  signOutUser as supabaseSignOut,
  onAuthStateChange,
  type AuthUser,
} from "./supabaseAuth";
import { useUser } from "./hooks";

type UseHybridAuthArgs = {
  extraOnSuccess?: () => void;
};

export function useHybridAuth({ extraOnSuccess = () => null }: UseHybridAuthArgs = {}) {
  const [supabaseUser, setSupabaseUser] = useState<AuthUser | null>(null);
  const [isSupabaseLoading, setIsSupabaseLoading] = useState(true);
  const navigate = useNavigate();
  
  // Use existing email auth system
  const { user: emailUser, signIn: emailSignIn, signOut: emailSignOut, isSigningIn, isLoading: emailLoading } = useUser({ extraOnSuccess });

  // Listen to Supabase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChange((user) => {
      setSupabaseUser(user);
      setIsSupabaseLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Always prioritize emailUser (backend authenticated user) over supabaseUser
  const user = emailUser;

  const isLoading = emailLoading || isSupabaseLoading;

  // Start Google OAuth flow (backend sign-in happens in callback page)
  const signInGoogle = async () => {
    try {
      await supabaseSignInWithGoogle();
    } catch (error: any) {
      toastError(error, "Failed to sign in with Google");
    }
  };

  // Combined sign out
  const signOut = async () => {
    try {
      // Sign out from both systems
      if (supabaseUser) {
        await supabaseSignOut();
        setSupabaseUser(null);
      }
      if (emailUser) {
        emailSignOut();
      }
      navigate("/login");
    } catch (error: any) {
      toastError(error, "Failed to sign out");
    }
  };

  return {
    user,
    isLoading,
    isError: false,
    isSigningIn,
    signIn: emailSignIn, // Keep email sign-in for backend integration
    signInGoogle,
    signOut,
    supabaseUser,
    emailUser
  };
}
