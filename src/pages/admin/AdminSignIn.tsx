import { Button, PasswordInput, Text, TextInput, Title } from "@mantine/core";
import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAdmin } from "../../lib/hooks";

type AdminSignInForm = {
  email: string;
  password: string;
};

export default function AdminSignIn() {
  const navigate = useNavigate();
  const location = useLocation();
  const from =
    (location.state as { from?: string } | null)?.from || "/admin";

  const [formData, setFormData] = useState<AdminSignInForm>({
    email: "",
    password: "",
  });

  const { user, signIn, isSigningIn } = useAdmin({
    extraOnSuccess: () => navigate(from, { replace: true }),
  });

  const handleSubmit = (event: React.FormEvent) => {
    // Without this the browser would navigate away on submit.
    event.preventDefault();
    // Sign-in shares one rate limit bucket with every other auth endpoint, so
    // a submission that cannot possibly succeed must not spend an attempt.
    if (!formData.email.trim() || !formData.password) return;
    signIn(formData);
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  if (user) return <Navigate to={from} replace />;

  return (
    <div className="min-h-screen flex items-center justify-center w-full bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-10 space-y-6">
          <div className="text-center space-y-2 mb-8">
            <Title order={1} className="text-3xl font-bold text-gray-900">
              Admin Login
            </Title>
            <Text size="md" c="dimmed" className="text-gray-600">
              Enter your credentials to access the admin panel
            </Text>
          </div>
          <form className="space-y-5" onSubmit={handleSubmit}>
            <TextInput
              label="Email Address"
              placeholder="admin@example.com"
              type="email"
              autoComplete="email"
              size="md"
              radius="md"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              classNames={{
                label: "mb-2 font-medium text-gray-700",
                input: "h-11",
              }}
            />
            <PasswordInput
              autoComplete="current-password"
              label="Password"
              placeholder="Enter your password"
              size="md"
              radius="md"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              classNames={{
                label: "mb-2 font-medium text-gray-700",
                input: "h-11",
              }}
            />
            <Button
              radius="md"
              fullWidth
              size="md"
              disabled={isSigningIn}
              type="submit"
              className="h-11 mt-6 font-semibold bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              {isSigningIn ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
