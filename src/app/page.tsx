export default function Home() {
  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4 font-mono select-none">
      <main className="flex flex-col items-center justify-center gap-12 max-w-2xl">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-5xl font-bold text-green-400 animate-pulse">
            IPS Training Games
          </h1>
          <p className="text-gray-300 text-lg">
            Memory and spatial reasoning challenges
          </p>
        </div>

        {/* Games Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
          {/* Blind Grid Card */}
          <a
            href="/blind-grid"
            className="group relative overflow-hidden rounded-lg bg-gray-800 p-8 border border-gray-700 hover:border-green-400 transition-all duration-300 hover:shadow-[0_0_20px_rgba(74,222,128,0.3)]"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-green-400/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10 space-y-4">
              <h2 className="text-2xl font-bold text-green-400">Blind Grid</h2>
              <p className="text-gray-400 text-sm leading-relaxed">
                Memorize a 3x3 grid, then reconstruct it after a series of transformations. Test your mental spatial reasoning.
              </p>
              <div className="flex items-center justify-between pt-4">
                <span className="text-xs uppercase tracking-widest text-gray-500">
                  Launch Game →
                </span>
                <div className="w-8 h-8 bg-green-400/20 rounded group-hover:bg-green-400/40 transition-colors" />
              </div>
            </div>
          </a>

          {/* Invisible Die Card */}
          <a
            href="/invisible-die"
            className="group relative overflow-hidden rounded-lg bg-gray-800 p-8 border border-gray-700 hover:border-cyan-400 transition-all duration-300 hover:shadow-[0_0_20px_rgba(34,211,238,0.3)]"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10 space-y-4">
              <h2 className="text-2xl font-bold text-cyan-400">Invisible Die</h2>
              <p className="text-gray-400 text-sm leading-relaxed">
                Track the orientation of a die as it rolls and rotates in the darkness. Master 3D visualization.
              </p>
              <div className="flex items-center justify-between pt-4">
                <span className="text-xs uppercase tracking-widest text-gray-500">
                  Launch Game →
                </span>
                <div className="w-8 h-8 bg-cyan-400/20 rounded group-hover:bg-cyan-400/40 transition-colors" />
              </div>
            </div>
          </a>

          {/* Voxel Carver Card */}
          <a
            href="/voxel-carver"
            className="group relative overflow-hidden rounded-lg bg-gray-800 p-8 border border-gray-700 hover:border-yellow-400 transition-all duration-300 hover:shadow-[0_0_20px_rgba(250,204,21,0.3)]"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10 space-y-4">
              <h2 className="text-2xl font-bold text-yellow-400">Voxel Carver</h2>
              <p className="text-gray-400 text-sm leading-relaxed">
                Visualize a 3D cube being carved by laser cuts. Track which blocks remain after each transformation.
              </p>
              <div className="flex items-center justify-between pt-4">
                <span className="text-xs uppercase tracking-widest text-gray-500">
                  Launch Game →
                </span>
                <div className="w-8 h-8 bg-yellow-400/20 rounded group-hover:bg-yellow-400/40 transition-colors" />
              </div>
            </div>
          </a>
        </div>

        {/* Footer */}
        <div className="pt-8 text-center text-sm text-gray-500 border-t border-gray-700 w-full">
          <p>Sharpen your cognitive abilities through engaging spatial challenges</p>
        </div>
      </main>
    </div>
  );
}
