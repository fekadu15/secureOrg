
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../services/api.js';
import { useAuth } from '../context/AuthContext.js';

export const MfaEnrollmentPage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState<'scan' | 'recovery'>('scan');
  const [secret, setSecret] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [copiedKey, setCopiedKey] = useState(false);
  const [codesDownloaded, setCodesDownloaded] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    let isActive = true;

    const initiateEnrollment = async () => {
      try {
        const res = await authApi.initiateMfaEnrollment();

        if (!isActive) return;

        if (!res.secret || !res.qrCodeDataUrl) {
          throw new Error('The server returned incomplete MFA enrollment information.');
        }

        setSecret(res.secret);
        setQrCodeUrl(res.qrCodeDataUrl);
      } catch (err: unknown) {
        if (!isActive) return;

        setErrorMsg(
          err instanceof Error
            ? err.message
            : 'Unable to initiate MFA enrollment. Please try again.'
        );
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    initiateEnrollment();

    return () => {
      isActive = false;
    };
  }, []);

  const handleCopySecret = async () => {
    try {
      await navigator.clipboard.writeText(secret);
      setCopiedKey(true);

      window.setTimeout(() => {
        setCopiedKey(false);
      }, 2000);
    } catch {
      setErrorMsg('Unable to copy the secret. Please copy it manually.');
    }
  };

  const handleVerificationCodeChange = (value: string) => {
    setVerificationCode(value.replace(/\D/g, '').slice(0, 6));
    setErrorMsg('');
  };

  const handleConfirm = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (isVerifying) return;

    if (!secret || !qrCodeUrl) {
      setErrorMsg('MFA enrollment information is unavailable. Please reload the page.');
      return;
    }

    if (!/^\d{6}$/.test(verificationCode)) {
      setErrorMsg('Please enter a valid 6-digit authenticator code.');
      return;
    }

    setIsVerifying(true);
    setErrorMsg('');

    try {
      const res = await authApi.confirmMfaEnrollment({
        secret,
        verificationCode: verificationCode.trim()
      });

      if (!res.recoveryCodes || res.recoveryCodes.length === 0) {
        throw new Error(
          'MFA enrollment response did not contain recovery codes. Contact your administrator before leaving this page.'
        );
      }

      setRecoveryCodes(res.recoveryCodes);
      setStep('recovery');

      try {
        await refreshUser();
      } catch {
        setErrorMsg(
          'MFA was enabled successfully, but your profile could not be refreshed. Your recovery codes are still available below.'
        );
      }
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : 'Unable to verify the authenticator code. Please try again.'
      );
    } finally {
      setIsVerifying(false);
    }
  };

  const handleDownloadCodes = () => {
    if (recoveryCodes.length === 0) {
      setErrorMsg('No recovery codes are available to download.');
      return;
    }

    try {
      const content = [
        'SecureOrg MFA Backup Recovery Codes',
        `User: ${user?.email || 'SecureOrg user'}`,
        `Generated: ${new Date().toISOString()}`,
        '',
        'Each code can only be used once:',
        '',
        ...recoveryCodes.map((code, index) => `${index + 1}. ${code}`),
        ''
      ].join('\n');

      const blob = new Blob([content], {
        type: 'text/plain;charset=utf-8'
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');

      a.href = url;
      a.download = `SecureOrg_Backup_Codes_${user?.email || 'user'}.txt`;

      document.body.appendChild(a);
      a.click();
      a.remove();

      URL.revokeObjectURL(url);

      setCodesDownloaded(true);
      setErrorMsg('');
    } catch {
      setErrorMsg('Unable to download recovery codes. Please try again.');
    }
  };

  const handleFinish = () => {
    if (!codesDownloaded) {
      const confirmed = window.confirm(
        'You have not downloaded your recovery codes. Make sure you have saved them somewhere secure before leaving. Continue anyway?'
      );

      if (!confirmed) return;
    }

    navigate('/dashboard', { replace: true });
  };

  return (
    <div className="max-w-2xl mx-auto py-space-lg">
      <div className="bg-surface-container-lowest rounded-2xl shadow-md border border-outline-variant/30 p-space-xl overflow-hidden relative">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-secondary to-primary-container"></div>

        {step === 'scan' ? (
          <div>
            <div className="flex items-center gap-space-md mb-space-lg">
              <div className="w-12 h-12 rounded-xl bg-primary text-on-primary flex items-center justify-center shadow-sm">
                <span className="material-symbols-outlined text-[28px]">
                  qr_code_scanner
                </span>
              </div>

              <div>
                <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                  Enroll Multi-Factor Authentication (TOTP)
                </h2>

                <p className="font-body-sm text-[13px] text-on-surface-variant">
                  Protect your enterprise credentials using Google Authenticator,
                  Microsoft Authenticator, or 1Password.
                </p>
              </div>
            </div>

            {errorMsg && (
              <div
                role="alert"
                aria-live="polite"
                className="mb-space-md p-space-sm rounded-lg bg-error-container text-on-error-container flex items-center gap-space-sm text-[13px] font-medium border border-error/30"
              >
                <span className="material-symbols-outlined text-[18px]">
                  error
                </span>
                <span>{errorMsg}</span>
              </div>
            )}

            {isLoading ? (
              <div className="py-12 flex justify-center">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : !secret || !qrCodeUrl ? (
              <div className="py-8 text-center space-y-4">
                <p className="text-sm text-on-surface-variant">
                  MFA enrollment could not be initialized.
                </p>

                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="px-space-lg py-2.5 rounded-lg bg-primary text-on-primary text-[13px] font-bold"
                >
                  Retry
                </button>
              </div>
            ) : (
              <div className="space-y-space-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-space-lg items-center p-space-md rounded-xl bg-surface-container-low border border-outline-variant/30">
                  <div className="flex flex-col items-center">
                    <div className="p-3 bg-white rounded-xl shadow-sm border border-outline-variant/40">
                      <img
                        src={qrCodeUrl}
                        alt="TOTP QR Code"
                        className="w-48 h-48"
                      />
                    </div>

                    <span className="text-[11px] text-on-surface-variant font-medium mt-2">
                      Scan with your mobile authenticator
                    </span>
                  </div>

                  <div className="space-y-space-sm">
                    <span className="text-[12px] font-bold text-on-surface uppercase tracking-wider block">
                      Manual Secret Key
                    </span>

                    <p className="text-[12px] text-on-surface-variant">
                      If you cannot scan the QR code, enter this base32 secret
                      manually into your authenticator app:
                    </p>

                    <div className="flex items-center gap-2">
                      <code className="px-3 py-2 rounded-lg bg-surface-container font-mono text-[13px] font-bold text-primary flex-1 break-all select-all">
                        {secret}
                      </code>

                      <button
                        type="button"
                        onClick={handleCopySecret}
                        className="px-3 py-2 rounded-lg bg-primary-container text-on-primary-container hover:bg-primary hover:text-on-primary font-label-sm text-[12px] font-bold transition-colors"
                      >
                        {copiedKey ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleConfirm} className="space-y-space-md">
                  <div className="flex flex-col space-y-1">
                    <label
                      className="text-[13px] font-semibold text-on-surface"
                      htmlFor="totp-code"
                    >
                      Enter the 6-digit code shown in your authenticator app to
                      confirm setup:
                    </label>

                    <input
                      id="totp-code"
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={6}
                      required
                      value={verificationCode}
                      onChange={(e) =>
                        handleVerificationCodeChange(e.target.value)
                      }
                      placeholder="000000"
                      aria-invalid={Boolean(errorMsg)}
                      className="w-full h-12 text-center font-mono text-[22px] tracking-widest bg-surface-container-low border border-outline-variant/30 rounded-lg text-primary focus:outline-none focus:ring-2 focus:ring-secondary"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-space-sm">
                    <button
                      type="button"
                      onClick={() => navigate('/my-profile')}
                      disabled={isVerifying}
                      className="px-space-md py-2.5 rounded-lg border border-outline-variant/40 text-[13px] font-semibold text-on-surface hover:bg-surface-container transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      disabled={isVerifying || verificationCode.length !== 6}
                      className="px-space-lg py-2.5 rounded-lg bg-primary text-on-primary hover:bg-primary-container text-[13px] font-bold shadow-sm transition-colors disabled:opacity-50"
                    >
                      {isVerifying ? 'Verifying...' : 'Confirm & Enable MFA'}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-space-lg">
            <div className="flex items-center gap-space-md">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shadow-sm">
                <span className="material-symbols-outlined text-[28px]">
                  verified
                </span>
              </div>

              <div>
                <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                  MFA Successfully Activated!
                </h2>

                <p className="font-body-sm text-[13px] text-on-surface-variant">
                  Save your one-time backup recovery codes. If you ever lose
                  access to your authenticator, these are the only way to recover
                  your account.
                </p>
              </div>
            </div>

            {errorMsg && (
              <div
                role="alert"
                aria-live="polite"
                className="p-space-sm rounded-lg bg-error-container text-on-error-container text-[13px] font-medium border border-error/30"
              >
                {errorMsg}
              </div>
            )}

            <div className="p-space-lg rounded-xl bg-surface-container-low border border-outline-variant/30">
              <div className="grid grid-cols-2 gap-space-sm">
                {recoveryCodes.map((code, index) => (
                  <div
                    key={index}
                    className="p-2.5 bg-surface-container-lowest rounded-lg font-mono text-[14px] font-bold text-primary border border-outline-variant/30 text-center select-all"
                  >
                    {code}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-space-md pt-space-sm">
              <button
                type="button"
                onClick={handleDownloadCodes}
                className="px-space-md py-2.5 rounded-lg bg-secondary-container text-on-secondary-container hover:bg-secondary hover:text-on-secondary text-[13px] font-bold flex items-center gap-2 transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">
                  download
                </span>

                <span>
                  {codesDownloaded ? 'Download Again' : 'Download Recovery Codes (.txt)'}
                </span>
              </button>

              <button
                type="button"
                onClick={handleFinish}
                className="px-space-lg py-2.5 rounded-lg bg-primary text-on-primary hover:bg-primary-container text-[13px] font-bold shadow-sm transition-colors"
              >
                Go to Security Dashboard
              </button>
            </div>

            <p className="text-[11px] text-on-surface-variant">
              Store these codes securely. Each code can only be used once.
              SecureOrg will not show them again after you leave this page.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
