import { useEffect, useState } from 'react'
import './App.css'

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

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    window.localStorage.setItem(STORAGE_KEY, theme)
  }, [theme])

  return (
    <div className="app-shell">
      <header className="topbar">
        <nav className="topbar__nav" aria-label="Primary">
          <span className="topbar__item">Fleet</span>
          <span className="topbar__item">Menu</span>
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
        <section className="dashboard-panel" aria-label="Dashboard" />
      </main>
    </div>
  )
}

export default App
