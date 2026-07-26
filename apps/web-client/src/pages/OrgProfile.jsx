import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import axios from 'axios'
import {
  GraduationCap, MapPin, Globe, Linkedin, Twitter, Building2,
  Users, Briefcase, BadgeCheck, ArrowRight, ChevronRight, Clock,
  DollarSign, ExternalLink, Loader2
} from 'lucide-react'

const TypeBadge = ({ type }) => {
  const colors = {
    REMOTE: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    HYBRID: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    ONSITE: 'bg-blue-500/10 text-blue-400 border-blue-500/20'
  }
  return <span className={`px-2 py-0.5 text-[10px] font-bold rounded border ${colors[type] || colors.ONSITE} uppercase tracking-wider`}>{type}</span>
}

export default function OrgProfile() {
  const { id } = useParams()
  const [org, setOrg] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const res = await axios.get(`/organizations/${id}/profile`)
        setOrg(res.data.organization)
      } catch (err) {
        setError(err.response?.data?.message || 'Organization not found.')
      } finally {
        setLoading(false)
      }
    }
    if (id) load()
  }, [id])

  if (loading) return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <Loader2 size={28} className="text-fuchsia-500 animate-spin" />
    </div>
  )

  if (error || !org) return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center gap-4 text-zinc-500">
      <Building2 size={40} className="opacity-30" />
      <p className="text-sm">{error || 'Organization not found.'}</p>
      <Link to="/" className="text-xs text-fuchsia-400 hover:text-fuchsia-300 transition-colors">← Back to Home</Link>
    </div>
  )

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 antialiased">

      {/* Navbar */}
      <nav className="sticky top-0 z-50 h-14 border-b border-zinc-900 bg-zinc-950/80 backdrop-blur-md px-6 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-fuchsia-500 to-violet-600 flex items-center justify-center">
            <GraduationCap size={14} className="text-white" />
          </div>
          <span className="text-sm font-black bg-gradient-to-r from-fuchsia-400 to-violet-400 bg-clip-text text-transparent">Nextern</span>
        </Link>
        <div className="flex gap-3">
          <Link to="/internships" className="text-xs text-zinc-400 hover:text-zinc-100 transition-colors">Browse</Link>
          <Link to="/login" className="px-3 py-1.5 text-xs font-bold border border-zinc-800 hover:border-zinc-700 rounded-lg transition-all">Sign In</Link>
        </div>
      </nav>

      {/* Cover Image */}
      <div className="h-40 md:h-56 relative overflow-hidden bg-gradient-to-br from-zinc-900 to-zinc-800">
        {org.cover_url ? (
          <img src={org.cover_url} alt="Cover" className="w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-900/30 via-violet-900/20 to-indigo-900/30" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 to-transparent" />
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-6 -mt-12 relative z-10">

        {/* Org Header Card */}
        <div className="bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 rounded-2xl p-6 flex flex-col md:flex-row items-start gap-5 relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-fuchsia-500/0 via-fuchsia-500/30 to-fuchsia-500/0" />

          {/* Logo */}
          <div className="w-20 h-20 rounded-2xl bg-zinc-800 border-4 border-zinc-900 flex items-center justify-center text-3xl font-black text-zinc-500 shrink-0 overflow-hidden shadow-xl">
            {org.logo_url ? <img src={org.logo_url} alt={org.name} className="w-full h-full object-cover" /> : org.name?.[0]}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between flex-wrap gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-black text-zinc-100">{org.name}</h1>
                  {org.is_verified && (
                    <span className="flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold rounded-full">
                      <BadgeCheck size={10} /> Verified
                    </span>
                  )}
                </div>
                {org.industry && <p className="text-sm text-fuchsia-400 font-semibold mt-0.5">{org.industry}</p>}
              </div>
              <Link
                to={`/internships?company=${encodeURIComponent(org.name)}`}
                className="px-4 py-2 bg-fuchsia-600 hover:bg-fuchsia-500 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-fuchsia-600/20 flex items-center gap-1.5"
              >
                View Internships <ChevronRight size={13} />
              </Link>
            </div>

            <div className="flex flex-wrap gap-4 mt-3 text-xs text-zinc-500">
              {org.location && <span className="flex items-center gap-1.5"><MapPin size={12} />{org.location}</span>}
              {org.company_size && <span className="flex items-center gap-1.5"><Users size={12} />{org.company_size} employees</span>}
              {org.website && (
                <a href={org.website} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-fuchsia-400 hover:text-fuchsia-300 transition-colors">
                  <Globe size={12} />{org.website.replace(/^https?:\/\//, '')}
                </a>
              )}
              {org.linkedin_url && (
                <a href={org.linkedin_url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-blue-400 hover:text-blue-300 transition-colors">
                  <Linkedin size={12} />LinkedIn
                </a>
              )}
              {org.twitter_url && (
                <a href={org.twitter_url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-sky-400 hover:text-sky-300 transition-colors">
                  <Twitter size={12} />Twitter
                </a>
              )}
              <span className="flex items-center gap-1.5"><Building2 size={12} />
                {org.internshipPrograms?.length || 0} open internship{(org.internshipPrograms?.length || 0) !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="grid md:grid-cols-3 gap-6 mt-6 pb-16">

          {/* About */}
          <div className="md:col-span-2 space-y-6">
            {org.description && (
              <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6">
                <h2 className="text-sm font-black text-zinc-100 mb-3">About {org.name}</h2>
                <p className="text-zinc-400 text-sm leading-relaxed">{org.description}</p>
              </div>
            )}

            {/* Open Internships */}
            <div>
              <h2 className="text-sm font-black text-zinc-100 mb-4">
                Open Internship Programs
                <span className="ml-2 text-zinc-600 font-medium">({org.internshipPrograms?.length || 0})</span>
              </h2>

              {org.internshipPrograms?.length > 0 ? (
                <div className="space-y-3">
                  {org.internshipPrograms.map(prog => (
                    <div key={prog.id} className="group bg-zinc-900/40 hover:bg-zinc-900/70 border border-zinc-800 hover:border-zinc-700 rounded-xl p-4 flex items-start justify-between gap-4 transition-all">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-sm font-bold text-zinc-100 truncate">{prog.title}</h3>
                          <TypeBadge type={prog.type} />
                        </div>
                        <p className="text-[11px] text-zinc-500">{prog.category}</p>
                        <div className="flex flex-wrap gap-3 mt-2 text-[10px] text-zinc-600">
                          {prog.location && <span className="flex items-center gap-1"><MapPin size={9} />{prog.location}</span>}
                          {prog.is_paid && <span className="flex items-center gap-1 text-emerald-400"><DollarSign size={9} />Paid</span>}
                          <span className="flex items-center gap-1"><Clock size={9} />Deadline: {new Date(prog.deadline).toLocaleDateString()}</span>
                          <span className="flex items-center gap-1"><Briefcase size={9} />{prog.positions} position{prog.positions !== 1 ? 's' : ''}</span>
                        </div>
                      </div>
                      <Link
                        to={`/internships?program=${prog.id}`}
                        className="shrink-0 px-3 py-2 bg-zinc-800 hover:bg-fuchsia-600 border border-zinc-700 hover:border-fuchsia-500 text-[11px] font-bold text-zinc-400 hover:text-white rounded-lg transition-all flex items-center gap-1"
                      >
                        Apply <ArrowRight size={11} />
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl py-10 text-center">
                  <Briefcase size={24} className="mx-auto text-zinc-700 mb-2" />
                  <p className="text-xs text-zinc-600">No open internships at this time.</p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-5">
              <h3 className="text-xs font-black text-zinc-300 mb-4">Organization Info</h3>
              <dl className="space-y-3 text-xs">
                {org.industry && <div><dt className="text-zinc-600 font-medium">Industry</dt><dd className="text-zinc-300 mt-0.5">{org.industry}</dd></div>}
                {org.company_size && <div><dt className="text-zinc-600 font-medium">Company Size</dt><dd className="text-zinc-300 mt-0.5">{org.company_size} employees</dd></div>}
                {org.location && <div><dt className="text-zinc-600 font-medium">Location</dt><dd className="text-zinc-300 mt-0.5">{org.location}</dd></div>}
                {org.phone && <div><dt className="text-zinc-600 font-medium">Phone</dt><dd className="text-zinc-300 mt-0.5">{org.phone}</dd></div>}
                <div>
                  <dt className="text-zinc-600 font-medium">Member Since</dt>
                  <dd className="text-zinc-300 mt-0.5">{new Date(org.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</dd>
                </div>
              </dl>
            </div>

            {(org.website || org.linkedin_url || org.twitter_url) && (
              <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-5">
                <h3 className="text-xs font-black text-zinc-300 mb-3">Links</h3>
                <div className="space-y-2">
                  {org.website && (
                    <a href={org.website} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-xs text-zinc-400 hover:text-fuchsia-400 transition-colors">
                      <Globe size={13} className="shrink-0" /> {org.website.replace(/^https?:\/\//, '')} <ExternalLink size={11} className="ml-auto opacity-50" />
                    </a>
                  )}
                  {org.linkedin_url && (
                    <a href={org.linkedin_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-xs text-zinc-400 hover:text-blue-400 transition-colors">
                      <Linkedin size={13} className="shrink-0" /> LinkedIn <ExternalLink size={11} className="ml-auto opacity-50" />
                    </a>
                  )}
                  {org.twitter_url && (
                    <a href={org.twitter_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-xs text-zinc-400 hover:text-sky-400 transition-colors">
                      <Twitter size={13} className="shrink-0" /> Twitter <ExternalLink size={11} className="ml-auto opacity-50" />
                    </a>
                  )}
                </div>
              </div>
            )}

            <Link
              to="/register"
              className="block bg-zinc-900/40 border border-zinc-800 hover:border-fuchsia-800/50 rounded-2xl p-5 text-center transition-all group"
            >
              <p className="text-[11px] text-zinc-400 group-hover:text-zinc-200 transition-colors">Is this your organization?</p>
              <p className="text-xs font-bold text-fuchsia-400 group-hover:text-fuchsia-300 mt-1 transition-colors">Claim & manage your profile →</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
