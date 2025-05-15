import React from 'react'
import { useTranslation } from 'react-i18next'

const Home = () => {
  const { t } = useTranslation()
  return (
    <div className="max-w-[1200px]">
      {t('home.title')}
    </div>
  )
}

export default Home
