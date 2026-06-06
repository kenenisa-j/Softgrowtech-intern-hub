import React, { useContext } from 'react'
import { AuthContext } from '../context/AuthContext'
import { LayoutDashboard, ClipboardList, BarChart3, Inbox, Layers } from 'lucide-react'

const Sidebar = ({ activeTab, setActiveTab }) => {
  const { user } = useContext(AuthContext)

  if (!user) return null

  const renderLinks = () => {
    if (user.role === 'intern') {
      return (
        <>
          <button
            onClick={() => setActiveTab('overview')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm ${
              activeTab === 'overview'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200 cursor-pointer'
            }`}
          >
            <LayoutDashboard size={18} />
            <span>Overview & Progress</span>
          </button>
          
          <button
            onClick={() => setActiveTab('tasks')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm ${
              activeTab === 'tasks'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200 cursor-pointer'
            }`}
          >
            <ClipboardList size={18} />
            <span>Available Tasks</span>
          </button>
        </>
      )
    } else {
      return (
        <>
          <button
            onClick={() => setActiveTab('insights')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm ${
              activeTab === 'insights'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200 cursor-pointer'
            }`}
          >
            <BarChart3 size={18} />
            <span>Performance Insights</span>
          </button>

          <button
            onClick={() => setActiveTab('tasks_mgr')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm ${
              activeTab === 'tasks_mgr'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200 cursor-pointer'
            }`}
          >
            <Layers size={18} />
            <span>Task Manager</span>
          </button>

          <button
            onClick={() => setActiveTab('submissions')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm ${
              activeTab === 'submissions'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200 cursor-pointer'
            }`}
          >
            <Inbox size={18} />
            <span>Submissions Queue</span>
          </button>
        </>
      )
    }
  }

  return (
    <aside className="fixed top-16 left-0 bottom-0 w-64 bg-slate-900 border-r border-slate-800/80 p-4 hidden md:flex flex-col gap-2 z-40">
      <div className="text-[11px] uppercase tracking-widest text-slate-500 font-bold px-4 mb-2 mt-4">
        Navigation
      </div>
      <div className="flex-1 flex flex-col gap-1.5">
        {renderLinks()}
      </div>
    </aside>
  )
}

export default Sidebar
