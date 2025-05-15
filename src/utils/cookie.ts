import Cookies from 'js-cookie'
import jwtDecode from 'jwt-decode'
import storage from 'store2'
import { IS_AUTH, REFRESH_TOKEN, TOKEN, USER_TYPE, TOKEN_EXPIRES_TIME, DEFAULT_TOKEN_EXPIRES } from '../constants/store'
// import { UserType, UserTypeEnum } from 'src/typings/auth'

export enum UserTypeEnum {
  SupperAdmin = 'supperAdmin',
  Admin = 'admin',
  User = 'user',
}

export type UserType = UserTypeEnum | null

export const setCookies = (token: string, refreshToken: string, userType?: UserType) => {
  Cookies.set(TOKEN, token, { expires: DEFAULT_TOKEN_EXPIRES })
  Cookies.set(REFRESH_TOKEN, refreshToken, { expires: DEFAULT_TOKEN_EXPIRES })
  storage.set(TOKEN, token)
  storage.set(REFRESH_TOKEN, refreshToken)
  const jwt = jwtDecode<{ exp?: number; userType: UserType }>(token)
  Cookies.set(USER_TYPE, userType ?? jwt?.userType ?? UserTypeEnum.User, { expires: DEFAULT_TOKEN_EXPIRES })
  Cookies.set(TOKEN_EXPIRES_TIME, '' + Math.round(jwt?.exp ?? new Date().getTime() / 1000 + 60 * 60 * 24 * 5))
  Cookies.set(IS_AUTH, 'true', { expires: DEFAULT_TOKEN_EXPIRES })
}
