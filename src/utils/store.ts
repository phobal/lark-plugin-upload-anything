import store from 'store2'

export const setStore = (key: string, value: any) => {
  store.local.set(key, value)
}

export const getStore = (key: string) => {
  return store.local.get(key)
}
