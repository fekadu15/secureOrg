
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi, systemApi } from '../services/api.js';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [unitId, setUnitId] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const [units, setUnits] = useState<any[]>([]);

  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [fullNameError, setFullNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [captchaError, setCaptchaError] = useState('');

  // Verification challenge modal state
  const [verificationModalOpen, setVerificationModalOpen] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationFeedback, setVerificationFeedback] = useState<{ message: string; simulationCode?: string } | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationCodeError, setVerificationCodeError] = useState('');

  useEffect(() => {
    // Load organizational units
    systemApi.listUnits().then((res) => {
      if (res?.units) setUnits(res.units);
    }).catch(() => {});
  }, []);

  // Real-time password policy validation checks
  const hasMinLength = password.length >= 12;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSymbol = /[^A-Za-z0-9]/.test(password);
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;

  const passedRuleCount = [hasMinLength, hasUpper, hasLower, hasNumber, hasSymbol].filter(Boolean).length;
  const passwordStrengthLabel =
    passedRuleCount <= 2 ? 'Weak' : passedRuleCount <= 4 ? 'Moderate' : 'Strong & Compliant';
  const strengthColor =
    passedRuleCount <= 2 ? 'bg-error' : passedRuleCount <= 4 ? 'bg-amber-500' : 'bg-emerald-500';

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    // Clear previous validation errors
    setFullNameError('');
    setEmailError('');
    setPhoneError('');
    setPasswordError('');
    setConfirmPasswordError('');
    setCaptchaError('');

    let isValid = true;

    const trimmedFullName = fullName.trim();
    const normalizedEmail = email.trim().toLowerCase();
    const trimmedPhone = phone.trim();

    // Full name validation
    if (!trimmedFullName) {
      setFullNameError('Full name is required.');
      isValid = false;
    } else if (trimmedFullName.length < 2) {
      setFullNameError('Full name must contain at least 2 characters.');
      isValid = false;
    }

    // Email validation
    if (!normalizedEmail) {
      setEmailError('Email address is required.');
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setEmailError('Enter a valid email address.');
      isValid = false;
    }

    // Optional phone validation
    if (trimmedPhone) {
      const normalizedPhone = trimmedPhone.replace(/[\s()-]/g, '');

      if (!/^\+?[1-9]\d{6,14}$/.test(normalizedPhone)) {
        setPhoneError('Enter a valid phone number, including the country code.');
        isValid = false;
      }
    }

    // Password policy validation
    if (!hasMinLength || !hasUpper || !hasLower || !hasNumber || !hasSymbol) {
      setPasswordError(
        'Password must fulfill all 5 security policy requirements (12+ characters, upper, lower, digit, symbol).'
      );
      isValid = false;
    }

    // Confirm password validation
    if (!confirmPassword) {
      setConfirmPasswordError('Please confirm your password.');
      isValid = false;
    } else if (password !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match.');
      isValid = false;
    }

    // CAPTCHA validation
    if (!captchaVerified) {
      setCaptchaError('Please complete the anti-automation security verification checkbox.');
      isValid = false;
    }

    if (!isValid) return;

    setIsSubmitting(true);

    try {
      const res = await authApi.register({
        fullName: trimmedFullName,
        email: normalizedEmail,
        phone: trimmedPhone || undefined,
        unitId: unitId || undefined,
        password
      });

      setVerificationFeedback({
        message: res.message,
        simulationCode: res.verificationCodeSimulation
      });

      if (res.verificationCodeSimulation) {
        setVerificationCode(res.verificationCodeSimulation);
      }

      setVerificationModalOpen(true);
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Registration failed. Please check your data.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyChallenge = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setVerificationCodeError('');

    const trimmedCode = verificationCode.trim();

    if (!/^\d{6}$/.test(trimmedCode)) {
      setVerificationCodeError('Enter the valid 6-digit verification code.');
      return;
    }

    setIsVerifying(true);

    try {
      await authApi.verifyEmail({
        email: email.trim().toLowerCase(),
        token: trimmedCode
      });

      
      setVerificationModalOpen(false);
      navigate('/dashboard', {
        state: { message: 'Account successfully activated! Please sign in with your credentials.' }
      });
    } catch (err: unknown) {
      setVerificationCodeError(
        err instanceof Error ? err.message : 'Verification challenge failed. Invalid code.'
      );
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="bg-surface font-sans text-on-surface min-h-screen relative flex flex-col justify-between selection:bg-secondary-container selection:text-on-secondary-container">
      
      <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(#dfe8ff_1px,transparent_1px)] [background-size:24px_24px] opacity-60"></div>


      {/* Main Registration Card */}
      <main className="relative z-10 w-full flex-1 flex flex-col items-center justify-center px-margin py-space-md">
        <div className="flex flex-col w-full items-center justify-center max-w-xl mx-auto">
          {/* Operational Banner */}
          <div className="w-full mb-space-md flex items-center justify-between px-space-md py-space-xs rounded-lg bg-surface-container-low text-on-surface-variant shadow-sm border border-outline-variant/30">
           
            
          </div>

          {/* Registration Card */}
          <div className="w-full bg-surface-container-lowest rounded-xl shadow-md border border-outline-variant/30 p-space-lg relative overflow-hidden">
            {/* Top Gradient Bar */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-secondary to-primary-container"></div>

            {/* Header inside Card */}
            <div className="flex flex-col items-center text-center mb-space-md">
              <div className="w-14 h-14 rounded-xl bg-primary flex items-center justify-center shadow-md mb-space-sm text-on-primary">
                <span className="material-symbols-outlined text-[30px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  person_add
                </span>
              </div>
              <h1 className="font-headline-sm text-headline-sm text-on-surface font-bold tracking-tight">
                Create SecureOrg Account
              </h1>
            
            </div>

            {/* Error Notification */}
            {errorMsg && (
              <div className="mb-space-md p-space-sm rounded-lg bg-error-container text-on-error-container flex items-center gap-space-sm text-[13px] font-medium border border-error/30">
                <span className="material-symbols-outlined text-[18px]">error</span>
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleRegister} noValidate className="space-y-space-md">
              {/* Full Name */}
              <div className="flex flex-col space-y-1">
                <label className="font-label-lg text-[13px] font-semibold text-on-surface" htmlFor="fullName">
                  Full Name
                </label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-3 text-outline text-[20px] pointer-events-none">
                    badge
                  </span>
                  <input
                    id="fullName"
                    type="text"
                    required
                    value={fullName}
                    aria-invalid={Boolean(fullNameError)}
                    aria-describedby={fullNameError ? 'fullName-error' : undefined}
                    onChange={(e) => {
                      setFullName(e.target.value);
                      if (fullNameError) setFullNameError('');
                    }}
                    placeholder="e.g. Fikadu Tadesse"
                    className={`w-full h-11 pl-10 pr-4 bg-surface-container-low border rounded-lg text-[14px] text-on-surface focus:outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-secondary transition-all ${fullNameError ? 'border-error' : 'border-outline-variant/30'}`}
                  />
                </div>
                {fullNameError && <span id="fullName-error" className="text-error text-[12px]">{fullNameError}</span>}
              </div>

              {/* Work Email */}
              <div className="flex flex-col space-y-1">
                <label className="font-label-lg text-[13px] font-semibold text-on-surface" htmlFor="reg-email">
                  Organizational Email Address
                </label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-3 text-outline text-[20px] pointer-events-none">
                    alternate_email
                  </span>
                  <input
                    id="reg-email"
                    type="email"
                    required
                    value={email}
                    aria-invalid={Boolean(emailError)}
                    aria-describedby={emailError ? 'reg-email-error' : undefined}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (emailError) setEmailError('');
                    }}
                    placeholder="fike@secureorg.io"
                    className={`w-full h-11 pl-10 pr-4 bg-surface-container-low border rounded-lg text-[14px] text-on-surface focus:outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-secondary transition-all ${emailError ? 'border-error' : 'border-outline-variant/30'}`}
                  />
                </div>
                {emailError && <span id="reg-email-error" className="text-error text-[12px]">{emailError}</span>}
              </div>

              {/* Organizational Unit & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-sm">
                <div className="flex flex-col space-y-1">
                  <label className="font-label-lg text-[13px] font-semibold text-on-surface" htmlFor="unit">
                    Department / Unit
                  </label>
                  <select
                    id="unit"
                    value={unitId}
                    onChange={(e) => setUnitId(e.target.value)}
                    className="w-full h-11 px-3 bg-surface-container-low border border-outline-variant/30 rounded-lg text-[14px] text-on-surface focus:outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-secondary transition-all"
                  >
                    <option value="">Select Unit (Optional)</option>
                    {units.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.code})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col space-y-1">
                  <label className="font-label-lg text-[13px] font-semibold text-on-surface" htmlFor="phone">
                    Mobile Number
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    value={phone}
                    aria-invalid={Boolean(phoneError)}
                    aria-describedby={phoneError ? 'phone-error' : undefined}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      if (phoneError) setPhoneError('');
                    }}
                    placeholder="+251 91 234 5678"
                    className={`w-full h-11 px-3 bg-surface-container-low border rounded-lg text-[14px] text-on-surface focus:outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-secondary transition-all ${phoneError ? 'border-error' : 'border-outline-variant/30'}`}
                  />
                  {phoneError && <span id="phone-error" className="text-error text-[12px]">{phoneError}</span>}
                </div>
              </div>

              {/* Password */}
              <div className="flex flex-col space-y-1">
                <div className="flex justify-between items-center">
                  <label className="font-label-lg text-[13px] font-semibold text-on-surface" htmlFor="reg-password">
                    Master Password
                  </label>
                  <span className="text-[11px] font-bold text-on-surface-variant">
                    Strength: <span className="text-secondary">{passwordStrengthLabel}</span>
                  </span>
                </div>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-3 text-outline text-[20px] pointer-events-none">
                    password
                  </span>
                  <input
                    id="reg-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    aria-invalid={Boolean(passwordError)}
                    aria-describedby={passwordError ? 'reg-password-error' : undefined}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (passwordError) setPasswordError('');
                    }}
                    placeholder="Min 12 chars (e.g. SecureOrg#2026!)"
                    className={`w-full h-11 pl-10 pr-11 bg-surface-container-low border rounded-lg text-[14px] text-on-surface focus:outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-secondary transition-all ${passwordError ? 'border-error' : 'border-outline-variant/30'}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 text-outline hover:text-on-surface p-1"
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>

                {passwordError && <span id="reg-password-error" className="text-error text-[12px]">{passwordError}</span>}

                {/* Password Strength Meter */}
                <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden mt-1">
                  <div
                    className={`h-full ${strengthColor} transition-all duration-300`}
                    style={{ width: `${(passedRuleCount / 5) * 100}%` }}
                  ></div>
                </div>

                {/* Live Policy Checklist */}
                <div className="grid grid-cols-2 gap-1 pt-1 text-[11px]">
                  <div className={`flex items-center gap-1 ${hasMinLength ? 'text-emerald-700 font-semibold' : 'text-on-surface-variant'}`}>
                    <span className="material-symbols-outlined text-[13px]">{hasMinLength ? 'check_circle' : 'cancel'}</span>
                    <span>12+ Characters</span>
                  </div>
                  <div className={`flex items-center gap-1 ${hasUpper ? 'text-emerald-700 font-semibold' : 'text-on-surface-variant'}`}>
                    <span className="material-symbols-outlined text-[13px]">{hasUpper ? 'check_circle' : 'cancel'}</span>
                    <span>Uppercase (A-Z)</span>
                  </div>
                  <div className={`flex items-center gap-1 ${hasLower ? 'text-emerald-700 font-semibold' : 'text-on-surface-variant'}`}>
                    <span className="material-symbols-outlined text-[13px]">{hasLower ? 'check_circle' : 'cancel'}</span>
                    <span>Lowercase (a-z)</span>
                  </div>
                  <div className={`flex items-center gap-1 ${hasNumber ? 'text-emerald-700 font-semibold' : 'text-on-surface-variant'}`}>
                    <span className="material-symbols-outlined text-[13px]">{hasNumber ? 'check_circle' : 'cancel'}</span>
                    <span>Numeric Digit (0-9)</span>
                  </div>
                  <div className={`flex items-center gap-1 ${hasSymbol ? 'text-emerald-700 font-semibold' : 'text-on-surface-variant'}`}>
                    <span className="material-symbols-outlined text-[13px]">{hasSymbol ? 'check_circle' : 'cancel'}</span>
                    <span>Special Symbol (!@#$)</span>
                  </div>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="flex flex-col space-y-1">
                <label className="font-label-lg text-[13px] font-semibold text-on-surface" htmlFor="confirm-pass">
                  Confirm Password
                </label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-3 text-outline text-[20px] pointer-events-none">
                    lock_reset
                  </span>
                  <input
                    id="confirm-pass"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    aria-invalid={Boolean(confirmPasswordError)}
                    aria-describedby={confirmPasswordError ? 'confirm-pass-error' : undefined}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (confirmPasswordError) setConfirmPasswordError('');
                    }}
                    placeholder="Re-enter master password"
                    className={`w-full h-11 pl-10 pr-4 bg-surface-container-low border rounded-lg text-[14px] text-on-surface focus:outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-secondary transition-all ${confirmPasswordError ? 'border-error' : 'border-outline-variant/30'}`}
                  />
                  {confirmPassword.length > 0 && (
                    <span className={`material-symbols-outlined text-[18px] absolute right-3 ${passwordsMatch ? 'text-emerald-600' : 'text-error'}`}>
                      {passwordsMatch ? 'check_circle' : 'error'}
                    </span>
                  )}
                </div>
                {confirmPasswordError && <span id="confirm-pass-error" className="text-error text-[12px]">{confirmPasswordError}</span>}
              </div>

              {/* Anti-Bot / CAPTCHA Simulation */}
              <div className="p-space-sm rounded-lg bg-surface-container-low border border-outline-variant/30 flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={captchaVerified}
                    onChange={(e) => {
                      setCaptchaVerified(e.target.checked);
                      if (e.target.checked) setCaptchaError('');
                    }}
                    className="w-5 h-5 rounded text-primary-container focus:ring-0 cursor-pointer accent-primary-container"
                  />
                  <span className="text-[13px] font-medium text-on-surface">
                    I am not a bot (Anti-Automation CAPTCHA Verification)
                  </span>
                </label>
                <span className="material-symbols-outlined text-[20px] text-secondary">
                  smart_toy
                </span>
              </div>
              {captchaError && <span className="block text-error text-[12px]">{captchaError}</span>}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-12 bg-primary-container hover:bg-primary text-on-primary rounded-lg font-label-lg text-[14px] font-bold flex items-center justify-center gap-2 shadow-sm transition-all duration-150 active:scale-[0.99] mt-space-md disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[18px]">how_to_reg</span>
                <span>{isSubmitting ? 'Registering Identity...' : 'Register Identity & Request Challenge'}</span>
                <span className="material-symbols-outlined text-[18px] ml-0.5">arrow_forward</span>
              </button>
            </form>

            {/* Already have an account? */}
            <div className="mt-space-lg text-center">
              <span className="text-[13px] text-on-surface-variant">Already have registered credentials? </span>
              <Link to="/login" className="text-[13px] font-bold text-secondary hover:text-primary transition-colors">
                Sign in to SecureOrg
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Challenge Verification Modal */}
      {verificationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-surface/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-surface-container-lowest rounded-2xl shadow-2xl border border-outline-variant/30 p-space-lg">
            <div className="flex flex-col items-center text-center mb-space-md">
              <div className="w-12 h-12 rounded-xl bg-secondary-container text-on-secondary-container flex items-center justify-center mb-space-xs">
                <span className="material-symbols-outlined text-[28px]">mark_email_read</span>
              </div>
              <h3 className="font-title-lg text-on-surface font-bold">Email Challenge Verification</h3>
              <p className="font-body-sm text-[13px] text-on-surface-variant mt-1">
                Enter the 6-digit challenge code to activate your account <span className="font-bold text-primary">{email}</span>.
              </p>
            </div>

            {verificationFeedback?.simulationCode && (
              <div className="mb-space-md p-space-sm rounded-lg bg-surface-container-low border border-secondary-container text-left">
                <span className="text-[11px] font-bold text-secondary uppercase tracking-wider block">
                  Academic Verification Simulation Code:
                </span>
                <span className="text-[20px] font-mono font-bold tracking-widest text-primary block mt-0.5">
                  {verificationFeedback.simulationCode}
                </span>
                <span className="text-[11px] text-on-surface-variant">
                  (Single-use verification token simulated for assessment review)
                </span>
              </div>
            )}

            {verificationCodeError && (
              <div className="mb-space-md p-space-sm rounded-lg bg-error-container text-on-error-container text-[13px]">
                {verificationCodeError}
              </div>
            )}

            <form onSubmit={handleVerifyChallenge} noValidate className="space-y-space-md">
              <div className="flex flex-col space-y-1">
                <label className="text-[12px] font-semibold text-on-surface" htmlFor="challenge-code">
                  6-Digit Verification Code
                </label>
                <input
                  id="challenge-code"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  required
                  value={verificationCode}
                  aria-invalid={Boolean(verificationCodeError)}
                  onChange={(e) => {
                    setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6));
                    if (verificationCodeError) setVerificationCodeError('');
                  }}
                  placeholder="123456"
                  className="w-full h-12 text-center font-mono text-[22px] tracking-widest bg-surface-container-low border border-outline-variant/30 rounded-lg text-primary focus:outline-none focus:ring-2 focus:ring-secondary"
                />
              </div>

              <button
                type="submit"
                disabled={isVerifying}
                className="w-full h-11 bg-primary text-on-primary rounded-lg font-bold text-[14px] hover:bg-primary-container transition-colors disabled:opacity-50"
              >
                {isVerifying ? 'Verifying Challenge...' : 'Verify Challenge & Activate Account'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="relative z-10 w-full py-4 text-center text-on-surface-variant text-[12px]">
        SecureOrg &copy; 2026 Addis Ababa Science and Technology University. Computer System Security Project.
      </footer>
    </div>
  );
};
