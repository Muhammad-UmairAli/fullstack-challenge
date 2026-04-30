'use client';

import { motion, type Variants } from 'framer-motion';
import { logoutAction } from './actions/auth.actions';
import { useRouter } from 'next/navigation';
import { ThemeToggle } from '../components/ui/theme-toggle';

import { useEffect, useState, useMemo } from 'react';

// ═══════════════════════════════════════════
// MINIMALIST ANIMATION VARIANTS
// ═══════════════════════════════════════════

const fastFade: Variants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: { duration: 0.3, ease: 'easeOut' as const },
  },
};

const StarLayer = ({
  size,
  opacity,
  speed,
  count,
  mouseX,
  mouseY,
  parallaxFactor,
}: {
  size: number;
  opacity: number;
  speed: number;
  count: number;
  mouseX: number;
  mouseY: number;
  parallaxFactor: number;
}) => {
  const [stars, setStars] = useState('');

  useEffect(() => {
    const generated = Array.from({ length: count })
      .map(() => {
        const x = Math.floor(Math.random() * 3000);
        const y = Math.floor(Math.random() * 3000);
        return `${x}px ${y}px var(--text-primary)`;
      })
      .join(', ');
    setStars(generated);
  }, [count]);

  return (
    <motion.div
      animate={{ y: [-2000, 0] }}
      transition={{ duration: speed, repeat: Infinity, ease: 'linear' }}
      className="absolute inset-0"
    >
      <motion.div
        animate={{
          x: mouseX * parallaxFactor,
          y: mouseY * parallaxFactor,
        }}
        transition={{ type: 'spring', damping: 20, stiffness: 50 }}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          boxShadow: stars,
          opacity,
          willChange: 'transform',
        }}
      />
    </motion.div>
  );
};

const ShootingStar = () => {
  const config = useMemo(
    () => ({
      top: Math.random() * 70,
      left: Math.random() * 80,
      duration: Math.random() * 1.2 + 0.6,
      delay: Math.random() * 10,
      angle: Math.random() * 20 - 55, // -35 to -55 range
      length: Math.random() * 150 + 100,
    }),
    [],
  );

  return (
    <motion.div
      initial={{ x: config.length, y: -config.length, opacity: 0 }}
      animate={{
        x: -config.length,
        y: config.length,
        opacity: [0, 1, 1, 0],
      }}
      transition={{
        duration: config.duration,
        repeat: Infinity,
        repeatDelay: Math.random() * 15 + 8,
        ease: 'easeOut',
      }}
      className="absolute h-px bg-linear-to-r from-transparent via-(--accent)/80 to-transparent"
      style={{
        width: `${config.length}px`,
        rotate: `${config.angle}deg`,
        top: `${config.top}%`,
        left: `${config.left}%`,
      }}
    />
  );
};

const Starfield = ({ x, y }: { x: number; y: number }) => (
  <div className="fixed inset-0 -z-20 overflow-hidden">
    <StarLayer
      size={1}
      opacity={0.3}
      speed={150}
      count={600}
      mouseX={x}
      mouseY={y}
      parallaxFactor={-0.01}
    />
    <StarLayer
      size={1.5}
      opacity={0.5}
      speed={100}
      count={250}
      mouseX={x}
      mouseY={y}
      parallaxFactor={-0.02}
    />
    <StarLayer
      size={2}
      opacity={0.6}
      speed={70}
      count={60}
      mouseX={x}
      mouseY={y}
      parallaxFactor={-0.04}
    />
    <ShootingStar />
    <ShootingStar />
    <ShootingStar />
    <ShootingStar />
  </div>
);

export default function Home() {
  const router = useRouter();
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleLogout = async () => {
    await logoutAction();
    router.push('/login');
  };

  return (
    <div className="relative min-h-screen overflow-hidden transition-all duration-300">
      <Starfield x={mousePos.x} y={mousePos.y} />
      {/* ═══════════════════════════════════════════
          HEADER / NAVIGATION (Sticky + Glassmorphic)
          ═══════════════════════════════════════════ */}
      <motion.header
        variants={fastFade}
        initial="initial"
        animate="animate"
        className="nav-sticky px-6 py-4"
      >
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
            <button
              onClick={handleLogout}
              className="glass hover-border-accent rounded-lg px-4 py-2 text-sm font-medium transition-all duration-300"
            >
              Logout
            </button>
          </div>
        </div>
      </motion.header>

      {/* ═══════════════════════════════════════════
          HERO SECTION
          ═══════════════════════════════════════════ */}
      <motion.main
        initial="initial"
        animate="animate"
        variants={fastFade}
        className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-12 px-6 py-14 sm:px-8"
      >
        {/* Status badge */}
        <section className="text-center sm:text-left">
          <div
            className="mb-8 inline-flex items-center gap-2 rounded-full border px-4 py-1.5"
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

          <h1 className="font-display text-theme-primary mb-6 max-w-3xl text-5xl font-extrabold sm:text-7xl">
            Build. Showcase.{' '}
            <span style={{ color: 'var(--accent)' }}>Grow.</span>
          </h1>
          <p className="copy-sm text-theme-muted mb-10 max-w-2xl text-lg leading-relaxed">
            Your authentication, security, and UI systems are production-ready.
            Start adding projects, case studies, and social proof to launch a
            portfolio that stands out.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 sm:justify-start">
            <button className="btn-primary shadow-accent/20 px-10 py-4 text-base shadow-xl">
              Create Case Study
            </button>
            <button className="glass hover-border-accent rounded-xl px-10 py-4 text-base font-medium transition-all duration-300">
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
            <div
              key={card.label}
              className="glass-card hover:border-accent/30 p-7 transition-all duration-500"
            >
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
                className="glass hover-border-accent hover:bg-accent hover:text-bg-primary cursor-default rounded-lg px-4 py-2 text-sm font-medium transition-all duration-300"
                style={{ color: 'var(--text-primary)' }}
              >
                {tech}
              </span>
            ))}
          </div>
        </section>
      </motion.main>

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
                className="text-theme-faint hover:text-accent text-sm transition-colors duration-300"
              >
                {social}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
