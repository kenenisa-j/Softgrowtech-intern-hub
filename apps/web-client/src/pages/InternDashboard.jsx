import React, { useState, useEffect, useContext } from 'react'
import { AuthContext } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import Sidebar from '../components/Sidebar'
import { ClipboardList, Send, Github, FileText, CheckCircle2, Clock } from 'lucide-react'

const InternDashboard = () => {
  const { authAxios } = useContext(AuthContext)
  const [activeTab, setActiveTab] = useState('overview')
  const [tasks, setTasks] = useState([])
  const [submissions, setSubmissions] = useState([])
  const [loadingData, setLoadingData] = useState(true)
  const [selectedTask, setSelectedTask] = useState(null)
  
  // Submission Form State
  const [submissionText, setSubmissionText] = useState('')
  const [filePath, setFilePath] = useState('')
  const [githubLink, setGithubLink] = useState('')
  
  const [submitError, setSubmitError] = useState('')
  const [submitSuccess, setSubmitSuccess] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchData = async () => {
    try {
      setLoadingData(true)
      const tasksRes = await authAxios.get('/tasks')
      const subRes = await authAxios.get('/submissions')
      setTasks(tasksRes.data.tasks || [])
      setSubmissions(subRes.data.submissions || [])
    } catch (err) {
      console.error('Error fetching dashboard data:', err)
    } finally {
      setLoadingData(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleSubmitTask = async (e) => {
    e.preventDefault()
    setSubmitError('')
    setSubmitSuccess('')
    setIsSubmitting(true)

    try {
      await authAxios.post('/submissions', {
        task_id: selectedTask.id,
        submission_text: submissionText,
        file_path: filePath,
        github_link: githubLink
      })
      setSubmitSuccess('Task submitted successfully!')
      setSubmissionText('')
      setFilePath('')
      setGithubLink('')
      
      // Refresh listings
      await fetchData()
      
      // Auto close modal after brief delay
      setTimeout(() => {
        setSelectedTask(null)
        setSubmitSuccess('')
      }, 1500)
    } catch (err) {
      console.error(err)
      setSubmitError(err.response?.data?.message || 'Failed to submit task.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Helper: Find submission for a task
  const getSubmissionForTask = (taskId) => {
    return submissions.find(sub => sub.task_id === taskId)
  }

  // Calculate Metrics
  const totalAssigned = tasks.length
  const pendingCount = submissions.filter(s => s.status === 'pending').length
  const approvedCount = submissions.filter(s => s.status === 'approved').length

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Navbar />
      
      {/* Sidebar Layout */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="md:pl-64 pt-16 min-h-screen">
        <div className="p-6 max-w-6xl mx-auto space-y-8">
          
          {/* Header */}
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-100 to-slate-400 bg-clip-text text-transparent">
              Intern Dashboard
            </h1>
            <p className="text-slate-400 text-sm mt-1">Track your progress and submit assigned tasks</p>
          </div>

          {loadingData ? (
            <div className="flex justify-center items-center py-20">
              <div className="w-10 h-10 border-4 border-slate-800 border-t-indigo-500 rounded-full animate-spin"></div>
            </div>
          ) : (
            <>
              {/* Stats Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div className="glass-panel p-6 rounded-2xl flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                    <ClipboardList size={24} />
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">Assigned Tasks</span>
                    <span className="text-2xl font-bold text-slate-100">{totalAssigned}</span>
                  </div>
                </div>

                <div className="glass-panel p-6 rounded-2xl flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                    <Clock size={24} />
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">Pending Submissions</span>
                    <span className="text-2xl font-bold text-slate-100">{pendingCount}</span>
                  </div>
                </div>

                <div className="glass-panel p-6 rounded-2xl flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                    <CheckCircle2 size={24} />
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">Approved Tasks</span>
                    <span className="text-2xl font-bold text-slate-100">{approvedCount}</span>
                  </div>
                </div>
              </div>

              {/* Dynamic View switching based on Sidebar */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  <div className="glass-panel p-6 rounded-2xl">
                    <h2 className="text-lg font-bold text-slate-100 mb-4 flex items-center gap-2">
                      <CheckCircle2 size={20} className="text-indigo-400" />
                      Recent Submissions & Feedback
                    </h2>
                    {submissions.length === 0 ? (
                      <p className="text-slate-400 text-sm">You haven't submitted any tasks yet.</p>
                    ) : (
                      <div className="space-y-4">
                        {submissions.slice(0, 5).map((sub) => (
                          <div key={sub.id} className="p-4 bg-slate-900/50 border border-slate-800 rounded-xl space-y-2">
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <h3 className="font-semibold text-slate-200 text-sm">{sub.task_title}</h3>
                              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                sub.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400' :
                                sub.status === 'needs_revision' ? 'bg-red-500/10 text-red-400' :
                                sub.status === 'reviewed' ? 'bg-indigo-500/10 text-indigo-400' :
                                'bg-amber-500/10 text-amber-400'
                              }`}>
                                {sub.status === 'reviewed' ? 'AI Reviewed' : sub.status.replace('_', ' ')}
                              </span>
                            </div>
                            <p className="text-xs text-slate-400 line-clamp-2">{sub.submission_text}</p>
                            
                            {(sub.grade || sub.score !== null || sub.feedback) && (
                              <div className="flex flex-col gap-1.5 pt-2 border-t border-slate-800/80 text-xs mt-2">
                                {sub.status === 'reviewed' && (
                                  <div className="flex justify-between items-center bg-indigo-950/20 p-2 rounded-lg border border-indigo-500/20 mb-1">
                                    <span className="text-indigo-400 font-semibold flex items-center gap-1">
                                      🤖 AI Auto-Review:
                                    </span>
                                    {sub.score !== null && (
                                      <span className="text-indigo-300 font-bold bg-indigo-500/10 px-2 py-0.5 rounded text-[10px]">
                                        Suggested Score: {sub.score}/100
                                      </span>
                                    )}
                                  </div>
                                )}
                                {sub.feedback && (
                                  <p className="text-slate-300 italic pl-1">
                                    "{sub.feedback}"
                                  </p>
                                )}
                                {sub.grade && (
                                  <div className="flex justify-between items-center text-slate-400 mt-1 pt-1 border-t border-slate-800/40">
                                    <span>Final Grade: <strong className="text-slate-200">{sub.grade}</strong></span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'tasks' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                    <ClipboardList size={22} className="text-indigo-400" />
                    Assigned Task Board
                  </h2>
                  
                  {tasks.length === 0 ? (
                    <div className="text-center py-10 glass-panel rounded-2xl">
                      <p className="text-slate-400 text-sm">No tasks have been assigned to you yet.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {tasks.map((task) => {
                        const sub = getSubmissionForTask(task.id)
                        return (
                          <div key={task.id} className="glass-panel p-6 rounded-2xl flex flex-col justify-between space-y-4">
                            <div className="space-y-2">
                              <div className="flex justify-between items-start">
                                <h3 className="text-lg font-bold text-slate-200">{task.title}</h3>
                                {sub && (
                                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                    sub.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400' :
                                    sub.status === 'needs_revision' ? 'bg-red-500/10 text-red-400' :
                                    sub.status === 'reviewed' ? 'bg-indigo-500/10 text-indigo-400' :
                                    'bg-amber-500/10 text-amber-400'
                                  }`}>
                                    {sub.status === 'reviewed' ? 'AI Reviewed' : sub.status.replace('_', ' ')}
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-slate-400 line-clamp-3">{task.description}</p>
                            </div>

                            <div className="space-y-3 pt-4 border-t border-slate-800/80">
                              <div className="flex items-center justify-between text-xs text-slate-500">
                                <span>Deadline:</span>
                                <span className="text-slate-400 font-medium">
                                  {task.deadline ? new Date(task.deadline).toLocaleString() : 'No Deadline'}
                                </span>
                              </div>

                              {(!sub || sub.status === 'needs_revision') ? (
                                <button
                                  onClick={() => setSelectedTask(task)}
                                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-medium rounded-xl text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                                >
                                  <Send size={14} />
                                  <span>{sub ? 'Resubmit Work' : 'Submit Work'}</span>
                                </button>
                              ) : (
                                <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl space-y-1.5">
                                  <div className="flex justify-between items-center text-xs">
                                    <span className="text-slate-500">Submitted Work:</span>
                                    {sub.grade && <span className="text-slate-300 font-bold">Grade: {sub.grade}</span>}
                                    {sub.status === 'reviewed' && sub.score !== null && (
                                      <span className="text-indigo-400 font-bold bg-indigo-500/10 px-2 py-0.5 rounded text-[10px]">
                                        AI Suggested: {sub.score}/100
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs text-slate-400 italic">"{sub.feedback || 'Awaiting mentor evaluation'}"</p>
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* Submission Modal Overlay */}
          {selectedTask && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div 
                className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
                onClick={() => setSelectedTask(null)}
              ></div>

              <div className="glass-panel w-full max-w-lg rounded-2xl relative z-10 p-6 space-y-5">
                <div>
                  <h3 className="text-xl font-bold text-slate-200">Submit: {selectedTask.title}</h3>
                  <p className="text-xs text-slate-400 mt-1">Provide your final outputs and project details below.</p>
                </div>

                {submitError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl">
                    {submitError}
                  </div>
                )}

                {submitSuccess && (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl">
                    {submitSuccess}
                  </div>
                )}

                <form onSubmit={handleSubmitTask} className="space-y-4">
                  <div>
                    <label className="block text-xs text-slate-300 font-semibold uppercase tracking-wider mb-2">
                      Submission Notes
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={submissionText}
                      onChange={(e) => setSubmissionText(e.target.value)}
                      placeholder="Explain what you accomplished or add any clarifications here..."
                      className="w-full px-4 py-3 bg-slate-900 border border-slate-700/60 text-slate-100 rounded-xl focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-slate-500 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-300 font-semibold uppercase tracking-wider mb-2">
                      File Path (or upload string)
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                        <FileText size={16} />
                      </span>
                      <input
                        type="text"
                        value={filePath}
                        onChange={(e) => setFilePath(e.target.value)}
                        placeholder="/uploads/my-project.zip"
                        className="w-full pl-9 pr-4 py-2.5 bg-slate-900 border border-slate-700/60 text-slate-100 rounded-xl focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-slate-500 text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-300 font-semibold uppercase tracking-wider mb-2">
                      GitHub Link
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                        <Github size={16} />
                      </span>
                      <input
                        type="url"
                        value={githubLink}
                        onChange={(e) => setGithubLink(e.target.value)}
                        placeholder="https://github.com/..."
                        className="w-full pl-9 pr-4 py-2.5 bg-slate-900 border border-slate-700/60 text-slate-100 rounded-xl focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-slate-500 text-sm"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setSelectedTask(null)}
                      className="flex-1 py-2.5 border border-slate-700 text-slate-300 hover:bg-slate-800 rounded-xl text-sm font-medium transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {isSubmitting ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <>
                          <Send size={14} />
                          <span>Submit Task</span>
                        </>
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

export default InternDashboard
