import React, { useState } from 'react';
import { Sparkles, Mail, Lock, Building, ArrowRight, ShieldCheck, Copy, ExternalLink, AlertCircle, Check, TrendingUp } from 'lucide-react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';

interface AuthProps {
  onSuccess: (user: any) => void;
}

export default function Auth({ onSuccess }: AuthProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [isDomainError, setIsDomainError] = useState(false);
  const [copiedText, setCopiedText] = useState('');
  const [showAutoRegister, setShowAutoRegister] = useState(false);

  const handleAutoRegister = async () => {
    setErrorMsg('');
    setShowAutoRegister(false);
    setLoading(true);
    try {
      const defaultCompany = email.split('@')[0] + "'s Company";
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, companyName: defaultCompany })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Auto-registration failed.');
      }

      const user = await response.json();
      localStorage.setItem('tallybird_userId', user.id);
      localStorage.setItem('tallybird_user', JSON.stringify(user));
      localStorage.setItem('finvoice_userId', user.id);
      localStorage.setItem('finvoice_user', JSON.stringify(user));
      onSuccess(user);
    } catch (err: any) {
      console.error('Auto-registration error:', err);
      setErrorMsg(err.message || 'Auto-registration error.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return setErrorMsg('Email and password are required.');
    if (!isLogin && !companyName) return setErrorMsg('Company Name is required.');

    setErrorMsg('');
    setIsDomainError(false);
    setShowAutoRegister(false);
    setLoading(true);

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, companyName })
      });

      if (!response.ok) {
        const data = await response.json();
        if (isLogin && data.emailExists === false) {
          setShowAutoRegister(true);
        }
        throw new Error(data.error || 'Authentication failed.');
      }

      const user = await response.json();
      localStorage.setItem('tallybird_userId', user.id);
      localStorage.setItem('tallybird_user', JSON.stringify(user));
      localStorage.setItem('finvoice_userId', user.id);
      localStorage.setItem('finvoice_user', JSON.stringify(user));
      onSuccess(user);
    } catch (err: any) {
      console.error('Auth error:', err);
      setErrorMsg(err.message || 'Authentication error.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg('');
    setIsDomainError(false);
    setLoading(true);
    try {
      // 1. Trigger the Google sign-in popup
      const result = await signInWithPopup(auth, googleProvider);
      const fbUser = result.user;

      // 2. Retrieve the Firebase ID Token
      const idToken = await fbUser.getIdToken();

      // 3. Send the ID Token to your backend API
      const response = await fetch('/api/auth/google', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idToken }),
      });

      const data = await response.json();

      if (response.ok) {
        // 4. Update local storage and notify parent component
        localStorage.setItem('tallybird_userId', data.id);
        localStorage.setItem('tallybird_user', JSON.stringify(data));
        localStorage.setItem('finvoice_userId', data.id);
        localStorage.setItem('finvoice_user', JSON.stringify(data));
        onSuccess(data);
      } else {
        throw new Error(data.error || 'Google Auth backend validation failed.');
      }
    } catch (error: any) {
      console.error('Google Sign-In Error:', error);
      if (error.code === 'auth/unauthorized-domain' || error.message?.includes('unauthorized-domain')) {
        setIsDomainError(true);
        setErrorMsg('Unauthorized domain: This application domain is not authorized in your Firebase Project configuration.');
      } else {
        setIsDomainError(false);
        setErrorMsg(error.message || 'Google Sign-In failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = () => {
    const guestUser = {
      id: 'default_user',
      email: 'guest@tallybird.ai',
      companyDetails: {
        name: 'Tallybird Innovations Ltd',
        email: 'billing@tallybird.com',
        address: '500 Technology Dr, Suite 300, San Jose, CA',
        phone: '+1 (415) 555-0199',
        bankName: 'Silicon Trust Bank',
        accountNumber: '987-654-3210',
        taxId: 'TX-99887766'
      }
    };
    localStorage.setItem('tallybird_userId', guestUser.id);
    localStorage.setItem('tallybird_user', JSON.stringify(guestUser));
    localStorage.setItem('finvoice_userId', guestUser.id);
    localStorage.setItem('finvoice_user', JSON.stringify(guestUser));
    onSuccess(guestUser);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 relative overflow-hidden" id="auth-panel">
      {/* Ambient background blur */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md bg-white border border-slate-100 rounded-2xl shadow-xl p-8 space-y-8 relative z-10">
        
        {/* Brand identity */}
        <div className="text-center space-y-3">
          <div className="inline-flex p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
            <TrendingUp className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center justify-center gap-1.5">
              Tallybird <Sparkles className="w-5 h-5 text-emerald-500 animate-pulse" />
            </h1>
            <p className="text-xs text-slate-400 mt-1.5 font-medium">
              Intelligent Full-Stack Invoice Generator & Ledger Auditor
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {errorMsg && (
            <div className="p-3.5 bg-rose-50 border border-rose-100 rounded-xl text-xs text-rose-700 font-semibold space-y-3">
              <div className="flex gap-2 items-start">
                <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
                <div className="leading-relaxed">{errorMsg}</div>
              </div>
              
              {isDomainError && (
                <div className="pt-2.5 mt-2.5 border-t border-rose-200/60 text-slate-700 font-medium space-y-2">
                  <p className="font-bold text-rose-800 text-[11px] uppercase tracking-wide">How to resolve this:</p>
                  <ol className="list-decimal pl-4 space-y-1.5 text-slate-600 text-[11px] leading-relaxed">
                    <li>Go to your <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-800 underline font-bold inline-flex items-center gap-0.5">Firebase Console <ExternalLink className="w-3 h-3" /></a></li>
                    <li>Select project <strong>tallybird-e6c76</strong></li>
                    <li>Navigate to <strong>Authentication</strong> &rarr; <strong>Settings</strong> &rarr; <strong>Authorized domains</strong> tab</li>
                    <li>Click <strong>"Add domain"</strong> and enter your current application domain listed below:</li>
                  </ol>
                  
                  <div className="mt-3 p-2.5 bg-slate-100 rounded-lg flex items-center justify-between border border-slate-200/80">
                    <code className="text-[11px] font-mono text-slate-800 select-all font-bold">
                      {window.location.hostname}
                    </code>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(window.location.hostname);
                        setCopiedText(window.location.hostname);
                        setTimeout(() => setCopiedText(''), 2000);
                      }}
                      className="p-1 hover:bg-slate-200 text-slate-500 hover:text-indigo-600 rounded transition cursor-pointer flex items-center gap-1 text-[10px] font-bold"
                      title="Copy Domain Hostname"
                    >
                      {copiedText === window.location.hostname ? (
                        <span className="text-emerald-600 flex items-center gap-0.5"><Check className="w-3.5 h-3.5" /> Copied!</span>
                      ) : (
                        <span className="flex items-center gap-0.5"><Copy className="w-3.5 h-3.5" /> Copy</span>
                      )}
                    </button>
                  </div>

                  <p className="text-[10px] text-slate-500 leading-normal">
                    💡 <em>Once added in the Firebase Console, you will be able to sign in successfully with Google without any domain restrictions!</em>
                  </p>
                </div>
              )}

              {showAutoRegister && (
                <div className="pt-2.5 mt-2.5 border-t border-rose-200/60 text-slate-700 font-medium space-y-2">
                  <p className="text-[11px] text-slate-600 leading-relaxed font-normal">
                    This account doesn't exist yet. Would you like to create a new company account with this email & password?
                  </p>
                  <button
                    type="button"
                    onClick={handleAutoRegister}
                    className="w-full py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition text-[11px] flex items-center justify-center gap-1 cursor-pointer shadow-sm"
                  >
                    <span>Register & Sign In Instantly</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          )}

          {!isLogin && (
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                Company Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 focus:border-indigo-500 rounded-xl text-xs outline-none bg-white text-slate-900 placeholder:text-slate-400 font-medium"
                  placeholder="e.g. Acme Corporation"
                />
                <Building className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 focus:border-indigo-500 rounded-xl text-xs outline-none bg-white text-slate-900 placeholder:text-slate-400 font-medium"
                placeholder="you@company.com"
              />
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
              Secure Password
            </label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 focus:border-indigo-500 rounded-xl text-xs outline-none bg-white text-slate-900 placeholder:text-slate-400 font-medium"
                placeholder="••••••••"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
            </div>
          </div>

          <button
            type="submit"
            id="btn-auth-submit"
            disabled={loading}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold text-xs rounded-xl transition shadow-md shadow-indigo-150 cursor-pointer flex items-center justify-center gap-1.5"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                {isLogin ? 'Sign In' : 'Create Account'}
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full py-2.5 bg-white border border-slate-200 hover:bg-slate-50 disabled:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer flex items-center justify-center gap-2 shadow-sm"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#EA4335"
                d="M12.24 10.285V14.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.866-3.577-7.866-8s3.536-8 7.866-8c2.46 0 4.105 1.025 5.047 1.926l3.227-3.11C18.281 1.09 15.42 0 12.24 0 5.58 0 0 5.37 0 12s5.58 12 12.24 12c6.96 0 11.57-4.84 11.57-11.79 0-.79-.085-1.4-.19-1.925H12.24z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>
        </form>

        {/* Separator / Alternative Actions */}
        <div className="space-y-4 pt-3 border-t border-slate-50">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-slate-400">
              {isLogin ? "Don't have an account?" : 'Already registered?'}
            </span>
            <button
              id="btn-auth-toggle"
              onClick={() => {
                setIsLogin(!isLogin);
                setErrorMsg('');
              }}
              className="text-indigo-600 hover:underline cursor-pointer"
            >
              {isLogin ? 'Create one' : 'Sign in here'}
            </button>
          </div>

          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-slate-100"></div>
            <span className="flex-shrink mx-4 text-[9px] text-slate-400 font-bold uppercase tracking-widest">
              Demo Environment Bypass
            </span>
            <div className="flex-grow border-t border-slate-100"></div>
          </div>

          <button
            onClick={handleGuestLogin}
            id="btn-auth-guest"
            className="w-full py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl transition border border-slate-200/50 cursor-pointer flex items-center justify-center gap-1.5"
          >
            Continue as Guest / Sandbox User
          </button>
        </div>

      </div>
    </div>
  );
}
