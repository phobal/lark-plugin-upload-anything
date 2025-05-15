import { bitable } from "@lark-base-open/js-sdk"
import useSWR from "swr"

const useEnv = () => {
  const { data } = useSWR('getEnv', async () => {
    const env = await bitable.bridge.getEnv()
    return env.product
  })

  return {
    env: data,
  }
}

export { useEnv }