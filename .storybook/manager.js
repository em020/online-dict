const defaultStoryPath = '/story/dicts--networktest'

if (typeof window !== 'undefined') {
  const url = new URL(window.location.href)
  if (!url.searchParams.get('path')) {
    url.searchParams.set('path', defaultStoryPath)
    window.history.replaceState({}, '', url.toString())
  }
}
