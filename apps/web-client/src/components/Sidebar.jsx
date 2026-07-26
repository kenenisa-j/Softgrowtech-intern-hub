// apps/web-client/src/components/Sidebar.jsx
// Sidebar navigation component tailored for each user role (Superadmin, Company Admin, Mentor, Intern).

import { useContext } from 'react'
import { AuthContext } from '../context/AuthContext'
import { 
  LayoutDashboard, ClipboardList, BarChart3, Inbox, Layers, 
  Users, FolderKanban, FileSpreadsheet,
  MessageSquare, Award, Clock, Building2, Bookmark, Search, UserCircle 
} from 'lucide-react'

const Sidebar = ({ activeTab, setActiveTab }) => {
  const { user } = useContext(AuthContext)

  if (!user) return null

  const role = (user.role || '').toUpperCase();

  const renderLinks = () => {
    if (role === 'SUPERADMIN') {
      return (
        <>
          <button
            onClick={() => setActiveTab('insights')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-xs cursor-pointer ${
              activeTab === 'insights'
                ? 'bg-fuchsia-600 text-white shadow-lg shadow-fuchsia-600/20'
                : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
            }`}
          >
            <BarChart3 size={16} />
            <span>Platform Insights</span>
          </button>
          
          <button
            onClick={() => setActiveTab('tenants')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-xs cursor-pointer ${
              activeTab === 'tenants'
                ? 'bg-fuchsia-600 text-white shadow-lg shadow-fuchsia-600/20'
                : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
            }`}
          >
            <FolderKanban size={16} />
            <span>Tenant directory</span>
          </button>
        </>
      )
    }

    if (role === 'ORG_ADMIN' || role === 'ADMIN') {
      return (
        <>
          <button
            onClick={() => setActiveTab('insights')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-xs cursor-pointer ${
              activeTab === 'insights'
                ? 'bg-fuchsia-600 text-white shadow-lg shadow-fuchsia-600/20'
                : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
            }`}
          >
            <LayoutDashboard size={16} />
            <span>Analytics overview</span>
          </button>

          <button
            onClick={() => setActiveTab('programs')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-xs cursor-pointer ${
              activeTab === 'programs'
                ? 'bg-fuchsia-600 text-white shadow-lg shadow-fuchsia-600/20'
                : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
            }`}
          >
            <FolderKanban size={16} />
            <span>Internship Programs</span>
          </button>

          <button
            onClick={() => setActiveTab('applications')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-xs cursor-pointer ${
              activeTab === 'applications'
                ? 'bg-fuchsia-600 text-white shadow-lg shadow-fuchsia-600/20'
                : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
            }`}
          >
            <FileSpreadsheet size={16} />
            <span>Candidate Applications</span>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-xs cursor-pointer ${
              activeTab === 'users'
                ? 'bg-fuchsia-600 text-white shadow-lg shadow-fuchsia-600/20'
                : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
            }`}
          >
            <Users size={16} />
            <span>Users directory</span>
          </button>

          <button
            onClick={() => setActiveTab('attendance')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-xs cursor-pointer ${
              activeTab === 'attendance'
                ? 'bg-fuchsia-600 text-white shadow-lg shadow-fuchsia-600/20'
                : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
            }`}
          >
            <Clock size={16} />
            <span>Daily Attendance</span>
          </button>



          <button
            onClick={() => setActiveTab('org_profile')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-xs cursor-pointer ${
              activeTab === 'org_profile'
                ? 'bg-fuchsia-600 text-white shadow-lg shadow-fuchsia-600/20'
                : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
            }`}
          >
            <Building2 size={16} />
            <span>Organization Profile</span>
          </button>
        </>
      )
    }

    if (role === 'MENTOR') {
      return (
        <>
          <button
            onClick={() => setActiveTab('insights')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-xs cursor-pointer ${
              activeTab === 'insights'
                ? 'bg-fuchsia-600 text-white shadow-lg shadow-fuchsia-600/20'
                : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
            }`}
          >
            <BarChart3 size={16} />
            <span>Insights Overview</span>
          </button>

          <button
            onClick={() => setActiveTab('tasks_mgr')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-xs cursor-pointer ${
              activeTab === 'tasks_mgr'
                ? 'bg-fuchsia-600 text-white shadow-lg shadow-fuchsia-600/20'
                : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
            }`}
          >
            <Layers size={16} />
            <span>Assign Tasks</span>
          </button>

          <button
            onClick={() => setActiveTab('submissions')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-xs cursor-pointer ${
              activeTab === 'submissions'
                ? 'bg-fuchsia-600 text-white shadow-lg shadow-fuchsia-600/20'
                : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
            }`}
          >
            <Inbox size={16} />
            <span>Submissions queue</span>
          </button>

          <button
            onClick={() => setActiveTab('attendance')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-xs cursor-pointer ${
              activeTab === 'attendance'
                ? 'bg-fuchsia-600 text-white shadow-lg shadow-fuchsia-600/20'
                : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
            }`}
          >
            <Clock size={16} />
            <span>Attendance Audits</span>
          </button>

          <button
            onClick={() => setActiveTab('evaluations')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-xs cursor-pointer ${
              activeTab === 'evaluations'
                ? 'bg-fuchsia-600 text-white shadow-lg shadow-fuchsia-600/20'
                : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
            }`}
          >
            <Award size={16} />
            <span>Skill Grading</span>
          </button>

          <button
            onClick={() => setActiveTab('chat')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-xs cursor-pointer ${
              activeTab === 'chat'
                ? 'bg-fuchsia-600 text-white shadow-lg shadow-fuchsia-600/20'
                : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
            }`}
          >
            <MessageSquare size={16} />
            <span>Private Chat</span>
          </button>
        </>
      )
    }

    if (role === 'INTERN') {
      return (
        <>
          <button
            onClick={() => setActiveTab('overview')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-xs cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-fuchsia-600 text-white shadow-lg shadow-fuchsia-600/20'
                : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
            }`}
          >
            <LayoutDashboard size={16} />
            <span>Program Progress</span>
          </button>

          <button
            onClick={() => setActiveTab('tasks')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-xs cursor-pointer ${
              activeTab === 'tasks'
                ? 'bg-fuchsia-600 text-white shadow-lg shadow-fuchsia-600/20'
                : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
            }`}
          >
            <ClipboardList size={16} />
            <span>Tasks & Submissions</span>
          </button>

          <button
            onClick={() => setActiveTab('attendance')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-xs cursor-pointer ${
              activeTab === 'attendance'
                ? 'bg-fuchsia-600 text-white shadow-lg shadow-fuchsia-600/20'
                : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
            }`}
          >
            <Clock size={16} />
            <span>Daily Punch Card</span>
          </button>

          <button
            onClick={() => setActiveTab('evaluations')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-xs cursor-pointer ${
              activeTab === 'evaluations'
                ? 'bg-fuchsia-600 text-white shadow-lg shadow-fuchsia-600/20'
                : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
            }`}
          >
            <Award size={16} />
            <span>Skill report cards</span>
          </button>

          <button
            onClick={() => setActiveTab('chat')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-xs cursor-pointer ${
              activeTab === 'chat'
                ? 'bg-fuchsia-600 text-white shadow-lg shadow-fuchsia-600/20'
                : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
            }`}
          >
            <MessageSquare size={16} />
            <span>Private Chat</span>
          </button>

          <button
            onClick={() => setActiveTab('reviews')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-xs cursor-pointer ${
              activeTab === 'reviews'
                ? 'bg-fuchsia-600 text-white shadow-lg shadow-fuchsia-600/20'
                : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
            }`}
          >
            <Award size={16} />
            <span>Program Review</span>
          </button>
        </>
      )
    }

    if (role === 'STUDENT') {
      return (
        <>
          <button
            onClick={() => setActiveTab('profile')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-xs cursor-pointer ${
              activeTab === 'profile'
                ? 'bg-fuchsia-600 text-white shadow-lg shadow-fuchsia-600/20'
                : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
            }`}
          >
            <UserCircle size={16} />
            <span>My Profile</span>
          </button>

          <button
            onClick={() => setActiveTab('saved')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-xs cursor-pointer ${
              activeTab === 'saved'
                ? 'bg-fuchsia-600 text-white shadow-lg shadow-fuchsia-600/20'
                : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
            }`}
          >
            <Bookmark size={16} />
            <span>Saved Programs</span>
          </button>

          <button
            onClick={() => setActiveTab('applications')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-xs cursor-pointer ${
              activeTab === 'applications'
                ? 'bg-fuchsia-600 text-white shadow-lg shadow-fuchsia-600/20'
                : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
            }`}
          >
            <ClipboardList size={16} />
            <span>My Applications</span>
          </button>

          <button
            onClick={() => setActiveTab('browse')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-xs cursor-pointer ${
              activeTab === 'browse'
                ? 'bg-fuchsia-600 text-white shadow-lg shadow-fuchsia-600/20'
                : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
            }`}
          >
            <Search size={16} />
            <span>Browse Internships</span>
          </button>
        </>
      )
    }

    return null
  }

  return (
    <aside className="fixed top-16 left-0 bottom-0 w-64 bg-zinc-950 border-r border-zinc-900 p-4 hidden md:flex flex-col gap-2 z-40">
      <div className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold px-4 mb-2 mt-4">
        Nextern
      </div>
      <div className="flex-1 flex flex-col gap-1.5">
        {renderLinks()}
      </div>
    </aside>
  )
}

export default Sidebar
