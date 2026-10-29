import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { useUser } from "../context/UserContext";
import RollText from "../components/RollText";
import Shine from "../components/Shine";
import { CountdownRing, OtpSentAnimation } from "../components/OtpSent";
import OtpInput from "../components/OtpInput";

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
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [name, setName] = useState("");
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

  useEffect(() => {
    if (resendCountdown <= 0) return undefined;
    const timer = window.setTimeout(() => {
      setResendCountdown((remaining) => Math.max(0, remaining - 1));
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [resendCountdown]);

  if (isAuthenticated) {
    return <Navigate to={from || (purchasedCourses.length > 0 ? "/dashboard" : "/courses")} replace />;
  }

  const handleContinue = async (e) => {
    e.preventDefault();
    setError("");
    setInfo("");
    if (!/^\d{10}$/.test(mobile)) {
      setError("Enter a valid 10-digit mobile number");
      return;
    }

    const res = await sendOtp(mobile, "register");
    if (!res.success) {
      setError(res.message || "Unable to continue. Please try again.");
      return;
    }

    if (res.existingUser) {
      setStep("login");
      setInfo("Welcome back! Enter your password to log in.");
      return;
    }

    setStep("otp");
    setOtp("");
    setPassword("");
    setConfirmPassword("");
    setInfo(res.message || "OTP sent to your mobile number.");
    setResendCountdown(OTP_RESEND_SECONDS);
      setSentCount((count) => count + 1);
  };

  const handleResendOtp = async () => {
    if (loading || resendCountdown > 0) return;
    setError("");
    setInfo("");
    const purpose = step === "forgot-otp" ? "reset" : "register";
    const res = await sendOtp(mobile, purpose);
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
    const res = await verifyOtp({ mobile, otp, name: name.trim(), purpose });
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
    setInfo("Mobile number verified successfully.");
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    const res = await loginWithPassword({ mobile, password });
    // Return to the page that sent the user here (for example a course's Buy button).
    if (res.success) navigate(from || res.redirectTo, { replace: true });
    else setError(res.message || "Invalid mobile number or password.");
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
      mobile,
      password,
      verificationToken,
      name: name.trim(),
    });
    if (res.success) navigate(from || res.redirectTo, { replace: true });
    else setError(res.message || "Unable to create your account.");
  };

  const handleForgotPassword = async () => {
    setError("");
    setInfo("");
    const res = await sendOtp(mobile, "reset");
    if (res.success) {
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
    const res = await resetPassword({ mobile, password, verificationToken });
    if (res.success) {
      setStep("login");
      setPassword("");
      setConfirmPassword("");
      setVerificationToken("");
      setInfo("Password reset successfully. Log in with your new password.");
    } else {
      setError(res.message || "Unable to reset password.");
    }
  };

  const titles = {
    mobile: "Sign in / Sign up",
    login: "Welcome Back",
    otp: "Verify OTP",
    password: "Create Password",
    "forgot-otp": "Reset Password",
    "reset-password": "Create New Password",
  };
  const descriptions = {
    mobile: "Enter your mobile number to continue",
    login: `Log in with +91 ${mobile}`,
    otp: `OTP sent to +91 ${mobile}`,
    password: "Set a password for your new account",
    "forgot-otp": `Reset OTP sent to +91 ${mobile}`,
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

      <div className="relative mx-auto flex max-w-lg flex-col items-center px-4 py-16">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.45 }}
          className="w-full rounded-3xl border border-forest/10 bg-white p-8 shadow-lg shadow-forest/5"
        >
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl bg-[#10251D] p-2 shadow-lg shadow-forest/20">
              <img src="/assets/logo1.webp" alt="Sky Birds Solution" className="max-h-full max-w-full object-contain" />
            </div>
            <h1 className="text-2xl font-bold text-ink">{titles[step]}</h1>
            <p className="mt-1 text-sm text-ink/60">{descriptions[step]}</p>
          </div>

          <AnimatePresence mode="wait">
            {step === "mobile" ? (
              <motion.form
                key="mobile"
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 12 }}
                onSubmit={handleContinue}
                className="space-y-5"
              >
                <label className="block text-sm font-medium text-ink">
                  Mobile number
                  <div className="mt-1.5 flex overflow-hidden rounded-xl border border-forest/20 focus-within:border-leaf focus-within:ring-2 focus-within:ring-leaf/30">
                    <span className="flex items-center bg-mint px-3 text-sm font-medium text-forest">+91</span>
                    <input
                      type="tel"
                      inputMode="numeric"
                      autoComplete="tel-national"
                      maxLength={10}
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
                      placeholder="9876543210"
                      className="w-full px-3 py-2.5 outline-none"
                      required
                    />
                  </div>
                </label>
                {renderError}
                <button
                  type="submit"
                  disabled={loading || mobile.length !== 10}
                  className="relative overflow-hidden w-full rounded-full bg-leaf py-3 font-semibold text-white transition hover:bg-forest disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Shine />
                  <RollText>{loading ? "Checking…" : "Continue"}</RollText>
                </button>
              </motion.form>
            ) : null}

            {step === "login" ? (
              <motion.form
                key="login"
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 12 }}
                onSubmit={handleLogin}
                className="space-y-5"
              >
                <label className="block text-sm font-medium text-ink">
                  Mobile number
                  <input
                    type="tel"
                    value={mobile}
                    readOnly
                    className="mt-1.5 w-full rounded-xl border border-forest/20 bg-gray-50 px-3 py-2.5 outline-none"
                  />
                </label>
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
                {renderError}
                {renderInfo}
                <button
                  type="submit"
                  disabled={loading || !password}
                  className="relative overflow-hidden w-full rounded-full bg-leaf py-3 font-semibold text-white transition hover:bg-forest disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Shine />
                  <RollText>{loading ? "Logging in…" : "Login"}</RollText>
                </button>
                <button type="button" onClick={handleForgotPassword} disabled={loading} className="w-full text-center text-sm font-semibold text-forest hover:underline disabled:opacity-50">
                  Forgot password?
                </button>
                <button type="button" onClick={() => { setStep("mobile"); setError(""); setInfo(""); setPassword(""); }} className="w-full text-center text-sm font-medium text-forest hover:underline">
                  ← Change mobile number
                </button>
              </motion.form>
            ) : null}

            {step === "otp" || step === "forgot-otp" ? (
              <motion.form
                key={step}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                onSubmit={handleVerify}
                className="space-y-5"
              >
                <OtpSentAnimation key={sentCount} />
                {step === "otp" ? (
                  <label className="block text-sm font-medium text-ink">
                    Your name <span className="text-ink/40">(optional)</span>
                    <input
                      type="text"
                      maxLength={100}
                      autoComplete="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Rahul Sharma"
                      className="mt-1.5 w-full rounded-xl border border-forest/20 px-3 py-2.5 outline-none focus:border-leaf focus:ring-2 focus:ring-leaf/30"
                    />
                  </label>
                ) : null}
                <div>
                  <p className="mb-1.5 text-sm font-medium text-ink">Enter OTP</p>
                  <OtpInput value={otp} onChange={setOtp} shakeKey={otpErrors} autoFocus />
                </div>
                {renderInfo}
                <div className="text-center text-sm">
                  <span className="text-ink/60">Didn’t receive the OTP? </span>
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={loading || resendCountdown > 0}
                    className="inline-flex items-center gap-1.5 font-semibold text-forest hover:underline disabled:cursor-not-allowed disabled:opacity-60 disabled:no-underline"
                  >
                    {loading ? "Sending…" : resendCountdown > 0 ? (
                      <>
                        Resend in <CountdownRing seconds={resendCountdown} total={OTP_RESEND_SECONDS} />
                      </>
                    ) : "Resend OTP"}
                  </button>
                </div>
                {renderError}
                <button
                  type="submit"
                  disabled={loading || otp.length !== 6}
                  className="relative overflow-hidden w-full rounded-full bg-leaf py-3 font-semibold text-white transition hover:bg-forest disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Shine />
                  <RollText>{loading ? "Verifying…" : "Verify OTP"}</RollText>
                </button>
                <button
                  type="button"
                  onClick={() => { setStep(step === "forgot-otp" ? "login" : "mobile"); setOtp(""); setError(""); setInfo(""); }}
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
                  disabled={loading || password.length < 8 || password !== confirmPassword}
                  className="relative overflow-hidden w-full rounded-full bg-leaf py-3 font-semibold text-white transition hover:bg-forest disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Shine />
                  <RollText>{loading ? "Please wait…" : step === "password" ? "Create Account" : "Reset Password"}</RollText>
                </button>
              </motion.form>
            ) : null}
          </AnimatePresence>

          <p className="mt-6 text-center text-xs text-ink/40">
            By continuing you agree to SkyBirds terms.
            <br />
            {step === "mobile" ? "New users verify their mobile number and create a password." : "Your mobile number is used to secure your account."}
          </p>
        </motion.div>

        <Link to="/" className="mt-6 text-sm font-medium text-forest hover:underline">
          ← Back to home
        </Link>
      </div>
    </div>
  );
}
