import React, { useState } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { Mail, Lock, Eye, EyeClosed, ArrowRight, Briefcase } from 'lucide-react';
import { HolographicWall } from '@/components/ui/holographic-wall';

interface SignInCardProps {
  mode?: "login" | "register";
  onLogin: (email: string, password: string) => Promise<void>;
  onRegister: (email: string, password: string) => Promise<void>;
  loading?: boolean;
  error?: string | null;
}

export function SignInCard({ mode: initialMode = "login", onLogin, onRegister, loading = false, error = null }: SignInCardProps) {
  const [mode, setMode] = useState<"login" | "register">(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [localError, setLocalError] = useState("");

  // 3D card tilt
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useTransform(mouseY, [-300, 300], [6, -6]);
  const rotateY = useTransform(mouseX, [-300, 300], [-6, 6]);

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left - rect.width / 2);
    mouseY.set(e.clientY - rect.top - rect.height / 2);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError("");

    if (mode === "register" && password !== confirm) {
      setLocalError("Passwords don't match");
      return;
    }

    setIsSubmitting(true);
    try {
      if (mode === "login") {
        await onLogin(email, password);
      } else {
        await onRegister(email, password);
      }
    } catch {
      // Error handled by AuthContext
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayError = localError || error;
  const submitting = isSubmitting || loading;

  const inputStyle = (field: string, extra?: React.CSSProperties): React.CSSProperties => ({
    width: '100%',
    height: '2.75rem',
    borderRadius: '0.5rem',
    border: focusedInput === field ? '1.5px solid #8B5E3C' : '1px solid #e8e0d8',
    background: '#ffffff',
    color: '#1a1a1a',
    fontSize: '0.875rem',
    outline: 'none',
    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
    boxShadow: focusedInput === field ? '0 0 0 3px rgba(139, 94, 60, 0.1)' : 'none',
    ...extra,
  });

  return (
    <div style={{ minHeight: '100vh', width: '100vw', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
      {/* Holographic background */}
      <HolographicWall intensity={0.8} radius={200} />

      {/* Card container — above the wall */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        style={{ width: '100%', maxWidth: '420px', padding: '0 1rem', perspective: 1200, position: 'relative', zIndex: 10 }}
      >
        <motion.div
          style={{ rotateX, rotateY }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          {/* ═══ CARD ═══ */}
          <div style={{
            background: '#ffffff',
            borderRadius: '1rem',
            border: '1px solid #e8e0d8',
            boxShadow: '0 8px 40px rgba(0, 0, 0, 0.25), 0 2px 8px rgba(0, 0, 0, 0.1)',
            padding: '2.25rem 2rem',
          }}>

            {/* ── Logo + Header ── */}
            <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", duration: 0.8 }}
                style={{
                  width: '3rem', height: '3rem', borderRadius: '0.75rem',
                  background: '#8B5E3C', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 0.875rem',
                }}
              >
                <Briefcase style={{ width: '1.25rem', height: '1.25rem', color: '#ffffff' }} />
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1a1a1a', lineHeight: 1.3, margin: 0 }}
              >
                {mode === "login" ? "Welcome back" : "Create your account"}
              </motion.h1>
              
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                style={{ fontSize: '0.875rem', color: '#666666', marginTop: '0.375rem' }}
              >
                {mode === "login"
                  ? "Sign in to manage your job applications"
                  : "Start tracking your job applications"}
              </motion.p>
            </div>

            {/* ── Error ── */}
            <AnimatePresence>
              {displayError && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  style={{
                    borderRadius: '0.5rem', border: '1px solid rgba(231, 76, 60, 0.2)',
                    background: 'rgba(231, 76, 60, 0.08)', color: '#e74c3c',
                    padding: '0.75rem', fontSize: '0.8rem', marginBottom: '1rem',
                  }}
                >
                  {displayError}
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Form ── */}
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                
                {/* Email */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: '#1a1a1a', marginBottom: '0.375rem' }}>
                    Email
                  </label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <Mail style={{
                      position: 'absolute', left: '0.875rem', width: '1rem', height: '1rem', pointerEvents: 'none',
                      color: focusedInput === "email" ? '#8B5E3C' : '#999999', transition: 'color 0.2s',
                    }} />
                    <input
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onFocus={() => setFocusedInput("email")}
                      onBlur={() => setFocusedInput(null)}
                      required
                      style={inputStyle("email", { paddingLeft: '2.75rem', paddingRight: '0.875rem' })}
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: '#1a1a1a', marginBottom: '0.375rem' }}>
                    Password
                  </label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <Lock style={{
                      position: 'absolute', left: '0.875rem', width: '1rem', height: '1rem', pointerEvents: 'none',
                      color: focusedInput === "password" ? '#8B5E3C' : '#999999', transition: 'color 0.2s',
                    }} />
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onFocus={() => setFocusedInput("password")}
                      onBlur={() => setFocusedInput(null)}
                      required
                      style={inputStyle("password", { paddingLeft: '2.75rem', paddingRight: '2.75rem' })}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute', right: '0.875rem', background: 'none', border: 'none',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0,
                      }}
                    >
                      {showPassword ? (
                        <Eye style={{ width: '1rem', height: '1rem', color: '#999999' }} />
                      ) : (
                        <EyeClosed style={{ width: '1rem', height: '1rem', color: '#999999' }} />
                      )}
                    </button>
                  </div>
                </div>

                {/* Confirm Password (register mode) */}
                <AnimatePresence>
                  {mode === "register" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: '#1a1a1a', marginBottom: '0.375rem' }}>
                        Confirm Password
                      </label>
                      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                        <Lock style={{
                          position: 'absolute', left: '0.875rem', width: '1rem', height: '1rem', pointerEvents: 'none',
                          color: focusedInput === "confirm" ? '#8B5E3C' : '#999999', transition: 'color 0.2s',
                        }} />
                        <input
                          type={showPassword ? "text" : "password"}
                          placeholder="Repeat your password"
                          value={confirm}
                          onChange={(e) => setConfirm(e.target.value)}
                          onFocus={() => setFocusedInput("confirm")}
                          onBlur={() => setFocusedInput(null)}
                          required
                          style={inputStyle("confirm", { paddingLeft: '2.75rem', paddingRight: '0.875rem' })}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* ── Sign In button ── */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={submitting}
                style={{
                  width: '100%', height: '2.75rem', marginTop: '1.5rem',
                  borderRadius: '0.5rem', border: 'none', cursor: submitting ? 'not-allowed' : 'pointer',
                  background: '#8B5E3C', color: '#ffffff',
                  fontSize: '0.875rem', fontWeight: 600,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  gap: '0.375rem', transition: 'background 0.2s',
                  opacity: submitting ? 0.7 : 1,
                }}
                onMouseEnter={(e) => { if (!submitting) e.currentTarget.style.background = '#7a5235'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = '#8B5E3C'; }}
              >
                <AnimatePresence mode="wait">
                  {submitting ? (
                    <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{
                        width: '1.125rem', height: '1.125rem', border: '2px solid rgba(255,255,255,0.4)',
                        borderTopColor: '#ffffff', borderRadius: '50%', animation: 'spin 0.8s linear infinite',
                      }} />
                    </motion.div>
                  ) : (
                    <motion.span key="text" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                      {mode === "login" ? "Sign In" : "Create Account"}
                      <ArrowRight style={{ width: '0.875rem', height: '0.875rem' }} />
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>

              {/* ── Toggle mode ── */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                style={{ textAlign: 'center', fontSize: '0.8rem', color: '#666666', marginTop: '1.25rem' }}
              >
                {mode === "login" ? (
                  <>
                    Don't have an account?{' '}
                    <button
                      type="button"
                      onClick={() => { setMode("register"); setLocalError(""); }}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                        color: '#8B5E3C', fontWeight: 600, fontSize: '0.8rem',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.textDecoration = 'underline'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.textDecoration = 'none'; }}
                    >
                      Sign up
                    </button>
                  </>
                ) : (
                  <>
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => { setMode("login"); setLocalError(""); }}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                        color: '#8B5E3C', fontWeight: 600, fontSize: '0.8rem',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.textDecoration = 'underline'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.textDecoration = 'none'; }}
                    >
                      Sign in
                    </button>
                  </>
                )}
              </motion.p>
            </form>
          </div>
        </motion.div>
      </motion.div>

      {/* Spin keyframes */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default SignInCard;
