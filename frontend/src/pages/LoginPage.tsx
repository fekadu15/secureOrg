
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useAuth } from '../context/AuthContext.js';

const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Email is required')
    .email('Please enter a valid email address')
    .max(254, 'Email address is too long')
    .transform((value) => value.toLowerCase()),

  password: z
    .string()
    .min(1, 'Password is required')
    .max(128, 'Password must not exceed 128 characters'),
});

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState<'credentials' | 'fido'>('credentials');
  const [rememberWorkstation, setRememberWorkstation] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
  }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setFieldErrors({});

    const validation = loginSchema.safeParse({ email, password });

    if (!validation.success) {
      const errors: { email?: string; password?: string } = {};

      validation.error.issues.forEach((issue) => {
        const field = issue.path[0] as 'email' | 'password';

        if (!errors[field]) {
          errors[field] = issue.message;
        }
      });

      setFieldErrors(errors);
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await login(validation.data);

      if (res?.mfaRequired) {
        navigate('/mfa-verification');
      } else {
        navigate('/dashboard');
      }
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : 'Invalid authentication credentials.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-surface font-sans text-on-surface min-h-screen relative flex flex-col justify-between selection:bg-secondary-container selection:text-on-secondary-container">

      <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(#dfe8ff_1px,transparent_1px)] [background-size:24px_24px] opacity-60"></div>

     

      <main className="relative z-10 w-full flex-1 flex flex-col items-center justify-center px-margin py-space-md">
        <div className="flex flex-col w-full items-center justify-center max-w-xl mx-auto">
          {/* Operational Status Banner */}
          <div className="w-full mb-space-md flex items-center justify-between px-space-md py-space-xs rounded-lg bg-surface-container-low text-on-surface-variant shadow-sm border border-outline-variant/30">
            
          </div>

          {/* Primary Authentication Card */}
          <div className="w-full bg-surface-container-lowest rounded-xl shadow-md border border-outline-variant/30 p-space-lg relative overflow-hidden">
            {/* Top Accent Gradient Bar */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-secondary to-primary-container"></div>

            {/* Header inside Card */}
            <div className="flex flex-col items-center text-center mb-space-lg">
              <div className="w-14 h-14 rounded-xl bg-primary flex items-center justify-center shadow-md mb-space-sm relative group text-on-primary">
                <span className="material-symbols-outlined text-[30px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  security
                </span>
                <span className="material-symbols-outlined text-secondary-fixed-dim absolute bottom-1 right-1 text-[14px]">
                  key
                </span>
              </div>
              <h1 className="font-headline-sm text-headline-sm text-on-surface font-bold tracking-tight">
                Sign In to SecureOrg
              </h1>
              
            </div>

            {/* Mode Selector Tabs */}
            <div className="grid grid-cols-2 gap-space-xs p-1 rounded-lg bg-surface-container-low mb-space-lg text-label-md font-medium">
              <button
                type="button"
                onClick={() => setActiveTab('credentials')}
                className={`py-2 rounded flex items-center justify-center gap-1.5 transition-all text-[13px] ${
                  activeTab === 'credentials'
                    ? 'bg-surface-container-lowest text-primary font-bold shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">badge</span>
                Use Password
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('fido')}
                className={`py-2 rounded flex items-center justify-center gap-1.5 transition-all text-[13px] ${
                  activeTab === 'fido'
                    ? 'bg-surface-container-lowest text-primary font-bold shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">fingerprint</span>
                Hardware FIDO2 Token
              </button>
            </div>

            {/* Error Notification */}
            {errorMsg && (
              <div role="alert" className="mb-space-md p-space-sm rounded-lg bg-error-container text-on-error-container flex items-center gap-space-sm text-[13px] font-medium border border-error/30">
                <span className="material-symbols-outlined text-[18px]">error</span>
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Form */}
            {activeTab === 'credentials' ? (
              <form onSubmit={handleSubmit} className="space-y-space-md" noValidate>
                {/* Email Input */}
                <div className="flex flex-col space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="font-label-lg text-[13px] font-semibold text-on-surface" htmlFor="email">
                      Work Email or Identity Identifier
                    </label>
                  
                  </div>
                  <div className="relative flex items-center">
                    <span className="material-symbols-outlined absolute left-3 text-outline text-[20px] pointer-events-none">
                      alternate_email
                    </span>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setFieldErrors((prev) => ({ ...prev, email: undefined }));
                      }}
                      required
                      aria-invalid={!!fieldErrors.email}
                      aria-describedby={fieldErrors.email ? 'email-error' : undefined}
                      placeholder="example.secureOrg.io"
                      className={`w-full h-11 pl-10 pr-4 bg-surface-container-low border rounded-lg font-body-md text-[14px] text-on-surface placeholder:text-outline focus:outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-secondary transition-all ${
                        fieldErrors.email ? 'border-error' : 'border-outline-variant/30'
                      }`}
                    />
                  </div>
                  {fieldErrors.email ? (
                    <span id="email-error" className="text-error text-[11px] pl-1">
                      {fieldErrors.email}
                    </span>
                  ) : (
                    <span className="font-label-sm text-[11px] text-on-surface-variant pl-1">
                      Enterprise Single Sign-On 
                    </span>
                  )}
                </div>

                <div className="flex flex-col space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="font-label-lg text-[13px] font-semibold text-on-surface" htmlFor="password">
                      Master Password
                    </label>
                   
                  </div>
                  <div className="relative flex items-center">
                    <span className="material-symbols-outlined absolute left-3 text-outline text-[20px] pointer-events-none">
                      password
                    </span>
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setFieldErrors((prev) => ({ ...prev, password: undefined }));
                      }}
                      required
                      aria-invalid={!!fieldErrors.password}
                      aria-describedby={fieldErrors.password ? 'password-error' : undefined}
                      placeholder="••••••••••••••••"
                      className={`w-full h-11 pl-10 pr-11 bg-surface-container-low border rounded-lg font-body-md text-[14px] text-on-surface placeholder:text-outline focus:outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-secondary transition-all ${
                        fieldErrors.password ? 'border-error' : 'border-outline-variant/30'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 text-outline hover:text-on-surface transition-colors p-1 flex items-center justify-center"
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        {showPassword ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                  {fieldErrors.password && (
                    <span id="password-error" className="text-error text-[11px] pl-1">
                      {fieldErrors.password}
                    </span>
                  )}
                </div>

                {/* Remember & Forgot Password Link */}
                <div className="flex items-center justify-between pt-space-xs">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={rememberWorkstation}
                      onChange={(e) => setRememberWorkstation(e.target.checked)}
                      className="w-4 h-4 rounded text-primary-container focus:ring-0 cursor-pointer accent-primary-container"
                    />
                    <span className="font-body-sm text-[13px] text-on-surface group-hover:text-primary transition-colors select-none">
                      Remember workstation for 12 hours
                    </span>
                  </label>
                  <Link
                    to="/forgot-password"
                    className="font-label-lg text-[13px] font-semibold text-secondary hover:text-primary transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-12 bg-primary-container hover:bg-primary text-on-primary rounded-lg font-label-lg text-[14px] font-bold flex items-center justify-center gap-2 shadow-sm transition-all duration-150 active:scale-[0.99] mt-space-md disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[18px]">verified_user</span>
                  <span>{isSubmitting ? 'Authenticating...' : 'Authenticate & Continue'}</span>
                  <span className="material-symbols-outlined text-[18px] ml-0.5">arrow_forward</span>
                </button>
              </form>
            ) : (
              <div className="py-space-xl flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center mb-space-md animate-pulse">
                  <span className="material-symbols-outlined text-[32px]">fingerprint</span>
                </div>
                <h3 className="font-title-md text-on-surface font-semibold mb-1">Touch your security key</h3>

                <button
                  type="button"
                  onClick={() => setActiveTab('credentials')}
                  className="text-secondary text-[13px] font-semibold hover:underline"
                >
                  Back to Password Sign-In
                </button>
              </div>
            )}

            {/* Divider for Sign Up */}
            <div className="relative flex items-center justify-center my-space-lg">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full h-[1px] bg-surface-container-highest"></div>
              </div>
              <span className="relative px-3 bg-surface-container-lowest font-label-sm text-[11px] text-on-surface-variant uppercase tracking-wider font-semibold">
                New User Onboarding
              </span>
            </div>

            {/* Go to Register Page Button */}
            <Link
              to="/register"
              className="w-full h-11 rounded-lg bg-surface-container-low hover:bg-surface-container border border-outline-variant/30 text-on-surface font-label-lg text-[13px] font-semibold flex items-center justify-center gap-2.5 transition-colors group"
            >
              <span className="material-symbols-outlined text-secondary group-hover:text-primary text-[20px]">
                person_add
              </span>
              <span>Need an account? Sign Up for SecureOrg</span>
            </Link>

            {/* Security Notice */}
            <div className="mt-space-lg p-space-md rounded-lg bg-surface-container-low text-on-surface-variant flex gap-space-sm items-start border border-outline-variant/20">
              <div className="p-1 rounded bg-surface-container text-secondary flex-shrink-0 mt-0.5">
                <span className="material-symbols-outlined text-[16px]">verified</span>
              </div>
              <div className="flex flex-col space-y-1 text-left">
                <span className="font-label-sm text-[12px] text-on-surface font-bold">
                  Zero-Trust Protocol • Tamper-Evident Audit Logging
                </span>
                <p className="font-body-sm text-[12px] text-on-surface-variant leading-relaxed">
                  Every authentication attempt and authorization decision is verified server-side and recorded to a cryptographic SHA-256 hash-chain audit log.
                </p>
              </div>
            </div>
          </div>

          {/* Workstation Telemetry */}
          <div className="w-full mt-space-md flex flex-wrap items-center justify-between text-on-surface-variant text-[11px] font-medium px-space-xs gap-y-2">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[15px] text-secondary">terminal</span>
              <span className="font-mono">ENCLAVE: SECURE-AASTU-2026</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[15px] text-secondary">memory</span>
              <span>TLS 1.3 / AES-256-GCM</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[15px] text-secondary">fingerprint</span>
              <span className="font-mono">POSTGRES: SecureOrg</span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full py-4 text-center text-on-surface-variant text-[12px]">
        SecureOrg &copy; 2026 Addis Ababa Science and Technology University. Computer System Security Project.
      </footer>
    </div>
  );
};
