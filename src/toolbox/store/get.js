import settings from 'settings-store'

export default async ({ key, secure }) => {
  try {
    return settings.value(key, 0)
  } catch (e) {
    console.error('store get', e)
  }
  return null
}
