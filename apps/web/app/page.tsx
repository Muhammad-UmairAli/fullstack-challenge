export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black text-white selection:bg-indigo-500/30">
      <div className="relative flex flex-col items-center justify-center px-6">
        {/* Ambient Glow Effect */}
        <div className="absolute top-1/2 left-1/2 -z-10 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 animate-pulse rounded-full bg-indigo-500/20 blur-[100px] duration-3000" />

        <div className="flex flex-col items-center space-y-8 text-center transition-all">
          {/* Badge */}
          <div className="rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm font-medium tracking-wide text-indigo-300 backdrop-blur-md">
            🚀 Development in Progress
          </div>

          {/* Heading */}
          <h1 className="bg-linear-to-br from-white to-zinc-500 bg-clip-text text-5xl font-extrabold tracking-tight text-transparent sm:text-7xl">
            Building Something <br />
            <span className="bg-linear-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
              Incredible
            </span>
          </h1>

          {/* Subheading */}
          <p className="max-w-xl text-lg leading-relaxed text-zinc-400 sm:text-xl">
            We are actively forging the next iteration of the platform. Powered
            by a decoupled, type-safe architecture. The foundation is set.
          </p>

          {/* Status Indicator */}
          <div className="group mt-4 flex cursor-default items-center space-x-3 rounded-xl border border-white/10 bg-white/5 px-6 py-4 backdrop-blur-md transition-all hover:scale-105 hover:bg-white/10 hover:shadow-xl hover:shadow-indigo-500/10">
            <span className="relative flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500"></span>
            </span>
            <span className="text-sm font-medium text-zinc-300 transition-colors group-hover:text-white">
              Core Systems Online & Routing Active
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
