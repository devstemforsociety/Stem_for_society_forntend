import { supabase } from "./supabase";

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

const toAuthUser = (user: {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, unknown> | null;
}): AuthUser => {
  const metadata = user.user_metadata ?? {};

  return {
    uid: user.id,
    email: user.email ?? null,
    displayName:
      (typeof metadata.full_name === "string" && metadata.full_name) ||
      (typeof metadata.name === "string" && metadata.name) ||
      null,
    photoURL:
      (typeof metadata.avatar_url === "string" && metadata.avatar_url) ||
      null,
  };
};

export const signInWithGoogle = async (
  mode: "signin" | "signup" = "signin",
): Promise<void> => {
  const redirectTo = `${window.location.origin}/auth/callback?mode=${mode}`;
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo },
  });

  if (error) {
    throw new Error(error.message || "Failed to sign in with Google");
  }
};

export const signOutUser = async (): Promise<void> => {
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw new Error(error.message || "Failed to sign out");
  }
};

export const onAuthStateChange = (callback: (user: AuthUser | null) => void) => {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    const user = session?.user ? toAuthUser(session.user) : null;
    callback(user);
  });

  return () => data.subscription.unsubscribe();
};

export const getCurrentUser = async (): Promise<AuthUser | null> => {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    return null;
  }

  return toAuthUser(data.user);
};

export const signUpWithGoogle = signInWithGoogle;
