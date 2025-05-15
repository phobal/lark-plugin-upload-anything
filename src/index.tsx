import React from 'react'
import ReactDOM from 'react-dom/client'
import HomePage from './pages'
import { ThemeProvider } from './contexts/ThemeContext'
import './styles/globals.css'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ThemeProvider>
      <HomePage />
    </ThemeProvider>
  </React.StrictMode>
)