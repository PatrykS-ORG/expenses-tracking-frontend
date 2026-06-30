import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, Sparkles, BarChart3, Shield } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { LanguageSwitcher } from './LanguageSwitcher';
import { SpendwellLogo } from './SpendwellLogo';

const features = [
  { key: 'auth.featureSummaries', icon: Sparkles },
  { key: 'auth.featureReports', icon: BarChart3 },
  { key: 'auth.featureSecure', icon: Shield },
] as const;

export function Auth() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        setSuccess(t('auth.accountCreated'));
        setIsSignUp(false);
        setPassword('');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(t('auth.authError'));
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsSignUp((current) => !current);
    setError(null);
    setSuccess(null);
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });

      if (error) throw error;
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(t('auth.authError'));
      }
      setLoading(false);
    }
  };

  const inputClassName =
    'block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 sm:text-sm';

  return (
    <div className="relative min-h-screen bg-slate-50">
      <div className="absolute right-4 top-4 z-10 sm:right-8 sm:top-8">
        <LanguageSwitcher />
      </div>

      <div className="flex min-h-screen flex-col lg:flex-row lg:items-stretch">
        <section className="relative flex flex-col justify-between overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 px-6 py-10 text-white sm:px-10 lg:w-1/2 lg:px-12 lg:py-12">
          <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-10 h-72 w-72 rounded-full bg-blue-400/20 blur-3xl" />

          <div className="relative">
            <SpendwellLogo size="xl" inheritBackground />
            <p className="mt-6 max-w-md text-lg leading-relaxed text-blue-100 sm:text-xl">
              {t('auth.tagline')}
            </p>
          </div>

          <ul className="relative mt-10 hidden space-y-4 lg:block">
            {features.map(({ key, icon: Icon }) => (
              <li key={key} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/15 ring-1 ring-white/20">
                  <Icon className="h-4 w-4 text-white" aria-hidden="true" />
                </span>
                <span className="pt-1 text-sm leading-relaxed text-blue-50 sm:text-base">
                  {t(key)}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="flex min-h-0 flex-1 items-center justify-center px-4 py-10 sm:px-6 lg:min-h-screen lg:px-10 lg:py-0">
          <div className="flex w-full max-w-md flex-col items-center">
            <div className="mb-8">
              <SpendwellLogo size="xl" />
            </div>

            <div className="w-full rounded-2xl border border-slate-200/80 bg-white p-8 shadow-xl shadow-slate-200/60">
              <div className="mb-8 text-center lg:text-left">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                  {isSignUp ? t('auth.signUp') : t('auth.signIn')}
                </h1>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  {isSignUp
                    ? t('auth.signUpSubtitle')
                    : t('auth.signInSubtitle')}
                </p>
              </div>

              {success && (
                <div
                  role="status"
                  className="mb-6 flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
                >
                  <CheckCircle2
                    className="mt-0.5 h-4 w-4 shrink-0"
                    aria-hidden="true"
                  />
                  <span>{success}</span>
                </div>
              )}

              <form className="space-y-5" onSubmit={handleAuth}>
                <div>
                  <label
                    htmlFor="email-address"
                    className="mb-1.5 block text-sm font-medium text-slate-700"
                  >
                    {t('auth.emailLabel')}
                  </label>
                  <input
                    id="email-address"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className={inputClassName}
                    placeholder={t('auth.emailPlaceholder')}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="mb-1.5 block text-sm font-medium text-slate-700"
                  >
                    {t('auth.passwordLabel')}
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete={
                      isSignUp ? 'new-password' : 'current-password'
                    }
                    required
                    className={inputClassName}
                    placeholder={t('auth.passwordPlaceholder')}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>

                {error && (
                  <div
                    role="alert"
                    className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-center text-sm text-red-700"
                  >
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading
                    ? t('common.processing')
                    : isSignUp
                      ? t('auth.register')
                      : t('auth.signIn')}
                </button>

                <div className="relative py-1">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase tracking-wide text-slate-500">
                    <span className="bg-white px-2">
                      {t('auth.orContinueWithGoogle')}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    className="h-4 w-4"
                    aria-hidden="true"
                  >
                    <path
                      fill="#EA4335"
                      d="M12 10.2v3.9h5.5c-.2 1.3-1.5 3.9-5.5 3.9-3.3 0-6-2.8-6-6.2s2.7-6.2 6-6.2c1.9 0 3.2.8 3.9 1.5l2.7-2.6C16.9 2.9 14.7 2 12 2 6.9 2 2.8 6.5 2.8 12s4.1 10 9.2 10c5.3 0 8.9-3.8 8.9-9.1 0-.6-.1-1.1-.2-1.6H12z"
                    />
                  </svg>
                  {t('auth.continueWithGoogle')}
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-slate-600">
                {isSignUp ? t('auth.hasAccount') : t('auth.noAccount')}{' '}
                <button
                  type="button"
                  onClick={toggleMode}
                  disabled={loading}
                  className="font-semibold text-blue-600 hover:text-blue-700 disabled:opacity-60"
                >
                  {isSignUp ? t('auth.signInAction') : t('auth.signUpAction')}
                </button>
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
