import { ComponentType, useCallback } from 'react'
import { message, Spin } from 'antd'
import useSWR from 'swr'
import { bitable } from '@lark-base-open/js-sdk'
import authService from '../services/auth'
import { setCookies } from '../utils/cookie'
import { setUserInfo } from '../utils/user'

function useLogin() {
  const login = useCallback(async () => {
    const env = await bitable.bridge.getEnv()
    try {
      if (!env) return
      const platform = env.product === 'feishu' ? 'feishuPlugin' : 'larkPlugin'
      const userId = await bitable.bridge.getUserId()
      const orgId = await bitable.bridge.getTenantKey()
      const loginRes = await authService.login({
        thirdpartyUserId: userId,
        thirdpartyType: platform,
        thirdpartyOrgId: orgId,
      })
      const { token, refreshToken, ...res } = loginRes || {}
      setCookies(token, refreshToken)
      setUserInfo({
        ...res,
      })
    } catch (e) {
      message.error(e)
    }
  }, [])
  useSWR(['login'], async ([_]) => login())
}

export { useLogin }
