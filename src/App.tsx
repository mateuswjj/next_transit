import { useEffect, useState } from 'react'
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material'
import { NavLink, Route, Routes } from 'react-router-dom'
import './App.css'
import FleetPage from './pages/FleetPage'
import HomePage from './pages/HomePage'
import MenuPage from './pages/MenuPage'

type ThemeMode = 'light' | 'dark'

const STORAGE_KEY = 'nexus-transit-theme'

function getInitialTheme(): ThemeMode {
  const savedTheme = window.localStorage.getItem(STORAGE_KEY)

  if (savedTheme === 'light' || savedTheme === 'dark') {
    return savedTheme
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

function App() {
  const [theme, setTheme] = useState<ThemeMode>(getInitialTheme)

  const muiTheme = createTheme({
    palette: {
      mode: theme,
      primary: {
        main: theme === 'light' ? '#0f766e' : '#5eead4',
      },
      background: {
        default: theme === 'light' ? '#f3f5f7' : '#081118',
        paper: theme === 'light' ? '#ffffff' : '#0b1821',
      },
    },
  })

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    window.localStorage.setItem(STORAGE_KEY, theme)
  }, [theme])

  return (
    <ThemeProvider theme={muiTheme}>
      <CssBaseline />
      <div className="app-shell">
        <header className="topbar">
          <nav className="topbar__nav" aria-label="Primary">
            <NavLink
              to="/menu"
              className={({ isActive }) =>
                isActive ? 'topbar__item topbar__item--active' : 'topbar__item'
              }
            >
              Menu
            </NavLink>
            <NavLink
              to="/fleet"
              className={({ isActive }) =>
                isActive ? 'topbar__item topbar__item--active' : 'topbar__item'
              }
            >
              Fleet
            </NavLink>
          </nav>

          <button
            type="button"
            className="theme-switch"
            onClick={() => setTheme((current) => (current === 'light' ? 'dark' : 'light'))}
          >
            {theme === 'light' ? 'Dark mode' : 'Light mode'}
          </button>
        </header>

        <main className="dashboard-main">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/menu" element={<MenuPage />} />
            <Route path="/fleet" element={<FleetPage />} />
            <Route path="/fleetr" element={<FleetPage />} />
          </Routes>
        </main>
      </div>
    </ThemeProvider>
  )
}

export default App
