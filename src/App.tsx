import { Routes, Route, Navigate } from 'react-router-dom'
import Header from './components/Header'
import Footer from './components/Footer'
import ProtectedRoute from './components/ProtectedRoute'
import { useAuth } from './context/AuthContext'
import LandingPage from './pages/LandingPage'
import ServicesPage from './pages/ServicesPage'
import AIAssistantPage from './pages/AIAssistantPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import TechnicianPage from './pages/TechnicianPage'
import TechnicianRegisterPage from './pages/TechnicianRegisterPage'
import FindTechniciansPage from './pages/FindTechniciansPage'
import TechnicianProfilePage from './pages/TechnicianProfilePage'
import QuotesPage from './pages/QuotesPage'
import BookingPage from './pages/BookingPage'
import DashboardPage from './pages/DashboardPage'
import AdminPage from './pages/AdminPage'

function RedirectIfAuthed({ children }: { children: React.ReactNode }) {
  const { session, profile, loading } = useAuth()
  if (loading) return <>{children}</>
  if (session && profile) {
    const home = profile.role === 'technician' ? '/technician' : profile.role === 'admin' ? '/admin' : '/dashboard'
    return <Navigate to={home} replace />
  }
  return <>{children}</>
}

export default function App() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/ai-assistant" element={<AIAssistantPage />} />
          <Route path="/login" element={<RedirectIfAuthed><LoginPage /></RedirectIfAuthed>} />
          <Route path="/register" element={<RedirectIfAuthed><RegisterPage /></RedirectIfAuthed>} />
          <Route path="/technician" element={<TechnicianPage />} />
          <Route path="/technician/register" element={<TechnicianRegisterPage />} />
          <Route path="/technicians" element={<FindTechniciansPage />} />
          <Route path="/technicians/:id" element={<TechnicianProfilePage />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowedRoles={['user']}>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<LandingPage />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}
