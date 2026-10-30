import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { useUser } from "../context/UserContext";
import RollText from "../components/RollText";
import Shine from "../components/Shine";
import { CountdownRing, OtpSentAnimation } from "../components/OtpSent";
import OtpInput from "../components/OtpInput";
import { EMAIL_RE, PROFESSIONS } from "../data/profile";
import { initWidget, widgetRetryOtp, widgetSendOtp, widgetVerifyOtp } from "../lib/msg91Widget";

// Matches the API, which allows one OTP per number per minute.
const OTP_RESEND_SECONDS = 60;

export default function Login() {
  const {
    isAuthenticated,
    sendOtp,
    verifyOtp,
    loginWithPassword,
    registerWithPassword,
    resetPassword,
    loading,
    purchasedCourses,
  } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from;

  const [step, setStep] = useState("mobile");
  const [mode, setMode] = useState("signin");
  // Customers can use either a mobile number or an email address.
  const [channel, setChannel] = useState("mobile");
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [age, setAge] = useState("");
  const [profession, setProfession] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [verificationToken, setVerificationToken] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [resendCountdown, setResendCountdown] = useState(0);
  // Bumped on every successful send so the "sent" animation replays.
  const [sentCount, setSentCount] = useState(0);
  // Bumped on each failed verify to shake the OTP boxes.
  const [otpErrors, setOtpErrors] = useState(0);
  // MSG91 widget settings when the API sends mobile OTPs through the widget; null otherwise.
  const [widget, setWidget] = useState(null);
  const [widgetBusy, setWidgetBusy] = useState(false);

  useEffect(() => {
    if (resendCountdown <= 0) return undefined;
    const timer = window.setTimeout(() => {
      setResendCountdown((remaining) => Math.max(0, remaining - 1));
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [resendCountdown]);

  const identifier = channel === "mobile" ? mobile : email.trim().toLowerCase();
  const identifierValid = channel === "mobile" ? /^\d{10}$/.test(mobile) : EMAIL_RE.test(identifier);
  const contactLabel = channel === "mobile" ? `+91 ${mobile}` : identifier;
  const invalidContact = channel === "mobile" ? "Enter a valid 10-digit mobile number" : "Enter a valid email address";

  if (isAuthenticated) {
    return <Navigate to={from || (purchasedCourses.length > 0 ? "/dashboard" : "/courses")} replace />;
  }

  // Widget mode: our API has done its checks; MSG91's widget now sends the SMS itself.
  const startWidget = async (config) => {
    setWidgetBusy(true);
    try {
      await initWidget(config);
      await widgetSendOtp(mobile);
      setWidget(config);
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setWidgetBusy(false);
    }
  };

  const handleContinue = async (e) => {
    e.preventDefault();
    setError("");
    setInfo("");
    if (!identifierValid) {
      setError(invalidContact);
      return;
    }

    const res = await sendOtp(identifier, "register");
    if (!res.success) {
      setError(res.message || "Unable to continue. Please try again.");
      return;
    }

    if (res.existingUser) {
      setMode("signin");
      setInfo("You already have an account. Sign in with your password.");
      return;
    }
    if (res.widget && !(await startWidget(res.widget))) return;
    if (!res.widget) setWidget(null);

    setStep("otp");
    setOtp("");
    setPassword("");
    setConfirmPassword("");
    setInfo(res.widget ? "OTP sent to your mobile number." : res.message || "OTP sent.");
    setResendCountdown(OTP_RESEND_SECONDS);
    setSentCount((count) => count + 1);
  };

  const switchChannel = () => {
    setChannel((current) => (current === "mobile" ? "email" : "mobile"));
    setError("");
    setInfo("");
  };

  const switchMode = (next) => {
    setMode(next);
    setError("");
    setInfo("");
    setPassword("");
  };

  const handleResendOtp = async () => {
    if (loading || widgetBusy || resendCountdown > 0) return;
    setError("");
    setInfo("");
    if (widget) {
      setWidgetBusy(true);
      try {
        await widgetRetryOtp();
        setOtp("");
        setResendCountdown(OTP_RESEND_SECONDS);
        setSentCount((count) => count + 1);
        setInfo("A new OTP has been sent.");
      } catch (err) {
        setError(err.message);
      } finally {
        setWidgetBusy(false);
      }
      return;
    }
    const purpose = step === "forgot-otp" ? "reset" : "register";
    const res = await sendOtp(identifier, purpose);
    if (res.success) {
      setOtp("");
      setResendCountdown(OTP_RESEND_SECONDS);
      setSentCount((count) => count + 1);
      setInfo(res.message || "A new OTP has been sent.");
    } else {
      setError(res.message || "Failed to resend OTP. Please try again.");
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError("");
    if (!/^\d{6}$/.test(otp)) {
      setError("Enter the 6-digit OTP");
      return;
    }
    const purpose = step === "forgot-otp" ? "reset" : "register";
    // In widget mode MSG91 checks the code and gives us a token for our API to confirm.
    let accessToken;
    if (widget) {
      if (widgetBusy) return;
      setWidgetBusy(true);
      try {
        accessToken = await widgetVerifyOtp(otp);
      } catch (err) {
        setOtpErrors((count) => count + 1);
        setError(err.message);
        return;
      } finally {
        setWidgetBusy(false);
      }
    }
    const res = await verifyOtp({ identifier, ...(accessToken ? { accessToken } : { otp }), name: name.trim(), purpose });
    if (!res.success) {
      setOtpErrors((count) => count + 1);
      setError(res.message || "Invalid OTP");
      return;
    }
    setVerificationToken(res.verificationToken);
    setPassword("");
    setConfirmPassword("");
    setOtp("");
    setStep(purpose === "reset" ? "reset-password" : "password");
    setInfo(channel === "email" ? "Email verified successfully." : "Mobile number verified successfully.");
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setInfo("");
    if (!identifierValid) {
      setError(invalidContact);
      return;
    }
    const res = await loginWithPassword({ identifier, password });
    // Return to the page that sent the user here (for example a course's Buy button).
    if (res.success) navigate(from || res.redirectTo, { replace: true });
    else setError(res.message || "Incorrect login details or password.");
  };

  const handleSetPassword = async (e) => {
    e.preventDefault();
    setError("");
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    const res = await registerWithPassword({
      identifier,
      password,
      verificationToken,
      name: name.trim(),
      age: Number(age),
      profession,
    });
    if (res.success) navigate(from || res.redirectTo, { replace: true });
    else setError(res.message || "Unable to create your account.");
  };

  const handleForgotPassword = async () => {
    setError("");
    setInfo("");
    if (!identifierValid) {
      setError(channel === "mobile" ? "Enter your 10-digit mobile number first" : "Enter your email address first");
      return;
    }
    const res = await sendOtp(identifier, "reset");
    if (res.success) {
      if (res.widget && !(await startWidget(res.widget))) return;
      if (!res.widget) setWidget(null);
      setStep("forgot-otp");
      setOtp("");
      setResendCountdown(OTP_RESEND_SECONDS);
      setSentCount((count) => count + 1);
      setInfo(res.message || "Password reset OTP sent.");
    } else {
      setError(res.message || "Unable to send reset OTP.");
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    const res = await resetPassword({ identifier, password, verificationToken });
    if (res.success) {
      setStep("mobile");
      setMode("signin");
      setPassword("");
      setConfirmPassword("");
      setVerificationToken("");
      setInfo("Password reset successfully. Log in with your new password.");
    } else {
      setError(res.message || "Unable to reset password.");
    }
  };

  const titles = {
    mobile: mode === "signin" ? "Welcome back" : "Create your account",
    otp: "Verify OTP",
    password: "Create Password",
    "forgot-otp": "Reset Password",
    "reset-password": "Create New Password",
  };
  const descriptions = {
    mobile: mode === "signin" ? "Sign in with your mobile number or email" : "Sign up with your mobile number or email",
    otp: `OTP sent to ${contactLabel}`,
    password: "Set a password for your new account",
    "forgot-otp": `Reset OTP sent to ${contactLabel}`,
    "reset-password": "Choose a new password for your account",
  };

  const renderError = error ? (
    <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
  ) : null;
  const renderInfo = info ? (
    <p className="text-center text-sm text-forest">{info}</p>
  ) : null;

  return (
    <div className="relative min-h-[80vh] overflow-hidden">
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute -left-20 top-10 h-64 w-64 rounded-full bg-mint opacity-60"
        animate={{ x: [0, 18, -14, 0], y: [0, -22, 10, 0], scale: [1, 1.08, 0.94, 1] }}
        transition={{ duration: 12, ease: "easeInOut", repeat: Infinity }}
      />
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 bottom-10 h-72 w-72 rounded-full bg-leaf/20 opacity-50"
        animate={{ x: [0, -18, 14, 0], y: [0, -22, 10, 0], scale: [1, 1.08, 0.94, 1] }}
        transition={{ duration: 12, ease: "easeInOut", repeat: Infinity }}
      />

      <div className="relative mx-auto flex max-w-xl flex-col items-center px-4 py-8 sm:py-10">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.45 }}
          className="w-full rounded-3xl border border-forest/10 bg-white p-6 shadow-lg sm:p-8 shadow-forest/5"
        >
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-[#10251D] p-2 shadow-lg shadow-forest/20">
              <img src="/assets/logo1.webp" alt="Sky Birds Solution" className="max-h-full max-w-full object-contain" />
            </div>
            <h1 className="text-2xl font-bold text-ink">{titles[step]}</h1>
            <p className="mt-1 text-sm text-ink/60">{descriptions[step]}</p>
          </div>

          <AnimatePresence mode="wait">
            {step === "mobile" ? (
              <motion.div
                key="mobile"
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 12 }}
              >
                <div role="tablist" aria-label="Sign in or sign up" className="mb-5 grid grid-cols-2 rounded-full bg-mint/70 p-1">
                  {[["signin", "Sign in"], ["signup", "Sign up"]].map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      role="tab"
                      aria-selected={mode === value}
                      onClick={() => switchMode(value)}
                      className={`relative rounded-full py-2.5 text-sm font-semibold transition-colors ${mode === value ? "text-ink" : "text-forest/70 hover:text-forest"}`}
                    >
                      {mode === value ? (
                        <motion.span
                          layoutId="auth-tab"
                          className="absolute inset-0 rounded-full bg-white shadow-sm"
                          transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                        />
                      ) : null}
                      <span className="relative">{label}</span>
                    </button>
                  ))}
                </div>

                <form onSubmit={mode === "signin" ? handleLogin : handleContinue} className="space-y-5">
                  <AnimatePresence initial={false}>
                    {mode === "signup" ? (
                      <motion.div key="name" initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.25 }}
                      className="-mx-1 -mt-1 space-y-4 overflow-hidden p-1">
                        <label className="block text-sm font-medium text-ink">
                          Full name
                          <input
                            type="text"
                            minLength={2}
                            maxLength={100}
                            autoComplete="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Rahul Sharma"
                            className="mt-1.5 w-full rounded-xl border border-forest/20 px-3 py-2.5 outline-none focus:border-leaf focus:ring-2 focus:ring-leaf/30"
                            required
                          />
                        </label>
                        <div className="grid grid-cols-[0.7fr_1.3fr] gap-3">
                          <label className="block text-sm font-medium text-ink">
                            Age
                            <input
                              type="number"
                              inputMode="numeric"
                              min={13}
                              max={100}
                              step={1}
                              value={age}
                              onChange={(e) => setAge(e.target.value.replace(/\D/g, "").slice(0, 3))}
                              placeholder="e.g. 24"
                              className="mt-1.5 w-full rounded-xl border border-forest/20 px-3 py-2.5 outline-none focus:border-leaf focus:ring-2 focus:ring-leaf/30"
                              required
                            />
                          </label>
                          <label className="block text-sm font-medium text-ink">
                            Profession
                            <select
                              value={profession}
                              onChange={(e) => setProfession(e.target.value)}
                              className={`mt-1.5 w-full rounded-xl border border-forest/20 bg-white px-3 py-2.5 outline-none focus:border-leaf focus:ring-2 focus:ring-leaf/30 ${profession ? "text-ink" : "text-ink/40"}`}
                              required
                            >
                              <option value="" disabled>Select…</option>
                              {PROFESSIONS.map((item) => (
                                <option key={item} value={item} className="text-ink">{item}</option>
                              ))}
                            </select>
                          </label>
                        </div>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                  <div>
                    <div className="flex items-center justify-between gap-3">
                      <label htmlFor="contact" className="text-sm font-medium text-ink">
                        {channel === "mobile" ? "Mobile number" : "Email address"}
                      </label>
                      <button type="button" onClick={switchChannel} className="text-xs font-semibold text-forest hover:underline">
                        {channel === "mobile" ? "Use email instead" : "Use mobile instead"}
                      </button>
                    </div>
                    {channel === "mobile" ? (
                      <div className="mt-1.5 flex overflow-hidden rounded-xl border border-forest/20 focus-within:border-leaf focus-within:ring-2 focus-within:ring-leaf/30">
                        <span className="flex items-center bg-mint px-3 text-sm font-medium text-forest">+91</span>
                        <input
                          id="contact"
                          type="tel"
                          inputMode="numeric"
                          autoComplete="tel-national"
                          value={mobile}
                          onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
                          placeholder="9876543210"
                          className="w-full px-3 py-2.5 outline-none"
                          required
                        />
                      </div>
                    ) : (
                      <input
                        id="contact"
                        type="email"
                        autoComplete="email"
                        maxLength={254}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="mt-1.5 w-full rounded-xl border border-forest/20 px-3 py-2.5 outline-none focus:border-leaf focus:ring-2 focus:ring-leaf/30"
                        required
                      />
                    )}
                  </div>
                  <AnimatePresence initial={false}>
                    {mode === "signin" ? (
                      <motion.div key="password" initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden">
                        <label className="block text-sm font-medium text-ink">
                          Password
                          <input
                            type="password"
                            autoComplete="current-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter your password"
                            className="mt-1.5 w-full rounded-xl border border-forest/20 px-3 py-2.5 outline-none focus:border-leaf focus:ring-2 focus:ring-leaf/30"
                            required
                          />
                        </label>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                  {renderError}
                  {renderInfo}
                  <button
                    type="submit"
                    disabled={loading || widgetBusy || !identifierValid || (mode === "signin" && !password)}
                    className="relative overflow-hidden w-full rounded-full bg-leaf py-3 font-semibold text-white transition hover:bg-forest disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Shine />
                    <RollText>
                      {mode === "signin" ? (loading || widgetBusy ? "Signing in…" : "Sign in") : loading || widgetBusy ? "Sending OTP…" : "Send OTP"}
                    </RollText>
                  </button>
                  {mode === "signin" ? (
                    <button type="button" onClick={handleForgotPassword} disabled={loading || widgetBusy} className="w-full text-center text-sm font-semibold text-forest hover:underline disabled:opacity-50">
                      Forgot password?
                    </button>
                  ) : null}
                </form>

                <p className="mt-5 text-center text-sm text-ink/60">
                  {mode === "signin" ? "New to SkyBirds? " : "Already have an account? "}
                  <button type="button" onClick={() => switchMode(mode === "signin" ? "signup" : "signin")} className="font-semibold text-forest hover:underline">
                    {mode === "signin" ? "Create an account" : "Sign in"}
                  </button>
                </p>
              </motion.div>
            ) : null}

            {step === "otp" || step === "forgot-otp" ? (
              <motion.form
                key={step}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                onSubmit={handleVerify}
                className="space-y-4"
              >
                <OtpSentAnimation key={sentCount} channel={channel} />
                <div>
                  <p className="mb-1.5 text-sm font-medium text-ink">Enter OTP</p>
                  <OtpInput value={otp} onChange={setOtp} shakeKey={otpErrors} autoFocus />
                </div>
                <div className="space-y-1 text-center text-sm">
                {renderInfo}
                <div>
                  <span className="text-ink/60">Didn’t receive the OTP? </span>
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={loading || widgetBusy || resendCountdown > 0}
                    className="inline-flex items-center gap-1.5 font-semibold text-forest hover:underline disabled:cursor-not-allowed disabled:opacity-60 disabled:no-underline"
                  >
                    {loading || widgetBusy ? "Sending…" : resendCountdown > 0 ? (
                      <>
                        Resend in <CountdownRing seconds={resendCountdown} total={OTP_RESEND_SECONDS} />
                      </>
                    ) : "Resend OTP"}
                  </button>
                </div>
                </div>
                {renderError}
                <button
                  type="submit"
                  disabled={loading || widgetBusy || otp.length !== 6}
                  className="relative overflow-hidden w-full rounded-full bg-leaf py-3 font-semibold text-white transition hover:bg-forest disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Shine />
                  <RollText>{loading || widgetBusy ? "Verifying…" : "Verify OTP"}</RollText>
                </button>
                <button
                  type="button"
                  onClick={() => { setStep("mobile"); setOtp(""); setError(""); setInfo(""); }}
                  className="w-full text-center text-sm font-medium text-forest hover:underline"
                >
                  ← Back
                </button>
              </motion.form>
            ) : null}

            {step === "password" || step === "reset-password" ? (
              <motion.form
                key={step}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 12 }}
                onSubmit={step === "password" ? handleSetPassword : handleResetPassword}
                className="space-y-5"
              >
                <label className="block text-sm font-medium text-ink">
                  {step === "password" ? "Create password" : "New password"}
                  <input
                    type="password"
                    autoComplete="new-password"
                    minLength={8}
                    maxLength={128}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    className="mt-1.5 w-full rounded-xl border border-forest/20 px-3 py-2.5 outline-none focus:border-leaf focus:ring-2 focus:ring-leaf/30"
                    required
                  />
                </label>
                <label className="block text-sm font-medium text-ink">
                  Confirm password
                  <input
                    type="password"
                    autoComplete="new-password"
                    minLength={8}
                    maxLength={128}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Enter password again"
                    className="mt-1.5 w-full rounded-xl border border-forest/20 px-3 py-2.5 outline-none focus:border-leaf focus:ring-2 focus:ring-leaf/30"
                    required
                  />
                </label>
                {renderError}
                {renderInfo}
                <button
                  type="submit"
                  disabled={loading || widgetBusy || password.length < 8 || password !== confirmPassword}
                  className="relative overflow-hidden w-full rounded-full bg-leaf py-3 font-semibold text-white transition hover:bg-forest disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Shine />
                  <RollText>{loading || widgetBusy ? "Please wait…" : step === "password" ? "Create Account" : "Reset Password"}</RollText>
                </button>
              </motion.form>
            ) : null}
          </AnimatePresence>

          <p className="mt-6 text-center text-xs text-ink/40">
            By continuing you agree to SkyBirds terms.
            <br />
            Your mobile number or email is used to secure your account.
          </p>
        </motion.div>

        <Link to="/" className="mt-6 text-sm font-medium text-forest hover:underline">
          ← Back to home
        </Link>
      </div>
    </div>
  );
}
