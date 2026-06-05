import React, { useContext } from 'react'
import { AuthContext } from '../context/AuthContext'
import { LogOut, GraduationCap } from 'lucide-react'

const Navbar = () => {
  const { user, logout } = useContext(AuthContext)

  if (!user) return null

  return (
    <nav className="fixed top-0 left-0 right-0 h-16 bg-slate-900/80 backdrop-blur-md border-b border-slate-800/80 z-50 px-6 flex items-center justify-between">
      {/* Brand */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
          <GraduationCap size={22} />
        </div>
        <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
          Softgrow Intern Hub
        </span>
      </div>

      {/* Profile & Logout */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3 bg-slate-800/60 pl-3 pr-4 py-1.5 rounded-full border border-slate-700/50">
          <div className="w-7 h-7 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-sm">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="text-sm">
            <span className="font-medium text-slate-200 block max-w-[120px] truncate leading-tight">
              {user.name}
            </span>
            <span className={`inline-block text-[10px] uppercase font-bold tracking-wider leading-none mt-0.5 ${
              user.role === 'mentor' || user.role === 'admin'
                ? 'text-amber-400'
                : 'text-indigo-400'
            }`}>
              {user.role}
            </span>
          </div>
        </div>

        <button
          onClick={logout}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 active:bg-slate-950 text-slate-300 hover:text-white rounded-xl border border-slate-700 transition-all text-sm font-medium"
        >
          <LogOut size={16} />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </nav>
  )
}

export default Navbar
