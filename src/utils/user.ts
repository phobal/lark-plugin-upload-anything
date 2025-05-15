import store from 'store2'
import { USER_INFO } from '../constants/store'

export const getUserInfo = () => {
  const userInfo = store.local.get(USER_INFO)
  if (userInfo) {
    return JSON.parse(userInfo)
  }
  return null
}

export const setUserInfo = (userInfo: any) => {
  store.local.set(USER_INFO, JSON.stringify(userInfo))
}
