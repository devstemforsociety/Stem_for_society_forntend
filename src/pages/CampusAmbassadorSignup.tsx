import React, { useState } from 'react';
import { PasswordInput } from "@/components1/ui/password-input";
import { usePartner } from '@/lib/hooks';
import { Button } from '@/components1/ui/button';
import { Input } from '@/components1/ui/input';
import { Checkbox } from '@/components1/ui/checkbox';
import { Mail, User } from 'lucide-react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import SignupLayout from '@/components1/ui/SignupLayout'


type PartnerSignInForm = {
  email: string;
  password: string;
};

const CampusAmbassadorSignup = () => {
  const { user } = usePartner();
  const navigate = useNavigate();

  const [formData, setFormData] = useState<PartnerSignInForm>({
    email: '',
    password: '',
  });

  const { signIn, isSigningIn } = usePartner({
    extraOnSuccess: () => navigate('/partner'), // old design redirect
  });

  const [rememberPassword, setRememberPassword] = useState(false);

  const handleSubmit = (event?: React.FormEvent) => {
    if (event) event.preventDefault(); // prevent reload
    //signIn(formData);
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  if (user) return <Navigate to="/partner" />;

  return (
    <SignupLayout 
      title="Innovate, Incubate and Impact the world together!" 
      subtitle="Join us to Innovate, Incubate and Impact!"
    >
      <div className="w-full max-w-md mx-auto">
        <div className="text-center mb-6">
        <p className="text-2xl font-bold text-gray-800 mb-2  drop-shadow-md ">Partner with us to transform education!</p></div>

        <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <Input
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  autoCapitalize="none"
                  autoCorrect="off"
                  placeholder="Email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-white/90 backdrop-blur-sm border border-white/50 rounded-xl placeholder-gray-500 focus:ring-2 focus:ring-[#0389FF] focus:border-transparent shadow-lg"
                />
              </div>

              <div>
                <PasswordInput
                  autoComplete="new-password"
                                    placeholder="Password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-white/90 backdrop-blur-sm border border-white/50 rounded-xl placeholder-gray-500 focus:ring-2 focus:ring-[#0389FF] focus:border-transparent shadow-lg"
                />
              </div>

              <div className="flex items-center justify-between py-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="remember"
                    checked={rememberPassword}
                    onCheckedChange={(checked) => setRememberPassword(checked as boolean)}
                    className="data-[state=checked]:bg-[#0389FF] data-[state=checked]:border-[#0389FF] border-white/50 bg-white/30"
                  />
                  <label htmlFor="remember" className="text-sm text-white/90">
                    Remember Password
                  </label>
                </div>
                <button type="button" className="text-sm text-[#0389FF] hover:text-[#0389FF]/80 font-medium">
                  Forget Password?
                </button>
              </div>

              <Button
                className="w-full bg-[#0389FF] hover:bg-[#0389FF]/90 text-white py-3 rounded-xl font-semibold shadow-lg"
                disabled={isSigningIn}
                type="submit"
              >
                LOGIN
              </Button>
            </form>

            <div className="mt-6 w-full max-w-md mx-auto text-center">
              <p className="text-sm text-gray-600">
                Don't have an account?{' '}
                <Link to="/campus-ambassador" className="text-[#0389FF] hover:underline">
                  Sign up
                </Link>
              </p>
            </div>

      </div>
    </SignupLayout>
  );
};

export default CampusAmbassadorSignup;
