import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import translationEN from './locales/en.json'
import translationZH from './locales/zh.json'
import translationJA from './locales/ja.json'

// 设置支持的语言列表
const supportedLanguages = ['en', 'zh', 'ja']

export function initI18n(lang: 'en' | 'zh' | 'ja') {
  // 初始化 i18n
  i18n.use(initReactI18next).init({
    resources: {
      en: {
        translation: translationEN,
      },
      zh: {
        translation: translationZH,
      },
      ja: {
        translation: translationJA,
      },
    },
    lng: lang, // 设置默认语言
    fallbackLng: 'en', // 如果没有对应的语言文件，则使用默认语言
    interpolation: {
      escapeValue: false, // 不进行 HTML 转义
    },
  })
}
