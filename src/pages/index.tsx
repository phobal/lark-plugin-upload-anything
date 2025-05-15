import React from 'react'
import Home from '../components/home'
import { useI18n } from '../hooks/useI18n'

import '../styles/globals.css'

const HomePage = () => {
  useI18n()
  return (
    <main className="min-h-screen">
      <Home />
    </main>
  )
}

export default HomePage
