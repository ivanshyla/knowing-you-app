export function isCapacitor(): boolean {
  return typeof window !== 'undefined' && 
    (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } })?.Capacitor?.isNativePlatform?.() === true;
}
