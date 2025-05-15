import useSWR from 'swr'
import { bitable } from '@lark-base-open/js-sdk'
import { initI18n } from '../utils/i18n'

const useI18n = () => {
  const { data: language } = useSWR('getLanguage', async () => {
    const language = await bitable.bridge.getLanguage()
    return language
  })
  initI18n(language as any)
  return { language }
}

export { useI18n }