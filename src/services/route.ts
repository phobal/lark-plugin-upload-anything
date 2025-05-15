import { AppConfig } from '../config'
import { createInstance, APIService } from '../utils/fetch'

const _fetch = createInstance({
  baseURL: `${AppConfig.baseApiURL}/services/`,
})

interface GeocodeParams {
  address: string
  country?: string
  language?: string
  token?: string
}

class RouteService extends APIService {
  async getRouteByMapbox({ start, end, way, token }: { start: string, end: string, way: 'bicycling' | 'driving' | 'walking', token?: string }) {
    const coordinates = encodeURIComponent(`${start};${end}`)
    const res = await this.fetch.get(`/mapbox/district/${way}/${coordinates}/`, {
      params: { token },
    })
    const data = res.data
    const distance = data.routes.map((route: any) => route.distance).reduce((a: number, b: number) => a + b, 0)
    const time = data.routes.map((route: any) => route.duration).reduce((a: number, b: number) => a + b, 0)
    return { distance, time }
  }

  async getGeocoding({ address, token, language, country }: GeocodeParams) {
    const encodedAddress = encodeURIComponent(address)
    try {
      const res = await this.fetch.get(`/mapbox/geocode/${encodedAddress}/`, {
        params: {
          token,
          language,
          country,
        },
      })
      if (res.data.message === 'errors.quota.overLimit') {
        return {
          error: true,
          message: res.data.message,
        }
      }
      const data = res.data
      if (data.features && data.features.length > 0) {
        // 返回第一个匹配的结果
        const result = data.features[0]
        const name = result?.text
        const fullAddress = result?.matching_place_name
        const latitude = result?.center?.[1]
        const longitude = result?.center?.[0]
        const context = result?.context || []
        const country = context.find(c => c.id.includes('country'))?.text
        const region = context.find(c => c.id.includes('region'))?.text
        const district = context.find(c => c.id.includes('locality'))?.text
        const place = context.find(c => c.id.includes('place'))?.text
        const address = result?.matching_place_name
        return {
          name,
          fullAddress,
          latitude,
          longitude,
          country,
          province: region,
          district,
          city: place,
          address,
        }
      }
    } catch (error: any) {
      return {
        error: true,
        message: error.response.data.message,
      }
    }
  }

  async getGeocodingByGoogle({ address, token, language, country }: GeocodeParams) {
    const encodedAddress = encodeURIComponent(address)
    try {
      const res = await this.fetch.get(`/googlemap/geocode/${encodedAddress}/`, {
        params: {
          token,
          language,
          country,
        },
      })
      console.log('res', res)

      if (res.data.status !== 'OK') {
        return {
          error: true,
          message: res.data.error_message,
        }
      }

      const data = res.data
      if (data.results && data.results.length > 0) {
        // 返回第一个匹配的结果
        const result = data.results[0]
        const name = result.formatted_address.split(',')[0]
        const fullAddress = result.formatted_address
        const location = result.geometry.location
        const latitude = location.lat
        const longitude = location.lng

        // 解析地址组件
        const addressComponents = result.address_components || []
        const country = addressComponents.find(c => c.types.includes('country'))?.long_name
        const province = addressComponents.find(c => c.types.includes('administrative_area_level_1'))?.long_name
        const district = addressComponents.find(c => c.types.includes('administrative_area_level_2') || c.types.includes('sublocality'))?.long_name
        const city = addressComponents.find(c => c.types.includes('locality'))?.long_name
        const address = result.formatted_address

        return {
          name,
          fullAddress,
          latitude,
          longitude,
          country,
          province,
          district,
          city,
          address,
        }
      }

      return {
        error: true,
        message: 'No results found',
      }
    } catch (error: any) {
      return {
        error: true,
        message: error.response?.data?.message || error.message,
      }
    }
  }

  async getGeocodingByLark(inputs: string[]) {
    const res = await this.fetch.post(`/base/geocode/`, {
      inputs,
      type: 'lark',
    })
    if (res.data.message !== 'OK') {
      return {
        error: true,
        message: res.data.message,
      }
    }
    const data = res.data
    const result = data.detail[0]
    const name = result.address
    const fullAddress = result.full_address
    const latitude = result.location?.split?.(',')?.[1] || undefined
    const longitude = result.location?.split?.(',')?.[0] || undefined
    const province = result.pname
    const city = result.cityname
    const district = result.adname
    const address = result.full_address
    return {
      name,
      fullAddress,
      latitude,
      longitude,
      province,
      city,
      district,
      address,
    }
  }
}

const routeService = new RouteService(_fetch)

export default routeService