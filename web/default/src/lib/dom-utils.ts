export function applyFaviconToDom(url: string) {
  if (typeof document === 'undefined' || !url) return
  try {
    if (url === '/logo.png' || url === '/arona-mark.svg') {
      return
    }

    const next = new URL(url, window.location.href).href
    const existing =
      document.querySelectorAll<HTMLLinkElement>('link[rel~="icon"]')
    if (existing.length === 1 && existing[0].href === next) return
    const link = document.createElement('link')
    link.rel = 'icon'
    link.href = url
    existing.forEach((l) => l.remove())
    document.head.appendChild(link)
  } catch {
    // Ignore malformed URLs
  }
}
