import { toastError } from "@/lib/utils";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { API_URL } from "../Constants";
import { api, queryClient } from "../lib/api";
import { supabase } from "../lib/supabase";
import PhoneVerificationModal from "@/components1/PhoneVerificationModal";

type PendingGoogleAuth = {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  fullName: string;
  userId: string;
  photoURL: string | null;
};

const buildGooglePassword = (userId: string) => {
  const rawId = userId.replace(/[^a-zA-Z0-9]/g, "");
  const idPart = rawId.length >= 6 ? rawId.slice(0, 6) : rawId.padEnd(6, "0");
  let password = `Google${idPart}123!`;

  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  if (!hasLetter) {
    password = `G${password}`;
  }
  if (!hasNumber) {
    password = `${password}1`;
  }
  if (password.length < 8) {
    password = password.padEnd(8, "0");
  }

  return password;
};

const AuthCallback = () => {
  const navigate = useNavigate();
  const [pendingAuth, setPendingAuth] = useState<PendingGoogleAuth | null>(null);
  const [showPhoneVerification, setShowPhoneVerification] = useState(false);

  useEffect(() => {
    let isMounted = true;

        const finishAuth = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const code = params.get("code");
        const mode = params.get("mode");
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            throw error;
          }
        }

        const { data: sessionData, error: sessionError } =
          await supabase.auth.getSession();
        let session = sessionData.session;

        if (!session && window.location.hash.includes("access_token")) {
          const hashParams = new URLSearchParams(window.location.hash.slice(1));
          const accessToken = hashParams.get("access_token");
          const refreshToken = hashParams.get("refresh_token");
          if (accessToken && refreshToken) {
            const { data: setSessionData, error: setSessionError } =
              await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken,
              });
            if (setSessionError) {
              throw setSessionError;
            }
            session = setSessionData.session ?? null;
          }
        }

        const user = session?.user ?? null;

        if (sessionError || !user) {
          throw new Error(sessionError?.message || "No Supabase session found");
        }
        const email = user.email ?? "";
        const fullName =
          (typeof user.user_metadata?.full_name === "string" &&
            user.user_metadata.full_name) ||
          (typeof user.user_metadata?.name === "string" &&
            user.user_metadata.name) ||
          "User";
        const nameParts = fullName.trim().split(" ");
        const firstName = nameParts[0] || "User";
        const lastName = nameParts.slice(1).join(" ");
        const password = buildGooglePassword(user.id);

        if (mode === "signup") {
          if (isMounted) {
            setPendingAuth({
              email,
              firstName,
              lastName,
              password,
              fullName,
              userId: user.id,
              photoURL: (user.user_metadata?.avatar_url as string | undefined) ?? null,
            });
            setShowPhoneVerification(true);
          }

          return;
        }

        queryClient.clear();
        localStorage.removeItem("studentAuth");

        try {
          const response = await api().post(`${API_URL}/auth/sign-in`, {
            email,
            password,
            isGoogleAuth: true,
            googleData: {
              name: fullName,
              googleId: user.id,
              photoURL: user.user_metadata?.avatar_url ?? null,
            },
          });

          const authData = {
            ...response.data.data,
            timestamp: Date.now(),
          };
          queryClient.setQueryData(["auth"], response.data.data);
          localStorage.setItem("studentAuth", JSON.stringify(authData));
          toast.success("Login was successful!");
        } catch (signInError: any) {
          // If sign-in fails and we are not in signup mode, do NOT auto-register.
          // Throw an error so the user is informed they need to sign up first.
          const rawError =
            signInError?.response?.data?.error ||
            signInError?.response?.data?.message ||
            "";
          const normalizedError = rawError.trim().toLowerCase();

          if (normalizedError === "invalid credentials") {
            throw new Error("Invalid credentials.");
          }

          if (normalizedError === "user not found") {
            throw new Error("User not Found! Please sign up first");
          }

          throw new Error(
            rawError || "User not Found! Please sign up first",
          );
        }

        if (isMounted) {
          navigate("/");
        }
      } catch (error: any) {
        console.error("Supabase OAuth callback failed:", error);
        toastError(error, "Authentication failed");
        if (isMounted) {
          navigate("/login");
        }
      }
    };

    void finishAuth();

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  const handlePhoneVerificationSuccess = async (phoneNumber: string) => {
    if (!pendingAuth) {
      toast.error("Missing Google sign-up details. Please try again.");
      navigate("/login");
      return;
    }

    try {
      queryClient.clear();
      localStorage.removeItem("studentAuth");

      try {
        const response = await api().post(`${API_URL}/auth/sign-in`, {
          email: pendingAuth.email,
          password: pendingAuth.password,
          isGoogleAuth: true,
          googleData: {
            name: pendingAuth.fullName,
            googleId: pendingAuth.userId,
            photoURL: pendingAuth.photoURL,
          },
        });

        const authData = {
          ...response.data.data,
          timestamp: Date.now(),
        };
        queryClient.setQueryData(["auth"], response.data.data);
        localStorage.setItem("studentAuth", JSON.stringify(authData));
        toast.success("Login was successful!");
      } catch (signInError) {
        await api().post(`${API_URL}/auth/register`, {
          email: pendingAuth.email,
          firstName: pendingAuth.firstName,
          lastName: pendingAuth.lastName,
          password: pendingAuth.password,
          confirmPassword: pendingAuth.password,
          mobile: phoneNumber,
          isGoogleAuth: true,
          googleId: pendingAuth.userId,
        });

        const response = await api().post(`${API_URL}/auth/sign-in`, {
          email: pendingAuth.email,
          password: pendingAuth.password,
          isGoogleAuth: true,
          googleData: {
            name: pendingAuth.fullName,
            googleId: pendingAuth.userId,
            photoURL: pendingAuth.photoURL,
          },
        });

        const authData = {
          ...response.data.data,
          timestamp: Date.now(),
        };
        queryClient.setQueryData(["auth"], response.data.data);
        localStorage.setItem("studentAuth", JSON.stringify(authData));
        toast.success("Login was successful!");
      }

      setShowPhoneVerification(false);
      navigate("/");
    } catch (error: any) {
      console.error("Supabase OAuth phone verification failed:", error);
      toastError(error, "Authentication failed");
      setShowPhoneVerification(false);
      navigate("/login");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <PhoneVerificationModal
        isOpen={showPhoneVerification}
        onClose={() => setShowPhoneVerification(false)}
        onSuccess={handlePhoneVerificationSuccess}
        userEmail={pendingAuth?.email ?? ""}
      />
      <div className="text-center">
        <div className="inline-block h-10 w-10 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
        <p className="mt-4 text-gray-700">Completing sign-in...</p>
      </div>
    </div>
  );
};

export default AuthCallback;
