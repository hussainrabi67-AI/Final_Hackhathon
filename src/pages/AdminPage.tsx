import { useEffect, useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Users, Wrench, ClipboardList, Calendar, Star,
  AlertTriangle, Bell, Settings, Search, LogOut, ShieldCheck, CheckCircle2,
  XCircle, Clock, Check, X, Filter, RefreshCw, ChevronRight, Eye,
  Shield, MessageSquare, ArrowRight, UserCheck, AlertCircle, Menu, Loader2,
  ChevronDown, CheckCheck, Mail, Phone, MapPin, Sparkles,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import {
  fetchAdminKPIMetrics, fetchRequestsTrend, fetchRequestsByCategoryChart,
  fetchBookingStatusChart, fetchTechnicianVerificationChart, fetchAdminRecentRequests,
  fetchAllAdminRequests, fetchAdminPendingTechnicians, fetchAllAdminTechnicians,
  updateTechnicianVerificationStatus, fetchAdminUsers, fetchAdminBookings,
  fetchAdminComplaints, updateComplaintStatus, fetchAdminReviews, deleteReview,
  fetchAdminNotifications, markAdminNotificationRead, markAllAdminNotificationsRead,
  toggleServiceCategory,
  type AdminKPIMetrics, type AdminRequestItem, type AdminTechnicianItem,
  type AdminUserItem, type AdminBookingItem, type AdminComplaintItem,
  type AdminReviewItem, type AdminNotificationItem, type ChartDataPoint,
} from '../lib/adminService'
import { fetchServiceCategories } from '../lib/technicianService'
import type { ServiceCategoryDB } from '../types/technician'
import { LineTrendChart, CategoryBarChart, DonutChart } from '../components/admin/AdminCharts'

type AdminTab =
  | 'dashboard'
  | 'users'
  | 'technicians'
  | 'requests'
  | 'bookings'
  | 'reviews'
  | 'complaints'
  | 'notifications'
  | 'settings'

export default function AdminPage() {
  const { profile, user, signOut } = useAuth()
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Notifications Popover in Top Header
  const [notifPopoverOpen, setNotifPopoverOpen] = useState(false)
  const notifRef = useRef<HTMLDivElement>(null)

  // Overview Data
  const [kpis, setKpis] = useState<AdminKPIMetrics>({
    totalUsers: 0,
    totalTechnicians: 0,
    pendingVerification: 0,
    totalRequests: 0,
    activeBookings: 0,
    completedJobs: 0,
    openComplaints: 0,
  })
  const [requestsTrend, setRequestsTrend] = useState<ChartDataPoint[]>([])
  const [categoryDistribution, setCategoryDistribution] = useState<ChartDataPoint[]>([])
  const [bookingDistribution, setBookingDistribution] = useState<ChartDataPoint[]>([])
  const [techVerificationDistribution, setTechVerificationDistribution] = useState<ChartDataPoint[]>([])
  const [recentRequests, setRecentRequests] = useState<AdminRequestItem[]>([])
  const [pendingTechs, setPendingTechs] = useState<AdminTechnicianItem[]>([])
  const [recentComplaints, setRecentComplaints] = useState<AdminComplaintItem[]>([])

  // Specific Tab Data
  const [allUsers, setAllUsers] = useState<AdminUserItem[]>([])
  const [userRoleFilter, setUserRoleFilter] = useState<string>('')
  const [allTechs, setAllTechs] = useState<AdminTechnicianItem[]>([])
  const [techStatusFilter, setTechStatusFilter] = useState<string>('')
  const [allRequests, setAllRequests] = useState<AdminRequestItem[]>([])
  const [requestStatusFilter, setRequestStatusFilter] = useState<string>('')
  const [allBookings, setAllBookings] = useState<AdminBookingItem[]>([])
  const [bookingStatusFilter, setBookingStatusFilter] = useState<string>('')
  const [allReviews, setAllReviews] = useState<AdminReviewItem[]>([])
  const [allComplaints, setAllComplaints] = useState<AdminComplaintItem[]>([])
  const [complaintStatusFilter, setComplaintStatusFilter] = useState<string>('')
  const [notifications, setNotifications] = useState<AdminNotificationItem[]>([])
  const [categories, setCategories] = useState<ServiceCategoryDB[]>([])

  // Notification / Feedback State
  const [actionMessage, setActionMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)

  // Close notifications popover on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotifPopoverOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    loadAllData()
  }, [])

  async function loadAllData() {
    setLoading(true)
    try {
      const [
        metrics,
        trend,
        catChart,
        bookingChart,
        techChart,
        recRequests,
        fullRequests,
        pending,
        complaints,
        users,
        techs,
        bookings,
        reviews,
        notifs,
        serviceCats,
      ] = await Promise.all([
        fetchAdminKPIMetrics(),
        fetchRequestsTrend(),
        fetchRequestsByCategoryChart(),
        fetchBookingStatusChart(),
        fetchTechnicianVerificationChart(),
        fetchAdminRecentRequests(10),
        fetchAllAdminRequests(),
        fetchAdminPendingTechnicians(),
        fetchAdminComplaints(),
        fetchAdminUsers(),
        fetchAllAdminTechnicians(),
        fetchAdminBookings(),
        fetchAdminReviews(),
        fetchAdminNotifications(),
        fetchServiceCategories(),
      ])

      setKpis(metrics)
      setRequestsTrend(trend)
      setCategoryDistribution(catChart)
      setBookingDistribution(bookingChart)
      setTechVerificationDistribution(techChart)
      setRecentRequests(recRequests)
      setAllRequests(fullRequests)
      setPendingTechs(pending)
      setRecentComplaints(complaints)
      setAllComplaints(complaints)
      setAllUsers(users)
      setAllTechs(techs)
      setAllBookings(bookings)
      setAllReviews(reviews)
      setNotifications(notifs)
      setCategories(serviceCats)
    } catch (err) {
      console.warn('Error loading admin dashboard:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleRefresh() {
    setRefreshing(true)
    await loadAllData()
    setRefreshing(false)
  }

  async function handleApproveTechnician(techId: string) {
    setActionLoadingId(techId)
    try {
      await updateTechnicianVerificationStatus(techId, 'approved')
      showNotification('Technician successfully approved and activated for marketplace!', 'success')
      await loadAllData()
    } catch (err) {
      showNotification(err instanceof Error ? err.message : 'Failed to approve technician', 'error')
    } finally {
      setActionLoadingId(null)
    }
  }

  async function handleRejectTechnician(techId: string) {
    setActionLoadingId(techId)
    try {
      await updateTechnicianVerificationStatus(techId, 'rejected')
      showNotification('Technician application marked as rejected.', 'success')
      await loadAllData()
    } catch (err) {
      showNotification(err instanceof Error ? err.message : 'Failed to update technician', 'error')
    } finally {
      setActionLoadingId(null)
    }
  }

  async function handleComplaintStatusChange(complaintId: string, newStatus: string) {
    setActionLoadingId(complaintId)
    try {
      await updateComplaintStatus(complaintId, newStatus)
      showNotification(`Complaint status updated to ${newStatus}.`, 'success')
      await loadAllData()
    } catch (err) {
      showNotification(err instanceof Error ? err.message : 'Failed to update complaint', 'error')
    } finally {
      setActionLoadingId(null)
    }
  }

  async function handleDeleteReview(reviewId: string) {
    if (!window.confirm('Are you sure you want to delete this review from the platform?')) return
    setActionLoadingId(reviewId)
    try {
      await deleteReview(reviewId)
      showNotification('Review deleted successfully.', 'success')
      await loadAllData()
    } catch (err) {
      showNotification(err instanceof Error ? err.message : 'Failed to delete review', 'error')
    } finally {
      setActionLoadingId(null)
    }
  }

  async function handleToggleCategory(categoryId: string, currentActive: boolean) {
    setActionLoadingId(categoryId)
    try {
      await toggleServiceCategory(categoryId, !currentActive)
      showNotification(`Service category ${!currentActive ? 'enabled' : 'disabled'}.`, 'success')
      await loadAllData()
    } catch (err) {
      showNotification(err instanceof Error ? err.message : 'Failed to update category', 'error')
    } finally {
      setActionLoadingId(null)
    }
  }

  async function handleMarkNotificationRead(notificationId: string) {
    try {
      await markAdminNotificationRead(notificationId)
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n)),
      )
    } catch {
      // ignore
    }
  }

  async function handleMarkAllNotificationsRead() {
    try {
      await markAllAdminNotificationsRead()
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
      showNotification('All notifications marked as read', 'success')
    } catch {
      // ignore
    }
  }

  function showNotification(text: string, type: 'success' | 'error') {
    setActionMessage({ text, type })
    setTimeout(() => setActionMessage(null), 4500)
  }

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  const unreadNotifCount = notifications.filter((n) => !n.read).length

  const navItems: Array<{ id: AdminTab; label: string; icon: React.ReactNode; badge?: number; alert?: boolean }> = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
    { id: 'users', label: 'Users', icon: <Users className="h-4 w-4" />, badge: kpis.totalUsers },
    { id: 'technicians', label: 'Technicians', icon: <Wrench className="h-4 w-4" />, badge: kpis.pendingVerification || undefined, alert: kpis.pendingVerification > 0 },
    { id: 'requests', label: 'Service Requests', icon: <ClipboardList className="h-4 w-4" />, badge: kpis.totalRequests },
    { id: 'bookings', label: 'Bookings', icon: <Calendar className="h-4 w-4" />, badge: kpis.activeBookings || undefined },
    { id: 'reviews', label: 'Reviews', icon: <Star className="h-4 w-4" /> },
    { id: 'complaints', label: 'Complaints', icon: <AlertTriangle className="h-4 w-4" />, badge: kpis.openComplaints || undefined, alert: kpis.openComplaints > 0 },
    { id: 'notifications', label: 'Notifications', icon: <Bell className="h-4 w-4" />, badge: unreadNotifCount || undefined },
    { id: 'settings', label: 'Settings', icon: <Settings className="h-4 w-4" /> },
  ]

  // If user is authenticated but not an admin
  if (profile && profile.role !== 'admin') {
    return (
      <div className="flex min-h-[80vh] flex-col items-center justify-center p-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 mb-4">
          <ShieldCheck className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-bold text-ink">Admin Access Restricted</h1>
        <p className="mt-2 text-sm text-ink/60 max-w-md">
          This portal is reserved for FixMate platform administrators only. Your current account role is{' '}
          <span className="font-semibold text-primary uppercase">{profile.role}</span>.
        </p>
        <Link to="/" className="btn-primary mt-6 text-xs">
          Return to Client App
        </Link>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-ink antialiased">
      {/* 1. LEFT SIDEBAR FOR DESKTOP */}
      <aside className="hidden lg:flex w-64 flex-col border-r border-slate-200 bg-white shadow-soft shrink-0">
        {/* Brand Lockup */}
        <div className="flex h-16 items-center gap-3 border-b border-slate-100 px-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-primary to-primary-dark text-white shadow-soft">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-extrabold tracking-tight text-ink">FixMate Admin</h2>
            <span className="text-[10px] font-semibold text-primary uppercase tracking-wider">Management Console</span>
          </div>
        </div>

        {/* Sidebar Nav Items */}
        <nav className="flex-1 space-y-1 p-3.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = activeTab === item.id
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id)
                  setSearchQuery('')
                }}
                className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-primary text-white shadow-soft'
                    : 'text-ink/70 hover:bg-purple-50/70 hover:text-primary'
                }`}
              >
                <div className="flex items-center gap-3">
                  {item.icon}
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold tabular-nums ${
                      isActive
                        ? 'bg-white/25 text-white'
                        : item.alert
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-100 text-ink/70'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            )
          })}
        </nav>

        {/* Admin Profile Footer in Sidebar */}
        <div className="border-t border-slate-100 p-3.5">
          <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white font-bold text-xs shrink-0">
              {profile?.name ? profile.name.slice(0, 2).toUpperCase() : 'AD'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold text-ink">{profile?.name || 'Administrator'}</p>
              <p className="truncate text-[10px] text-ink/50">{profile?.email || user?.email}</p>
            </div>
            <button
              onClick={handleSignOut}
              className="rounded-lg p-1 text-ink/40 hover:bg-white hover:text-rose-600 transition-colors shrink-0"
              title="Sign Out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* 2. MAIN CONTENT AREA */}
      <div className="flex flex-1 flex-col min-w-0 overflow-x-hidden">
        {/* TOP HEADER */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 sm:px-8 backdrop-blur-md">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="rounded-xl p-2 text-ink lg:hidden hover:bg-slate-100"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Live Global Search Box */}
            <div className="relative w-48 sm:w-72 md:w-80">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink/40" />
              <input
                type="text"
                placeholder={`Search ${activeTab}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl bg-slate-100/80 py-1.5 pl-8 pr-3 text-xs font-medium text-ink placeholder:text-ink/40 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink/40 hover:text-ink"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            {/* Refresh Data Button */}
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold text-primary bg-primary-light/50 hover:bg-primary-light transition-colors"
              title="Refresh Analytics"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            {/* Notification Bell with Dropdown Popover */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setNotifPopoverOpen(!notifPopoverOpen)}
                className="relative rounded-xl p-2 text-ink/70 hover:bg-slate-100 hover:text-ink transition-colors"
                title="Admin Notifications"
              >
                <Bell className="h-4 w-4" />
                {unreadNotifCount > 0 && (
                  <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-extrabold text-white">
                    {unreadNotifCount > 9 ? '9+' : unreadNotifCount}
                  </span>
                )}
              </button>

              {/* Popover Menu */}
              {notifPopoverOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white p-4 shadow-lift ring-1 ring-black/5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <Bell className="h-4 w-4 text-primary" />
                      <h4 className="text-xs font-bold text-ink">Notifications</h4>
                    </div>
                    {unreadNotifCount > 0 && (
                      <button
                        onClick={handleMarkAllNotificationsRead}
                        className="text-[11px] font-semibold text-primary hover:underline"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>

                  <div className="mt-3 max-h-80 space-y-2 overflow-y-auto pr-1">
                    {notifications.length === 0 ? (
                      <div className="py-6 text-center text-xs text-ink/50">
                        No recent notifications.
                      </div>
                    ) : (
                      notifications.slice(0, 6).map((notif) => (
                        <div
                          key={notif.id}
                          onClick={() => handleMarkNotificationRead(notif.id)}
                          className={`flex items-start gap-2.5 rounded-xl p-2.5 text-xs transition-colors cursor-pointer ${
                            notif.read ? 'bg-slate-50 text-ink/60' : 'bg-purple-50/60 font-medium text-ink'
                          }`}
                        >
                          <div className={`mt-0.5 h-2 w-2 rounded-full shrink-0 ${notif.read ? 'bg-transparent' : 'bg-primary'}`} />
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-ink text-[11px] truncate">{notif.title || 'Notification'}</p>
                            <p className="text-[11px] text-ink/70 line-clamp-2 mt-0.5">{notif.message}</p>
                            <span className="text-[9px] text-ink/40 mt-1 block">
                              {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="mt-3 border-t border-slate-100 pt-2 text-center">
                    <button
                      onClick={() => {
                        setActiveTab('notifications')
                        setNotifPopoverOpen(false)
                      }}
                      className="text-xs font-bold text-primary hover:underline"
                    >
                      View all notifications ({notifications.length})
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Client App Link */}
            <Link
              to="/"
              className="hidden sm:flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold text-ink/70 hover:text-primary hover:bg-slate-100 transition-colors"
            >
              <Eye className="h-3.5 w-3.5" /> Client View
            </Link>
          </div>
        </header>

        {/* MOBILE NAVIGATION DRAWER */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 flex lg:hidden">
            <div
              className="fixed inset-0 bg-ink/40 backdrop-blur-sm"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="relative flex w-72 flex-col bg-white p-4 shadow-lift z-10">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  <span className="font-extrabold text-ink text-sm">FixMate Admin</span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-xl p-1.5 hover:bg-slate-100"
                >
                  <X className="h-5 w-5 text-ink/60" />
                </button>
              </div>

              <nav className="mt-4 space-y-1 flex-1 overflow-y-auto">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id)
                      setMobileMenuOpen(false)
                    }}
                    className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-semibold ${
                      activeTab === item.id
                        ? 'bg-primary text-white'
                        : 'text-ink/70 hover:bg-purple-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {item.icon}
                      <span>{item.label}</span>
                    </div>
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className="rounded-full bg-primary-light px-2 py-0.5 text-[10px] text-primary-dark font-bold tabular-nums">
                        {item.badge}
                      </span>
                    )}
                  </button>
                ))}
              </nav>

              <div className="border-t border-slate-100 pt-4">
                <button onClick={handleSignOut} className="btn-secondary w-full text-xs">
                  <LogOut className="h-4 w-4" /> Sign Out
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ACTION FEEDBACK BANNER */}
        {actionMessage && (
          <div
            className={`mx-4 mt-4 sm:mx-8 flex items-center justify-between rounded-xl p-3.5 text-xs font-semibold shadow-soft ${
              actionMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {actionMessage.type === 'success' ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
              )}
              <span>{actionMessage.text}</span>
            </div>
            <button onClick={() => setActionMessage(null)} className="opacity-60 hover:opacity-100">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* MAIN BODY CONTAINER */}
        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">
          {loading ? (
            <div className="flex h-96 flex-col items-center justify-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-xs font-medium text-ink/50">Fetching live database metrics...</p>
            </div>
          ) : (
            <>
              {/* ============================================================== */}
              {/* TAB 1: OVERVIEW DASHBOARD */}
              {/* ============================================================== */}
              {activeTab === 'dashboard' && (
                <div className="space-y-8">
                  {/* Title & Quick Actions */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <h1 className="text-2xl font-black tracking-tight text-ink sm:text-3xl">
                        Platform Dashboard
                      </h1>
                      <p className="mt-1 text-xs text-ink/60">
                        Live metrics, technician verification queue, and service request tracking.
                      </p>
                    </div>

                    {/* Quick Action Buttons */}
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => {
                          setActiveTab('technicians')
                          setTechStatusFilter('pending')
                        }}
                        className="btn-primary text-xs !py-2 !px-3.5"
                      >
                        <UserCheck className="h-3.5 w-3.5" /> Approve Technicians
                      </button>
                      <button
                        onClick={() => setActiveTab('requests')}
                        className="btn-secondary text-xs !py-2 !px-3.5"
                      >
                        <ClipboardList className="h-3.5 w-3.5" /> View Requests
                      </button>
                      <button
                        onClick={() => {
                          setActiveTab('complaints')
                          setComplaintStatusFilter('open')
                        }}
                        className="btn-secondary text-xs !py-2 !px-3.5"
                      >
                        <AlertTriangle className="h-3.5 w-3.5" /> View Complaints
                      </button>
                    </div>
                  </div>

                  {/* 7 KPI METRIC CARDS */}
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
                    <KPICard
                      title="Total Users"
                      value={kpis.totalUsers}
                      icon={<Users className="h-4 w-4 text-indigo-600" />}
                      bg="bg-indigo-50"
                      onClick={() => setActiveTab('users')}
                    />
                    <KPICard
                      title="Technicians"
                      value={kpis.totalTechnicians}
                      icon={<Wrench className="h-4 w-4 text-purple-600" />}
                      bg="bg-purple-50"
                      onClick={() => setActiveTab('technicians')}
                    />
                    <KPICard
                      title="Pending Verification"
                      value={kpis.pendingVerification}
                      icon={<Clock className="h-4 w-4 text-amber-600" />}
                      bg="bg-amber-50"
                      highlight={kpis.pendingVerification > 0}
                      onClick={() => {
                        setActiveTab('technicians')
                        setTechStatusFilter('pending')
                      }}
                    />
                    <KPICard
                      title="Service Requests"
                      value={kpis.totalRequests}
                      icon={<ClipboardList className="h-4 w-4 text-blue-600" />}
                      bg="bg-blue-50"
                      onClick={() => setActiveTab('requests')}
                    />
                    <KPICard
                      title="Active Bookings"
                      value={kpis.activeBookings}
                      icon={<Calendar className="h-4 w-4 text-sky-600" />}
                      bg="bg-sky-50"
                      onClick={() => setActiveTab('bookings')}
                    />
                    <KPICard
                      title="Completed Jobs"
                      value={kpis.completedJobs}
                      icon={<CheckCircle2 className="h-4 w-4 text-emerald-600" />}
                      bg="bg-emerald-50"
                      onClick={() => {
                        setActiveTab('bookings')
                        setBookingStatusFilter('completed')
                      }}
                    />
                    <KPICard
                      title="Open Complaints"
                      value={kpis.openComplaints}
                      icon={<AlertTriangle className="h-4 w-4 text-rose-600" />}
                      bg="bg-rose-50"
                      highlight={kpis.openComplaints > 0}
                      onClick={() => {
                        setActiveTab('complaints')
                        setComplaintStatusFilter('open')
                      }}
                    />
                  </div>

                  {/* 4 REAL SUPABASE DATA CHARTS */}
                  <div className="grid gap-6 lg:grid-cols-2">
                    {/* Chart 1: Service Requests Trend */}
                    <div className="card p-5">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <div>
                          <h3 className="font-bold text-xs uppercase tracking-wider text-ink/80">
                            Service Requests Trend
                          </h3>
                          <p className="text-[11px] text-ink/50">Daily volume across the last 7 days</p>
                        </div>
                        <span className="rounded-full bg-purple-100 px-2.5 py-0.5 text-[10px] font-bold text-purple-700 tabular-nums">
                          {kpis.totalRequests} Total
                        </span>
                      </div>
                      <div className="mt-4">
                        <LineTrendChart data={requestsTrend} />
                      </div>
                    </div>

                    {/* Chart 2: Requests by Category */}
                    <div className="card p-5">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <div>
                          <h3 className="font-bold text-xs uppercase tracking-wider text-ink/80">
                            Top Requested Categories
                          </h3>
                          <p className="text-[11px] text-ink/50">Demand distribution across repair trades</p>
                        </div>
                      </div>
                      <div className="mt-4">
                        <CategoryBarChart data={categoryDistribution} />
                      </div>
                    </div>

                    {/* Chart 3: Booking Status Distribution */}
                    <div className="card p-5">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <div>
                          <h3 className="font-bold text-xs uppercase tracking-wider text-ink/80">
                            Booking Status Distribution
                          </h3>
                          <p className="text-[11px] text-ink/50">Live status progression for customer jobs</p>
                        </div>
                      </div>
                      <div className="mt-4">
                        <DonutChart data={bookingDistribution} totalLabel="Bookings" />
                      </div>
                    </div>

                    {/* Chart 4: Technician Verification Status */}
                    <div className="card p-5">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <div>
                          <h3 className="font-bold text-xs uppercase tracking-wider text-ink/80">
                            Technician Verification Status
                          </h3>
                          <p className="text-[11px] text-ink/50">Marketplace provider onboarding ratio</p>
                        </div>
                      </div>
                      <div className="mt-4">
                        <DonutChart data={techVerificationDistribution} totalLabel="Providers" />
                      </div>
                    </div>
                  </div>

                  {/* 2 OVERVIEW SECTIONS: Pending Approvals & Recent Service Requests */}
                  <div className="grid gap-6 lg:grid-cols-2">
                    {/* Pending Technician Approvals */}
                    <div className="card p-5 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-amber-500" />
                            <h3 className="font-bold text-xs uppercase tracking-wider text-ink/80">
                              Pending Technician Approvals
                            </h3>
                          </div>
                          <button
                            onClick={() => {
                              setActiveTab('technicians')
                              setTechStatusFilter('pending')
                            }}
                            className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                          >
                            View all ({pendingTechs.length}) <ChevronRight className="h-3 w-3" />
                          </button>
                        </div>

                        <div className="mt-4 space-y-3">
                          {pendingTechs.length === 0 ? (
                            <div className="py-8 text-center text-xs text-ink/50">
                              <CheckCircle2 className="mx-auto mb-2 h-6 w-6 text-emerald-500" />
                              All technicians have been reviewed.
                            </div>
                          ) : (
                            pendingTechs.slice(0, 4).map((tech) => (
                              <div
                                key={tech.id}
                                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200/60"
                              >
                                <div className="min-w-0">
                                  <p className="font-bold text-xs text-ink">{tech.name}</p>
                                  <p className="text-[11px] text-ink/60 truncate">
                                    {tech.profession || 'Technician'} • {tech.service_area || 'Area not specified'}
                                  </p>
                                  <p className="text-[10px] text-ink/40 truncate">{tech.email}</p>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  <button
                                    onClick={() => handleApproveTechnician(tech.id)}
                                    disabled={actionLoadingId === tech.id}
                                    className="flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-soft hover:bg-emerald-700 transition-colors"
                                  >
                                    <Check className="h-3 w-3" /> Approve
                                  </button>
                                  <button
                                    onClick={() => handleRejectTechnician(tech.id)}
                                    disabled={actionLoadingId === tech.id}
                                    className="flex items-center gap-1 rounded-lg bg-rose-100 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-200 transition-colors"
                                  >
                                    <X className="h-3 w-3" /> Reject
                                  </button>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Recent Service Requests Table */}
                    <div className="card p-5 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                          <div className="flex items-center gap-2">
                            <ClipboardList className="h-4 w-4 text-primary" />
                            <h3 className="font-bold text-xs uppercase tracking-wider text-ink/80">
                              Recent Service Requests
                            </h3>
                          </div>
                          <button
                            onClick={() => setActiveTab('requests')}
                            className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                          >
                            View all ({kpis.totalRequests}) <ChevronRight className="h-3 w-3" />
                          </button>
                        </div>

                        <div className="mt-4 space-y-2.5">
                          {recentRequests.length === 0 ? (
                            <div className="py-8 text-center text-xs text-ink/50">
                              No service requests recorded.
                            </div>
                          ) : (
                            recentRequests.slice(0, 5).map((req) => (
                              <div
                                key={req.id}
                                className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 p-2.5 ring-1 ring-slate-200/50"
                              >
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-sm">{req.category_icon || '🔧'}</span>
                                    <p className="truncate text-xs font-bold text-ink">{req.title || req.description}</p>
                                  </div>
                                  <p className="text-[10px] text-ink/50 truncate mt-0.5">
                                    {req.customer_name} • {new Date(req.created_at).toLocaleDateString()}
                                  </p>
                                </div>
                                <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${getStatusBadgeClass(req.status)}`}>
                                  {req.status}
                                </span>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Recent Complaints Section */}
                  <div className="card p-5">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-rose-500" />
                        <h3 className="font-bold text-xs uppercase tracking-wider text-ink/80">
                          Recent Customer Complaints
                        </h3>
                      </div>
                      <button
                        onClick={() => setActiveTab('complaints')}
                        className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                      >
                        Manage all ({recentComplaints.length}) <ChevronRight className="h-3 w-3" />
                      </button>
                    </div>

                    <div className="mt-4 space-y-3">
                      {recentComplaints.length === 0 ? (
                        <div className="py-6 text-center text-xs text-ink/50">
                          <CheckCircle2 className="mx-auto mb-1.5 h-6 w-6 text-emerald-500" />
                          No open customer disputes or complaints.
                        </div>
                      ) : (
                        recentComplaints.slice(0, 3).map((comp) => (
                          <div
                            key={comp.id}
                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl bg-slate-50 p-3.5 ring-1 ring-slate-200/60"
                          >
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${
                                  comp.status === 'open' ? 'bg-rose-100 text-rose-700' :
                                  comp.status === 'under_review' ? 'bg-amber-100 text-amber-700' :
                                  'bg-emerald-100 text-emerald-700'
                                }`}>
                                  {comp.status}
                                </span>
                                <p className="text-xs font-bold text-ink">{comp.subject || 'Complaint'}</p>
                              </div>
                              <p className="mt-1 text-xs text-ink/70">{comp.description}</p>
                              <p className="mt-1 text-[10px] text-ink/40">From {comp.customer_name} ({comp.customer_email})</p>
                            </div>

                            <select
                              value={comp.status}
                              onChange={(e) => handleComplaintStatusChange(comp.id, e.target.value)}
                              className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-ink focus:outline-none focus:ring-2 focus:ring-primary/20 shrink-0"
                            >
                              <option value="open">Open</option>
                              <option value="under_review">Under Review</option>
                              <option value="resolved">Resolved</option>
                              <option value="closed">Closed</option>
                            </select>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ============================================================== */}
              {/* TAB 2: USERS MANAGEMENT */}
              {/* ============================================================== */}
              {activeTab === 'users' && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <h1 className="text-2xl font-black text-ink">User Directory</h1>
                      <p className="text-xs text-ink/60">Registered customers, technicians, and system administrators.</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <select
                        value={userRoleFilter}
                        onChange={(e) => setUserRoleFilter(e.target.value)}
                        className="rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-ink focus:outline-none focus:ring-2 focus:ring-primary/20"
                      >
                        <option value="">All Roles ({allUsers.length})</option>
                        <option value="user">Customers</option>
                        <option value="technician">Technicians</option>
                        <option value="admin">Admins</option>
                      </select>
                    </div>
                  </div>

                  <div className="card overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="border-b border-slate-200 bg-slate-50 font-bold uppercase text-ink/50 text-[10px] tracking-wider">
                          <tr>
                            <th className="px-6 py-3.5">Name</th>
                            <th className="px-6 py-3.5">Email</th>
                            <th className="px-6 py-3.5">Role</th>
                            <th className="px-6 py-3.5">Phone</th>
                            <th className="px-6 py-3.5">Registered</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {allUsers
                            .filter((u) => (userRoleFilter ? u.role === userRoleFilter : true))
                            .filter((u) =>
                              searchQuery
                                ? u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                  u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                  u.phone?.toLowerCase().includes(searchQuery.toLowerCase())
                                : true,
                            )
                            .map((u) => (
                              <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                                <td className="px-6 py-3.5">
                                  <div className="flex items-center gap-3">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-100 font-bold text-primary text-xs shrink-0">
                                      {u.name ? u.name.slice(0, 2).toUpperCase() : 'U'}
                                    </div>
                                    <span className="font-bold text-ink">{u.name || 'Unnamed'}</span>
                                  </div>
                                </td>
                                <td className="px-6 py-3.5 text-ink/70">{u.email}</td>
                                <td className="px-6 py-3.5">
                                  <span className={`rounded-full px-2.5 py-0.5 font-bold text-[10px] ${
                                    u.role === 'admin' ? 'bg-rose-100 text-rose-700' :
                                    u.role === 'technician' ? 'bg-purple-100 text-purple-700' :
                                    'bg-blue-100 text-blue-700'
                                  }`}>
                                    {u.role.toUpperCase()}
                                  </span>
                                </td>
                                <td className="px-6 py-3.5 text-ink/60">{u.phone || '—'}</td>
                                <td className="px-6 py-3.5 text-ink/50 tabular-nums">
                                  {new Date(u.created_at).toLocaleDateString()}
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* ============================================================== */}
              {/* TAB 3: TECHNICIANS MANAGEMENT */}
              {/* ============================================================== */}
              {activeTab === 'technicians' && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <h1 className="text-2xl font-black text-ink">Technician Providers</h1>
                      <p className="text-xs text-ink/60">Manage verification approvals, specializations, and service profiles.</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <select
                        value={techStatusFilter}
                        onChange={(e) => setTechStatusFilter(e.target.value)}
                        className="rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-ink focus:outline-none focus:ring-2 focus:ring-primary/20"
                      >
                        <option value="">All Statuses ({allTechs.length})</option>
                        <option value="pending">Pending Approval ({pendingTechs.length})</option>
                        <option value="approved">Approved</option>
                        <option value="verified">Verified</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </div>
                  </div>

                  <div className="card overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="border-b border-slate-200 bg-slate-50 font-bold uppercase text-ink/50 text-[10px] tracking-wider">
                          <tr>
                            <th className="px-6 py-3.5">Technician</th>
                            <th className="px-6 py-3.5">Profession</th>
                            <th className="px-6 py-3.5">Experience</th>
                            <th className="px-6 py-3.5">Service Area</th>
                            <th className="px-6 py-3.5">Status</th>
                            <th className="px-6 py-3.5 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {allTechs
                            .filter((t) => (techStatusFilter ? t.verification_status === techStatusFilter : true))
                            .filter((t) =>
                              searchQuery
                                ? t.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                  t.profession?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                  t.service_area?.toLowerCase().includes(searchQuery.toLowerCase())
                                : true,
                            )
                            .map((tech) => (
                              <tr key={tech.id} className="hover:bg-slate-50/80 transition-colors">
                                <td className="px-6 py-3.5">
                                  <div className="flex items-center gap-3">
                                    {tech.avatar_url ? (
                                      <img src={tech.avatar_url} alt="" className="h-8 w-8 rounded-xl object-cover" />
                                    ) : (
                                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-100 font-bold text-purple-700 text-xs shrink-0">
                                        {tech.name ? tech.name.slice(0, 2).toUpperCase() : 'T'}
                                      </div>
                                    )}
                                    <div className="min-w-0">
                                      <p className="font-bold text-ink truncate">{tech.name}</p>
                                      <p className="text-[10px] text-ink/50 truncate">{tech.email}</p>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-3.5 font-semibold text-ink/80">{tech.profession || 'Specialist'}</td>
                                <td className="px-6 py-3.5 text-ink/60 tabular-nums">{tech.experience_years ? `${tech.experience_years} yrs` : '—'}</td>
                                <td className="px-6 py-3.5 text-ink/60">{tech.service_area || '—'}</td>
                                <td className="px-6 py-3.5">
                                  <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                                    tech.verification_status === 'approved' || tech.verification_status === 'verified'
                                      ? 'bg-emerald-100 text-emerald-700'
                                      : tech.verification_status === 'pending'
                                      ? 'bg-amber-100 text-amber-700'
                                      : 'bg-rose-100 text-rose-700'
                                  }`}>
                                    {tech.verification_status.toUpperCase()}
                                  </span>
                                </td>
                                <td className="px-6 py-3.5 text-right">
                                  <div className="flex items-center justify-end gap-1.5">
                                    {tech.verification_status !== 'approved' && (
                                      <button
                                        onClick={() => handleApproveTechnician(tech.id)}
                                        disabled={actionLoadingId === tech.id}
                                        className="rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-semibold text-white shadow-soft hover:bg-emerald-700 transition-colors"
                                      >
                                        Approve
                                      </button>
                                    )}
                                    {tech.verification_status !== 'rejected' && (
                                      <button
                                        onClick={() => handleRejectTechnician(tech.id)}
                                        disabled={actionLoadingId === tech.id}
                                        className="rounded-lg bg-rose-100 px-2.5 py-1 text-[11px] font-semibold text-rose-700 hover:bg-rose-200 transition-colors"
                                      >
                                        Reject
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* ============================================================== */}
              {/* TAB 4: SERVICE REQUESTS */}
              {/* ============================================================== */}
              {activeTab === 'requests' && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <h1 className="text-2xl font-black text-ink">Service Requests</h1>
                      <p className="text-xs text-ink/60">Customer diagnostic repair requests, locations, and statuses.</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <select
                        value={requestStatusFilter}
                        onChange={(e) => setRequestStatusFilter(e.target.value)}
                        className="rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-ink focus:outline-none focus:ring-2 focus:ring-primary/20"
                      >
                        <option value="">All Statuses ({allRequests.length})</option>
                        <option value="requested">Requested</option>
                        <option value="matching">Matching</option>
                        <option value="quoted">Quoted</option>
                        <option value="booked">Booked</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                  </div>

                  <div className="card overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="border-b border-slate-200 bg-slate-50 font-bold uppercase text-ink/50 text-[10px] tracking-wider">
                          <tr>
                            <th className="px-6 py-3.5">Category</th>
                            <th className="px-6 py-3.5">Problem Summary</th>
                            <th className="px-6 py-3.5">Customer</th>
                            <th className="px-6 py-3.5">Location</th>
                            <th className="px-6 py-3.5">Status</th>
                            <th className="px-6 py-3.5">Created</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {allRequests
                            .filter((r) => (requestStatusFilter ? r.status === requestStatusFilter : true))
                            .filter((r) =>
                              searchQuery
                                ? r.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                  r.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                  r.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                  r.location?.toLowerCase().includes(searchQuery.toLowerCase())
                                : true,
                            )
                            .map((req) => (
                              <tr key={req.id} className="hover:bg-slate-50/80 transition-colors">
                                <td className="px-6 py-3.5">
                                  <div className="flex items-center gap-2 font-bold text-ink">
                                    <span className="text-base">{req.category_icon || '🔧'}</span>
                                    <span>{req.category_name || 'General'}</span>
                                  </div>
                                </td>
                                <td className="px-6 py-3.5 max-w-xs">
                                  <p className="font-bold text-ink truncate">{req.title || req.description}</p>
                                  <p className="text-[10px] text-ink/50 truncate">{req.description}</p>
                                </td>
                                <td className="px-6 py-3.5">
                                  <p className="font-semibold text-ink">{req.customer_name}</p>
                                  <p className="text-[10px] text-ink/50">{req.customer_email}</p>
                                </td>
                                <td className="px-6 py-3.5 text-ink/60">{req.location || '—'}</td>
                                <td className="px-6 py-3.5">
                                  <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${getStatusBadgeClass(req.status)}`}>
                                    {req.status}
                                  </span>
                                </td>
                                <td className="px-6 py-3.5 text-ink/50 tabular-nums">
                                  {new Date(req.created_at).toLocaleDateString()}
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* ============================================================== */}
              {/* TAB 5: BOOKINGS & JOBS */}
              {/* ============================================================== */}
              {activeTab === 'bookings' && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <h1 className="text-2xl font-black text-ink">Bookings & Jobs</h1>
                      <p className="text-xs text-ink/60">Live tracking for confirmed repair engagements.</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <select
                        value={bookingStatusFilter}
                        onChange={(e) => setBookingStatusFilter(e.target.value)}
                        className="rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-ink focus:outline-none focus:ring-2 focus:ring-primary/20"
                      >
                        <option value="">All Statuses ({allBookings.length})</option>
                        <option value="accepted">Accepted</option>
                        <option value="scheduled">Scheduled</option>
                        <option value="on_the_way">On The Way</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                  </div>

                  <div className="card overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="border-b border-slate-200 bg-slate-50 font-bold uppercase text-ink/50 text-[10px] tracking-wider">
                          <tr>
                            <th className="px-6 py-3.5">Booking ID</th>
                            <th className="px-6 py-3.5">Service</th>
                            <th className="px-6 py-3.5">Customer</th>
                            <th className="px-6 py-3.5">Technician</th>
                            <th className="px-6 py-3.5">Scheduled Time</th>
                            <th className="px-6 py-3.5">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {allBookings
                            .filter((b) => (bookingStatusFilter ? b.status === bookingStatusFilter : true))
                            .filter((b) =>
                              searchQuery
                                ? b.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                  b.technician_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                  b.category_name?.toLowerCase().includes(searchQuery.toLowerCase())
                                : true,
                            )
                            .map((b) => (
                              <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                                <td className="px-6 py-3.5 font-mono text-[11px] text-ink/50 tabular-nums">
                                  {b.id.slice(0, 8)}...
                                </td>
                                <td className="px-6 py-3.5 font-bold text-ink">{b.category_name}</td>
                                <td className="px-6 py-3.5 text-ink/70">{b.customer_name}</td>
                                <td className="px-6 py-3.5 font-semibold text-primary">{b.technician_name}</td>
                                <td className="px-6 py-3.5 text-ink/60 tabular-nums">
                                  {b.scheduled_at ? new Date(b.scheduled_at).toLocaleString() : 'Not scheduled'}
                                </td>
                                <td className="px-6 py-3.5">
                                  <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${getStatusBadgeClass(b.status)}`}>
                                    {b.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* ============================================================== */}
              {/* TAB 6: REVIEWS MODERATION */}
              {/* ============================================================== */}
              {activeTab === 'reviews' && (
                <div className="space-y-6">
                  <div>
                    <h1 className="text-2xl font-black text-ink">Reviews Moderation</h1>
                    <p className="text-xs text-ink/60">Authentic customer ratings and technician reviews from completed jobs.</p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {allReviews.length === 0 ? (
                      <div className="col-span-full card p-8 text-center text-xs text-ink/50">
                        No reviews submitted yet.
                      </div>
                    ) : (
                      allReviews
                        .filter((rev) =>
                          searchQuery
                            ? rev.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              rev.technician_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              rev.comment?.toLowerCase().includes(searchQuery.toLowerCase())
                            : true,
                        )
                        .map((rev) => (
                          <div key={rev.id} className="card p-5 flex flex-col justify-between">
                            <div>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-0.5">
                                  {Array.from({ length: 5 }).map((_, i) => (
                                    <Star
                                      key={i}
                                      className={`h-3.5 w-3.5 ${
                                        i < rev.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'
                                      }`}
                                    />
                                  ))}
                                </div>
                                <span className="text-[10px] text-ink/40 tabular-nums">
                                  {new Date(rev.created_at).toLocaleDateString()}
                                </span>
                              </div>

                              <p className="mt-3 text-xs text-ink/80 italic leading-relaxed">
                                "{rev.comment || 'No comment provided'}"
                              </p>
                            </div>

                            <div className="mt-4 border-t border-slate-100 pt-3 flex items-center justify-between">
                              <div className="text-[11px]">
                                <p className="font-bold text-ink">By: {rev.customer_name}</p>
                                <p className="text-ink/50">For: {rev.technician_name}</p>
                              </div>
                              <button
                                onClick={() => handleDeleteReview(rev.id)}
                                disabled={actionLoadingId === rev.id}
                                className="rounded-lg p-1.5 text-rose-500 hover:bg-rose-50 transition-colors"
                                title="Delete Review"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        ))
                    )}
                  </div>
                </div>
              )}

              {/* ============================================================== */}
              {/* TAB 7: COMPLAINTS & DISPUTES */}
              {/* ============================================================== */}
              {activeTab === 'complaints' && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <h1 className="text-2xl font-black text-ink">Customer Complaints</h1>
                      <p className="text-xs text-ink/60">Disputes and service issues reported by users.</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <select
                        value={complaintStatusFilter}
                        onChange={(e) => setComplaintStatusFilter(e.target.value)}
                        className="rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-ink focus:outline-none focus:ring-2 focus:ring-primary/20"
                      >
                        <option value="">All Statuses ({allComplaints.length})</option>
                        <option value="open">Open</option>
                        <option value="under_review">Under Review</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                      </select>
                    </div>
                  </div>

                  <div className="card overflow-hidden">
                    <div className="divide-y divide-slate-100">
                      {allComplaints
                        .filter((c) => (complaintStatusFilter ? c.status === complaintStatusFilter : true))
                        .filter((c) =>
                          searchQuery
                            ? c.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              c.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              c.customer_name?.toLowerCase().includes(searchQuery.toLowerCase())
                            : true,
                        )
                        .map((c) => (
                          <div key={c.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className={`rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase ${
                                  c.status === 'open' ? 'bg-rose-100 text-rose-700' :
                                  c.status === 'under_review' ? 'bg-amber-100 text-amber-700' :
                                  'bg-emerald-100 text-emerald-700'
                                }`}>
                                  {c.status}
                                </span>
                                <h3 className="text-sm font-bold text-ink truncate">{c.subject}</h3>
                              </div>
                              <p className="mt-2 text-xs text-ink/75 max-w-2xl">{c.description}</p>
                              <p className="mt-2 text-[11px] text-ink/40 tabular-nums">
                                Submitted by {c.customer_name} ({c.customer_email}) on {new Date(c.created_at).toLocaleString()}
                              </p>
                            </div>

                            <div className="shrink-0">
                              <select
                                value={c.status}
                                onChange={(e) => handleComplaintStatusChange(c.id, e.target.value)}
                                className="rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-ink focus:ring-2 focus:ring-primary/20"
                              >
                                <option value="open">Open</option>
                                <option value="under_review">Under Review</option>
                                <option value="resolved">Resolved</option>
                                <option value="closed">Closed</option>
                              </select>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ============================================================== */}
              {/* TAB 8: NOTIFICATIONS LOG */}
              {/* ============================================================== */}
              {activeTab === 'notifications' && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <h1 className="text-2xl font-black text-ink">System Notifications</h1>
                      <p className="text-xs text-ink/60">Platform events, registration alerts, and user notifications.</p>
                    </div>

                    {unreadNotifCount > 0 && (
                      <button
                        onClick={handleMarkAllNotificationsRead}
                        className="btn-secondary text-xs"
                      >
                        <CheckCheck className="h-3.5 w-3.5" /> Mark All as Read
                      </button>
                    )}
                  </div>

                  <div className="card overflow-hidden">
                    <div className="divide-y divide-slate-100">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center text-xs text-ink/50">
                          <CheckCircle2 className="mx-auto mb-2 h-8 w-8 text-emerald-500" />
                          No notifications recorded.
                        </div>
                      ) : (
                        notifications
                          .filter((n) =>
                            searchQuery
                              ? n.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                n.message?.toLowerCase().includes(searchQuery.toLowerCase())
                              : true,
                          )
                          .map((n) => (
                            <div
                              key={n.id}
                              className={`p-4 flex items-start justify-between gap-3 transition-colors ${
                                n.read ? 'bg-white' : 'bg-purple-50/40'
                              }`}
                            >
                              <div className="flex items-start gap-3 min-w-0">
                                <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${n.read ? 'bg-slate-300' : 'bg-primary'}`} />
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h4 className="text-xs font-bold text-ink">{n.title || 'Notification'}</h4>
                                    {n.type && (
                                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-semibold text-ink/60">
                                        {n.type}
                                      </span>
                                    )}
                                  </div>
                                  <p className="mt-1 text-xs text-ink/75">{n.message}</p>
                                  <p className="mt-1 text-[10px] text-ink/40 tabular-nums">
                                    {new Date(n.created_at).toLocaleString()}
                                  </p>
                                </div>
                              </div>

                              {!n.read && (
                                <button
                                  onClick={() => handleMarkNotificationRead(n.id)}
                                  className="rounded-lg bg-white px-2.5 py-1 text-[10px] font-semibold text-primary ring-1 ring-slate-200 hover:bg-slate-50 shrink-0"
                                >
                                  Mark read
                                </button>
                              )}
                            </div>
                          ))
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ============================================================== */}
              {/* TAB 9: PLATFORM & CATEGORIES SETTINGS */}
              {/* ============================================================== */}
              {activeTab === 'settings' && (
                <div className="space-y-6">
                  <div>
                    <h1 className="text-2xl font-black text-ink">Platform & Category Settings</h1>
                    <p className="text-xs text-ink/60">Manage service category catalog and operational settings.</p>
                  </div>

                  <div className="card p-6">
                    <h3 className="font-bold text-xs uppercase tracking-wider text-ink/80 pb-3 border-b border-slate-100">
                      Service Category Catalog
                    </h3>
                    <p className="text-xs text-ink/50 mt-2 mb-4">
                      Toggle active visibility for customer diagnosis and technician matching.
                    </p>

                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {categories.map((cat) => (
                        <div
                          key={cat.id}
                          className="flex items-center justify-between rounded-xl bg-slate-50 p-3.5 ring-1 ring-slate-200/60"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="text-xl shrink-0">{cat.icon || '🔧'}</span>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-ink truncate">{cat.name}</p>
                              <p className="text-[10px] text-ink/50 truncate">{cat.description}</p>
                            </div>
                          </div>

                          <button
                            onClick={() => handleToggleCategory(cat.id, cat.is_active)}
                            disabled={actionLoadingId === cat.id}
                            className={`rounded-lg px-2.5 py-1 text-[10px] font-bold transition-colors shrink-0 ${
                              cat.is_active
                                ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                                : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                            }`}
                          >
                            {cat.is_active ? 'Active' : 'Disabled'}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  )
}

function KPICard({
  title,
  value,
  icon,
  bg,
  highlight = false,
  onClick,
}: {
  title: string
  value: number
  icon: React.ReactNode
  bg: string
  highlight?: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`card flex flex-col justify-between p-3.5 text-left transition-all hover:-translate-y-0.5 hover:shadow-lift ${
        highlight ? 'ring-2 ring-amber-400 bg-amber-50/40' : ''
      }`}
    >
      <div className="flex items-center justify-between gap-1">
        <span className="text-[11px] font-semibold text-ink/60 truncate">{title}</span>
        <div className={`flex h-6 w-6 items-center justify-center rounded-lg ${bg} shrink-0`}>
          {icon}
        </div>
      </div>
      <p className="mt-2.5 text-2xl font-black tabular-nums tracking-tight text-ink">{value}</p>
    </button>
  )
}

function getStatusBadgeClass(status: string) {
  switch (status) {
    case 'completed':
    case 'approved':
    case 'verified':
      return 'bg-emerald-100 text-emerald-700'
    case 'in_progress':
    case 'scheduled':
    case 'on_the_way':
    case 'booked':
      return 'bg-purple-100 text-purple-700'
    case 'pending':
    case 'quoted':
    case 'matching':
    case 'requested':
    case 'under_review':
      return 'bg-amber-100 text-amber-700'
    case 'cancelled':
    case 'rejected':
      return 'bg-rose-100 text-rose-700'
    default:
      return 'bg-slate-100 text-slate-700'
  }
}
