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
    <div className="relative min-h-screen overflow-hidden transition-all duration-300">
      {/* ═══════════════════════════════════════════
          HEADER / NAVIGATION (Sticky + Glassmorphic)
          ═══════════════════════════════════════════ */}
      <header className="nav-sticky px-6 py-4">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between">
          <div className="group flex items-center gap-3">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-lg text-sm font-bold"
              style={{
                background: 'var(--accent)',
                color: 'var(--bg-primary)',
              }}
            >
              u
            </div>
            <div>
              <p className="font-code eyebrow text-theme-faint">um.air</p>
              <h1 className="font-display text-theme-primary text-lg leading-tight font-semibold">
                Umair&apos;s Space
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <form action={handleLogout}>
              <button
                type="submit"
                className="glass hover-border-accent rounded-lg px-4 py-2 text-sm font-medium transition-all duration-300"
              >
                Logout
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* ═══════════════════════════════════════════
          HERO SECTION
          ═══════════════════════════════════════════ */}
      <main className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-12 px-6 py-14 sm:px-8">
        {/* Status badge */}
        <section className="text-center sm:text-left">
          <div
            className="mb-8 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 transition-transform duration-300 hover:scale-105"
            style={{
              borderColor: 'var(--border-color)',
              background: 'var(--surface-card)',
            }}
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
            </span>
            <span className="eyebrow text-theme-faint">
              Available for new projects
            </span>
          </div>

          <h1 className="font-display text-theme-primary mb-6 max-w-3xl text-5xl font-extrabold sm:text-6xl">
            Build. Showcase.{' '}
            <span style={{ color: 'var(--accent)' }}>Grow.</span>
          </h1>
          <p className="copy-sm text-theme-muted mb-10 max-w-2xl">
            Your authentication, security, and UI systems are production-ready.
            Start adding projects, case studies, and social proof to launch a
            portfolio that stands out.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 sm:justify-start">
            <button className="btn-primary">Create Case Study</button>
            <button className="glass hover-border-accent rounded-xl px-8 py-3 text-sm font-medium transition-all duration-300">
              Edit Profile Theme
            </button>
          </div>
        </section>

        {/* ═══════════════════════════════════════════
            STATS GRID
            ═══════════════════════════════════════════ */}
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
              tone: 'from-emerald-400 to-teal-500',
            },
            {
              label: 'Weekly Visitors',
              value: '1.8k',
              tone: 'from-violet-400 to-purple-500',
            },
          ].map((card) => (
            <div key={card.label} className="glass-card p-7">
              <p className="eyebrow text-theme-faint mb-4">{card.label}</p>
              <p
                className={`font-display bg-linear-to-r ${card.tone} bg-clip-text text-4xl font-bold text-transparent`}
              >
                {card.value}
              </p>
            </div>
          ))}
        </div>

        {/* ═══════════════════════════════════════════
            SKILLS / TECH STACK
            ═══════════════════════════════════════════ */}
        <section className="glass rounded-3xl p-8 sm:p-10">
          <span
            className="eyebrow text-theme-faint mb-6 inline-block rounded-full border px-3 py-1"
            style={{
              borderColor: 'var(--border-color)',
              background: 'var(--surface-card)',
            }}
          >
            Tech Stack
          </span>
          <div className="mt-4 flex flex-wrap gap-3">
            {[
              'TypeScript',
              'NestJS',
              'Next.js',
              'React',
              'Prisma',
              'PostgreSQL',
              'Docker',
              'Tailwind CSS',
              'Zod',
              'JWT Auth',
            ].map((tech) => (
              <span
                key={tech}
                className="glass hover-border-accent rounded-lg px-4 py-2 text-sm font-medium transition-all duration-300"
                style={{ color: 'var(--text-primary)' }}
              >
                {tech}
              </span>
            ))}
          </div>
        </section>
      </main>

      {/* ═══════════════════════════════════════════
          FOOTER
          ═══════════════════════════════════════════ */}
      <footer
        className="mt-20 border-t px-6 py-8"
        style={{
          borderColor: 'var(--border-color)',
          background: 'var(--bg-secondary)',
        }}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <p className="text-theme-faint text-sm">
            © 2026 um.air. Built with NestJS + Next.js.
          </p>
          <div className="flex gap-4">
            {['GitHub', 'LinkedIn', 'Twitter'].map((social) => (
              <a
                key={social}
                href="#"
                className="text-theme-faint hover-text-accent text-sm transition-colors duration-300"
              >
                {social}
              </a>
            ))}
          </div>
        </div>
      </footer>

      {/* ═══════════════════════════════════════════
          AMBIENT BACKGROUND EFFECTS
          ═══════════════════════════════════════════ */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div
          className="absolute -top-[10%] -left-[10%] h-[40%] w-[40%] rounded-full blur-[120px]"
          style={{
            background: 'color-mix(in srgb, var(--accent) 15%, transparent)',
          }}
        />
        <div
          className="absolute -right-[10%] -bottom-[10%] h-[40%] w-[40%] rounded-full blur-[120px]"
          style={{
            background: 'color-mix(in srgb, var(--accent) 10%, transparent)',
          }}
        />
      </div>
    </div>
  );
}
