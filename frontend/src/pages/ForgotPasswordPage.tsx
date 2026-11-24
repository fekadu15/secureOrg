import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../services/api.js';

export const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();

  const [step, setStep] = useState<'request' | 'reset'>('request');
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [simulatedToken, setSimulatedToken] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleRequestToken = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);

    try {
      const res = await authApi.forgotPassword(email);
      setFeedbackMsg(res.message);
      if (res.resetTokenSimulation) {
        setSimulatedToken(res.resetTokenSimulation);
        setToken(res.resetTokenSimulation);
      }
      setStep('reset');
    } catch (err: any) {
      setErrorMsg(err.message || 'Error requesting password reset.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (newPassword.length < 12) {
      setErrorMsg('New password must be at least 12 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      await authApi.resetPassword({
        token: token.trim(),
        newPassword
      });

      navigate('/login', {
        state: { message: 'Password reset successful! Please log in with your new password.' }
      });
    } catch (err: any) {
      setErrorMsg(err.message || 'Error completing password reset. Token may have expired.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-surface font-sans text-on-surface min-h-screen relative flex flex-col justify-between selection:bg-secondary-container selection:text-on-secondary-container">
      <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(#dfe8ff_1px,transparent_1px)] [background-size:24px_24px] opacity-60"></div>

      <header className="relative z-10 w-full pt-space-xl pb-space-md px-margin flex flex-col items-center">
        <div className="flex items-center gap-space-sm mb-space-sm">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center text-on-primary shadow-sm">
            <span className="material-symbols-outlined text-[24px]">shield</span>
          </div>
          <span className="font-title-lg text-title-lg text-primary tracking-tight font-bold">SecureOrg</span>
        </div>
      </header>

      <main className="relative z-10 w-full flex-1 flex flex-col items-center justify-center px-margin py-space-md">
        <div className="w-full max-w-md bg-surface-container-lowest rounded-2xl shadow-lg border border-outline-variant/30 p-space-lg relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-secondary to-primary-container"></div>

          <div className="flex flex-col items-center text-center mb-space-lg">
            <div className="w-14 h-14 rounded-2xl bg-secondary-container text-on-secondary-container flex items-center justify-center shadow-sm mb-space-sm">
              <span className="material-symbols-outlined text-[32px]">lock_reset</span>
            </div>
            <h1 className="font-headline-sm text-headline-sm text-on-surface font-bold">
              Account Recovery
            </h1>
            <p className="font-body-md text-on-surface-variant text-[13px] mt-1 max-w-xs">
              {step === 'request'
                ? 'Enter your work email address to initiate secure credential recovery.'
                : 'Enter the recovery token and set a new master password.'}
            </p>
          </div>

          {errorMsg && (
            <div className="mb-space-md p-space-sm rounded-lg bg-error-container text-on-error-container flex items-center gap-space-sm text-[13px] font-medium border border-error/30">
              <span className="material-symbols-outlined text-[18px]">error</span>
              <span>{errorMsg}</span>
            </div>
          )}

          {step === 'request' ? (
            <form onSubmit={handleRequestToken} className="space-y-space-md">
              <div className="flex flex-col space-y-1">
                <label className="text-[13px] font-semibold text-on-surface" htmlFor="reset-email">
                  Work Email Address
                </label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-3 text-outline text-[20px] pointer-events-none">
                    alternate_email
                  </span>
                  <input
                    id="reset-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. officer@secureorg.io"
                    className="w-full h-11 pl-10 pr-4 bg-surface-container-low border border-outline-variant/30 rounded-lg text-[14px] text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-12 bg-primary hover:bg-primary-container text-on-primary rounded-xl font-bold text-[14px] flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-50"
              >
                <span>{isSubmitting ? 'Requesting...' : 'Request Recovery Instructions'}</span>
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-space-md">
              {simulatedToken && (
                <div className="p-space-sm rounded-lg bg-surface-container-low border border-secondary-container text-left text-[12px]">
                  <span className="font-bold text-secondary uppercase block text-[11px]">
                    Academic Recovery Token Simulation:
                  </span>
                  <code className="font-mono text-[11px] font-bold text-primary break-all block mt-0.5 select-all">
                    {simulatedToken}
                  </code>
                </div>
              )}

              <div className="flex flex-col space-y-1">
                <label className="text-[12px] font-semibold text-on-surface" htmlFor="token">
                  Reset Token
                </label>
                <input
                  id="token"
                  type="text"
                  required
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="Paste reset token here"
                  className="w-full h-10 px-3 font-mono text-[13px] bg-surface-container-low border border-outline-variant/30 rounded-lg text-primary focus:outline-none focus:ring-2 focus:ring-secondary"
                />
              </div>

              <div className="flex flex-col space-y-1">
                <label className="text-[12px] font-semibold text-on-surface" htmlFor="newPass">
                  New Master Password (Min 12 Chars)
                </label>
                <input
                  id="newPass"
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••••••••••"
                  className="w-full h-11 px-3 bg-surface-container-low border border-outline-variant/30 rounded-lg text-[14px] text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary"
                />
              </div>

              <div className="flex flex-col space-y-1">
                <label className="text-[12px] font-semibold text-on-surface" htmlFor="confirmPass">
                  Confirm New Password
                </label>
                <input
                  id="confirmPass"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••••••••••"
                  className="w-full h-11 px-3 bg-surface-container-low border border-outline-variant/30 rounded-lg text-[14px] text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-12 bg-primary hover:bg-primary-container text-on-primary rounded-xl font-bold text-[14px] flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-50"
              >
                <span>{isSubmitting ? 'Resetting...' : 'Save New Password & Invalidate Sessions'}</span>
              </button>
            </form>
          )}

          <div className="mt-space-lg text-center pt-space-sm border-t border-outline-variant/30">
            <Link to="/login" className="text-[13px] font-semibold text-secondary hover:text-primary transition-colors">
              &larr; Return to Sign In
            </Link>
          </div>
        </div>
      </main>

      <footer className="relative z-10 w-full py-4 text-center text-on-surface-variant text-[12px]">
        SecureOrg &copy; 2026 Addis Ababa Science and Technology University.
      </footer>
    </div>
  );
};
