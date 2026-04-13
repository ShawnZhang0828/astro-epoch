import { useEffect } from 'react'
import {
  Navigate,
  NavLink,
  Outlet,
  Route,
  RouterProvider,
  createHashRouter,
  createRoutesFromElements,
  useNavigate
} from 'react-router-dom'
import AnalyticsPage from './pages/AnalyticsPage'
import ExhibitionPage from './pages/ExhibitionPage'
import FocusPage from './pages/FocusPage'
import HistoryPage from './pages/HistoryPage'
import SettingsPage from './pages/SettingsPage'
import ShopPage from './pages/ShopPage'
import { AtmosphereFocusLayer } from './components/AtmosphereFocusLayer'
import { CosmosBackdrop } from './components/CosmosBackdrop'
import { SidebarNavIcon } from './components/SidebarNavIcon'
import { StardustGlyph } from './components/StardustGlyph'
import { DataProvider, useAppData } from './context/DataContext'
import { FocusSessionProvider } from './context/FocusSessionContext'

function Shell() {
  const { data } = useAppData()
  const navigate = useNavigate()

  useEffect(() => {
    const ae = typeof window !== 'undefined' ? window.ae : undefined
    if (!ae?.onSuggestFocus) return
    return ae.onSuggestFocus(() => {
      navigate('/focus')
    })
  }, [navigate])

  return (
    <div className="app-shell">
      <aside className="sidebar app-ui-text">
        <div className="brand">Astro Epoch</div>
        <NavLink className={({ isActive }) => 'nav-link app-ui-text' + (isActive ? ' active' : '')} to="/focus">
          <SidebarNavIcon name="focus" className="nav-link__icon" />
          Focus
        </NavLink>
        <NavLink className={({ isActive }) => 'nav-link app-ui-text' + (isActive ? ' active' : '')} to="/analytics">
          <SidebarNavIcon name="analytics" className="nav-link__icon" />
          Analytics
        </NavLink>
        <NavLink className={({ isActive }) => 'nav-link app-ui-text' + (isActive ? ' active' : '')} to="/history">
          <SidebarNavIcon name="history" className="nav-link__icon" />
          History
        </NavLink>
        <NavLink className={({ isActive }) => 'nav-link app-ui-text' + (isActive ? ' active' : '')} to="/shop">
          <SidebarNavIcon name="market" className="nav-link__icon" />
          Market
        </NavLink>
        <NavLink className={({ isActive }) => 'nav-link app-ui-text' + (isActive ? ' active' : '')} to="/exhibition">
          <SidebarNavIcon name="exhibition" className="nav-link__icon" />
          Exhibition
        </NavLink>
        <NavLink className={({ isActive }) => 'nav-link app-ui-text' + (isActive ? ' active' : '')} to="/settings">
          <SidebarNavIcon name="settings" className="nav-link__icon" />
          Settings
        </NavLink>
        <div className="stardust-pill app-ui-text">
          <div className="stardust-pill__row">
            <StardustGlyph variant="inline" className="stardust-pill__icon" />
            <span>
              Stardust: <strong>{data?.stardust ?? '?'}</strong>
            </span>
          </div>
          <div className="stardust-pill__sub">Streak: {data?.streakDays ?? 0} days</div>
        </div>
      </aside>
      <main className="page app-ui-text page--cosmos">
        <CosmosBackdrop />
        <div className="page-cosmos__content">
          <Outlet />
        </div>
        <AtmosphereFocusLayer />
      </main>
    </div>
  )
}

const router = createHashRouter(
  createRoutesFromElements(
    <Route path="/" element={<Shell />}>
      <Route index element={<FocusPage />} />
      <Route path="focus" element={<FocusPage />} />
      <Route path="analytics" element={<AnalyticsPage />} />
      <Route path="history" element={<HistoryPage />} />
      <Route path="shop" element={<ShopPage />} />
      <Route path="exhibition" element={<ExhibitionPage />} />
      <Route path="settings" element={<SettingsPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Route>
  )
)

export default function App() {
  return (
    <DataProvider>
      <FocusSessionProvider>
        <RouterProvider router={router} />
      </FocusSessionProvider>
    </DataProvider>
  )
}
