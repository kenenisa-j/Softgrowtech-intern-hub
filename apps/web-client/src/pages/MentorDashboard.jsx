import React, { useState, useEffect, useContext } from 'react'
import { AuthContext } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import Sidebar from '../components/Sidebar'
import { Users, BarChart3, Inbox, Plus, ChevronDown, ChevronUp } from 'lucide-react'

const MentorDashboard = () => {
  const { authAxios } = useContext(AuthContext)
  const [activeTab, setActiveTab] = useState('insights')
  
  // States
  const [submissions, setSubmissions] = useState([])
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  
  // Accordion for Task Creation
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false)
  
  // Task Creation Form State
  const [taskTitle, setTaskTitle] = useState('')
  const [taskDesc, setTaskDesc] = useState('')
  const [taskDeadline, setTaskDeadline] = useState('')
  
  const [taskError, setTaskError] = useState('')
  const [taskSuccess, setTaskSuccess] = useState('')
  const [isCreatingTask, setIsCreatingTask] = useState(false)

  // Grading Form State (Active Submission to Grade)
  const [activeGradingSub, setActiveGradingSub] = useState(null)
  const [gradeStatus, setGradeStatus] = useState('approved')
  const [gradeValue, setGradeValue] = useState('')
  const [gradeFeedback, setGradeFeedback] = useState('')
  
  const [gradeError, setGradeError] = useState('')
  const [gradeSuccess, setGradeSuccess] = useState('')
  const [isSubmittingGrade, setIsSubmittingGrade] = useState(false)

  const fetchData = async () => {
    try {
      setLoading(true)
      const subRes = await authAxios.get('/submissions')
      const tasksRes = await authAxios.get('/tasks')
      setSubmissions(subRes.data.submissions || [])
      setTasks(tasksRes.data.tasks || [])
    } catch (err) {
      console.error('Error loading mentor dashboard details:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleCreateTask = async (e) => {
    e.preventDefault()
    setTaskError('')
    setTaskSuccess('')
    setIsCreatingTask(true)

    try {
      await authAxios.post('/tasks', {
        title: taskTitle,
        description: taskDesc,
        deadline: taskDeadline || null
      })
      setTaskSuccess('Task assignment created successfully!')
      setTaskTitle('')
      setTaskDesc('')
      setTaskDeadline('')
      setIsTaskFormOpen(false)
      await fetchData()
    } catch (err) {
      console.error(err)
      setTaskError(err.response?.data?.message || 'Failed to create task.')
    } finally {
      setIsCreatingTask(false)
    }
  }

  const handleGradeSubmission = async (e) => {
    e.preventDefault()
    setGradeError('')
    setGradeSuccess('')
    setIsSubmittingGrade(true)

    try {
      await authAxios.put(`/submissions/grade/${activeGradingSub.id}`, {
        status: gradeStatus,
        grade: gradeValue,
        feedback: gradeFeedback
      })
      setGradeSuccess('Submission evaluation updated!')
      setGradeValue('')
      setGradeFeedback('')
      
      await fetchData()
      
      setTimeout(() => {
        setActiveGradingSub(null)
        setGradeSuccess('')
      }, 1500)
    } catch (err) {
      console.error(err)
      setGradeError(err.response?.data?.message || 'Failed to submit grade evaluation.')
    } finally {
      setIsSubmittingGrade(false)
    }
  }

  // Analytics Math
  const totalSubmissions = submissions.length
  const pendingCount = submissions.filter(s => s.status === 'pending').length
  const approvedCount = submissions.filter(s => s.status === 'approved').length
  const revisionCount = submissions.filter(s => s.status === 'needs_revision').length
  const successRate = totalSubmissions > 0 ? Math.round((approvedCount / totalSubmissions) * 100) : 0
  
  // Extract unique interns
  const uniqueInterns = Array.from(new Set(submissions.map(s => s.intern_name))).filter(Boolean)
  const totalInterns = uniqueInterns.length

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Navbar />
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="md:pl-64 pt-16 min-h-screen">
        <div className="p-6 max-w-6xl mx-auto space-y-8">
          
          {/* Header */}
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-100 to-slate-400 bg-clip-text text-transparent">
              Mentor Portal
            </h1>
            <p className="text-slate-400 text-sm mt-1">Review student work, manage tasks, and inspect analytics.</p>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="w-10 h-10 border-4 border-slate-800 border-t-indigo-500 rounded-full animate-spin"></div>
            </div>
          ) : (
            <>
              {activeTab === 'insights' && (
                <div className="space-y-8 animate-in fade-in duration-200">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div className="glass-panel p-6 rounded-2xl flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                        <Users size={24} />
                      </div>
                      <div>
                        <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">Registered Interns</span>
                        <span className="text-2xl font-bold text-slate-100">{totalInterns}</span>
                      </div>
                    </div>

                    <div className="glass-panel p-6 rounded-2xl flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                        <BarChart3 size={24} />
                      </div>
                      <div>
                        <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">Approval Success Rate</span>
                        <span className="text-2xl font-bold text-slate-100">{successRate}%</span>
                      </div>
                    </div>

                    <div className="glass-panel p-6 rounded-2xl flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                        <Inbox size={24} />
                      </div>
                      <div>
                        <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">Pending Audits</span>
                        <span className="text-2xl font-bold text-slate-100">{pendingCount}</span>
                      </div>
                    </div>
                  </div>

                  <div className="glass-panel p-6 rounded-2xl space-y-6">
                    <h2 className="text-lg font-bold text-slate-100">Submissions Breakdown</h2>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-xs text-slate-400 mb-1">
                          <span>Approved Submissions ({approvedCount})</span>
                          <span>{totalSubmissions > 0 ? Math.round((approvedCount / totalSubmissions) * 100) : 0}%</span>
                        </div>
                        <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                          <div 
                            className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                            style={{ width: `${totalSubmissions > 0 ? (approvedCount / totalSubmissions) * 100 : 0}%` }}
                          ></div>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-xs text-slate-400 mb-1">
                          <span>Pending Review ({pendingCount})</span>
                          <span>{totalSubmissions > 0 ? Math.round((pendingCount / totalSubmissions) * 100) : 0}%</span>
                        </div>
                        <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                          <div 
                            className="bg-amber-500 h-full rounded-full transition-all duration-500" 
                            style={{ width: `${totalSubmissions > 0 ? (pendingCount / totalSubmissions) * 100 : 0}%` }}
                          ></div>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-xs text-slate-400 mb-1">
                          <span>Needs Revision ({revisionCount})</span>
                          <span>{totalSubmissions > 0 ? Math.round((revisionCount / totalSubmissions) * 100) : 0}%</span>
                        </div>
                        <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                          <div 
                            className="bg-red-500 h-full rounded-full transition-all duration-500" 
                            style={{ width: `${totalSubmissions > 0 ? (revisionCount / totalSubmissions) * 100 : 0}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'tasks_mgr' && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  <div className="glass-panel rounded-2xl overflow-hidden">
                    <button
                      onClick={() => setIsTaskFormOpen(!isTaskFormOpen)}
                      className="w-full p-5 flex items-center justify-between font-bold text-slate-200 hover:bg-slate-800/30 transition-colors cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <Plus size={20} className="text-indigo-400" />
                        Create New Task Assignment
                      </span>
                      {isTaskFormOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </button>

                    {isTaskFormOpen && (
                      <div className="p-6 border-t border-slate-800 bg-slate-900/30 space-y-4">
                        {taskError && (
                          <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl">
                            {taskError}
                          </div>
                        )}
                        {taskSuccess && (
                          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl">
                            {taskSuccess}
                          </div>
                        )}

                        <form onSubmit={handleCreateTask} className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs text-slate-300 font-semibold uppercase tracking-wider mb-2">
                                Task Title
                              </label>
                              <input
                                type="text"
                                required
                                value={taskTitle}
                                onChange={(e) => setTaskTitle(e.target.value)}
                                placeholder="E.g. Build Redux State Controller"
                                className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700/60 text-slate-100 rounded-xl focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-slate-500 text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-slate-300 font-semibold uppercase tracking-wider mb-2">
                                Deadline (Optional)
                              </label>
                              <input
                                type="datetime-local"
                                value={taskDeadline}
                                onChange={(e) => setTaskDeadline(e.target.value)}
                                className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700/60 text-slate-100 rounded-xl focus:outline-none focus:border-indigo-500 transition-colors text-slate-200 text-sm"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs text-slate-300 font-semibold uppercase tracking-wider mb-2">
                              Task Description
                            </label>
                            <textarea
                              rows={4}
                              value={taskDesc}
                              onChange={(e) => setTaskDesc(e.target.value)}
                              placeholder="Outline task goals, deliverables, and resource paths here..."
                              className="w-full px-4 py-3 bg-slate-900 border border-slate-700/60 text-slate-100 rounded-xl focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-slate-500 text-sm"
                            />
                          </div>

                          <button
                            type="submit"
                            disabled={isCreatingTask}
                            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition-colors flex items-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/20"
                          >
                            {isCreatingTask ? (
                              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              'Publish Assignment'
                            )}
                          </button>
                        </form>
                      </div>
                    )}
                  </div>

                  <div className="glass-panel p-6 rounded-2xl space-y-4">
                    <h2 className="text-lg font-bold text-slate-100">Currently Published Tasks</h2>
                    {tasks.length === 0 ? (
                      <p className="text-slate-400 text-sm">No tasks created yet.</p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {tasks.map(task => (
                          <div key={task.id} className="p-4 bg-slate-900/50 border border-slate-800 rounded-xl space-y-2">
                            <h3 className="font-bold text-slate-200 text-sm">{task.title}</h3>
                            <p className="text-xs text-slate-400 line-clamp-2">{task.description}</p>
                            <div className="flex justify-between items-center text-[10px] text-slate-500 pt-2 border-t border-slate-800">
                              <span>Created at: {new Date(task.created_at).toLocaleDateString()}</span>
                              <span>Deadline: {task.deadline ? new Date(task.deadline).toLocaleDateString() : 'None'}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'submissions' && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800/80">
                    <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-900/20">
                      <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                        <Inbox size={20} className="text-indigo-400" />
                        Submissions Evaluation Queue
                      </h2>
                    </div>

                    {submissions.length === 0 ? (
                      <div className="p-8 text-center text-slate-400 text-sm">
                        No submissions registered in the system yet.
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-300">
                          <thead className="text-xs text-slate-400 uppercase tracking-wider bg-slate-900/40 border-b border-slate-800/85">
                            <tr>
                              <th className="px-6 py-4">Intern Name</th>
                              <th className="px-6 py-4">Task Assignment</th>
                              <th className="px-6 py-4">Submitted Date</th>
                              <th className="px-6 py-4">Status</th>
                              <th className="px-6 py-4">Grade</th>
                              <th className="px-6 py-4 text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800">
                            {submissions.map((sub) => (
                              <tr key={sub.id} className="hover:bg-slate-800/20 transition-colors">
                                <td className="px-6 py-4 font-semibold text-slate-200">{sub.intern_name}</td>
                                <td className="px-6 py-4">{sub.task_title}</td>
                                <td className="px-6 py-4 text-xs text-slate-400">
                                  {new Date(sub.submitted_at).toLocaleString()}
                                </td>
                                <td className="px-6 py-4">
                                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${
                                    sub.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400' :
                                    sub.status === 'needs_revision' ? 'bg-red-500/10 text-red-400' :
                                    'bg-amber-500/10 text-amber-400'
                                  }`}>
                                    {sub.status.replace('_', ' ')}
                                  </span>
                                </td>
                                <td className="px-6 py-4 font-mono font-bold text-slate-200">{sub.grade || '—'}</td>
                                <td className="px-6 py-4 text-right">
                                  <button
                                    onClick={() => setActiveGradingSub(sub)}
                                    className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 active:bg-slate-900 text-slate-200 hover:text-white rounded-lg text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
                                  >
                                    Evaluate
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Evaluation Modal */}
          {activeGradingSub && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div 
                className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
                onClick={() => setActiveGradingSub(null)}
              ></div>

              <div className="glass-panel w-full max-w-lg rounded-2xl relative z-10 p-6 space-y-5">
                <div>
                  <h3 className="text-xl font-bold text-slate-200">Evaluate Submission</h3>
                  <p className="text-xs text-slate-400 mt-1">Submitted by {activeGradingSub.intern_name} for "{activeGradingSub.task_title}"</p>
                </div>

                <div className="bg-slate-900/60 p-4 border border-slate-800 rounded-xl space-y-2">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Submission text</span>
                  <p className="text-xs text-slate-300 italic whitespace-pre-wrap">"{activeGradingSub.submission_text || 'No description provided'}"</p>
                  
                  {(activeGradingSub.file_path || activeGradingSub.github_link) && (
                    <div className="flex gap-4 pt-2 border-t border-slate-800/80 mt-2 text-xs">
                      {activeGradingSub.file_path && (
                        <span className="text-slate-400">File: <strong className="text-slate-300">{activeGradingSub.file_path}</strong></span>
                      )}
                      {activeGradingSub.github_link && (
                        <a 
                          href={activeGradingSub.github_link} 
                          target="_blank" 
                          rel="noreferrer"
                          className="text-indigo-400 hover:underline flex items-center gap-1 font-semibold"
                        >
                          View GitHub Link
                        </a>
                      )}
                    </div>
                  )}
                </div>

                {gradeError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl">
                    {gradeError}
                  </div>
                )}
                {gradeSuccess && (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl">
                    {gradeSuccess}
                  </div>
                )}

                <form onSubmit={handleGradeSubmission} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-slate-300 font-semibold uppercase tracking-wider mb-2">
                        Resolution Status
                      </label>
                      <select
                        value={gradeStatus}
                        onChange={(e) => setGradeStatus(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700/60 text-slate-100 rounded-xl focus:outline-none focus:border-indigo-500 transition-colors text-sm appearance-none cursor-pointer"
                      >
                        <option value="approved">Approve Submission</option>
                        <option value="needs_revision">Request Revision</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs text-slate-300 font-semibold uppercase tracking-wider mb-2">
                        Evaluation Grade
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="E.g. A+, Pass, 95/100"
                        value={gradeValue}
                        onChange={(e) => setGradeValue(e.target.value)}
                        className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700/60 text-slate-100 rounded-xl focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-slate-500 text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-300 font-semibold uppercase tracking-wider mb-2">
                      Feedback / Revision Directions
                    </label>
                    <textarea
                      rows={3}
                      value={gradeFeedback}
                      onChange={(e) => setGradeFeedback(e.target.value)}
                      placeholder="Input feedback comments or revision instructions..."
                      className="w-full px-4 py-2 bg-slate-900 border border-slate-700/60 text-slate-100 rounded-xl focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-slate-500 text-sm"
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setActiveGradingSub(null)}
                      className="flex-1 py-2.5 border border-slate-700 text-slate-300 hover:bg-slate-800 rounded-xl text-sm font-medium transition-colors cursor-pointer"
                    >
                      Dismiss
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingGrade}
                      className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/20"
                    >
                      {isSubmittingGrade ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        'Save Evaluation'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  )
}

export default MentorDashboard
