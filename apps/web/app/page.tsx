import { logoutAction } from './actions/auth.actions';
import { redirect } from 'next/navigation';
import { ThemeToggle } from '../components/ui/theme-toggle';

export default function Home() {
  const handleLogout = async () => {
    'use server';
    await logoutAction();
    redirect('/login');
  };

  return (
    <div className="bg-theme-background relative min-h-screen overflow-hidden selection:bg-blue-500/30">
      <header
        className="relative z-20 border-b backdrop-blur-xl"
        style={{
          borderColor: 'var(--border-color)',
          background: 'var(--surface-elevated)',
        }}
      >
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4 sm:px-8">
          <div>
            <p className="font-code text-theme-faint eyebrow">Portfolio OS</p>
            <h1 className="font-display text-theme-primary text-[1.35rem] font-semibold">
              Creator Dashboard
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <form action={handleLogout}>
              <button
                type="submit"
                className="text-theme-primary rounded-lg border px-4 py-2 text-sm font-medium transition hover:border-blue-400/40 hover:bg-blue-500/10"
                style={{
                  borderColor: 'var(--border-color)',
                  background: 'var(--surface-card)',
                }}
              >
                Logout
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-12 sm:px-8 sm:py-14">
        <div className="grid gap-6 md:grid-cols-3">
          {[
            {
              label: 'Profile Completion',
              value: '72%',
              tone: 'from-blue-400 to-indigo-500',
            },
            {
              label: 'Projects Published',
              value: '06',
              tone: 'from-blue-500 to-indigo-600',
            },
            {
              label: 'Weekly Visitors',
              value: '1.8k',
              tone: 'from-blue-500 to-violet-500',
            },
          ].map((card) => (
            <div key={card.label} className="glass rounded-2xl p-6 shadow-xl">
              <p className="text-theme-faint text-sm leading-6">{card.label}</p>
              <p
                className={`font-display mt-4 bg-linear-to-r ${card.tone} bg-clip-text text-4xl font-bold text-transparent`}
              >
                {card.value}
              </p>
            </div>
          ))}
        </div>

        <section className="glass rounded-3xl p-8 shadow-2xl sm:p-10">
          <span
            className="text-theme-faint eyebrow rounded-full border px-3 py-1"
            style={{
              borderColor: 'var(--border-color)',
              background: 'var(--surface-card)',
            }}
          >
            Portfolio Experience
          </span>
          <h2 className="font-display text-theme-primary mt-6 text-4xl font-extrabold sm:text-5xl">
            Build. Showcase. Grow.
          </h2>
          <p className="copy-sm text-theme-muted mt-6 max-w-2xl">
            Your authentication flow and UI components are now connected. Next,
            add projects, case studies, and social proof modules to launch a
            portfolio that stands out.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <button className="rounded-lg bg-blue-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-400">
              Create Case Study
            </button>
            <button
              className="text-theme-primary rounded-lg border px-5 py-2.5 text-sm font-semibold transition hover:bg-white/10"
              style={{
                borderColor: 'var(--border-color)',
                background: 'var(--surface-card)',
              }}
            >
              Edit Profile Theme
            </button>
          </div>
        </section>
      </main>

      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute top-20 left-10 h-72 w-72 rounded-full bg-blue-500/15 blur-[110px]" />
        <div className="absolute right-16 bottom-10 h-80 w-80 rounded-full bg-indigo-500/10 blur-[120px]" />
      </div>
    </div>
  );
}
