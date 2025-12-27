export function isCapacitor(): boolean {
  return typeof window !== 'undefined' && (window as any).Capacitor !== undefined;
}

export function getBaseUrl(): string {
  if (typeof window !== 'undefined' && isCapacitor()) {
    return process.env.NEXT_PUBLIC_API_BASE_URL || 'https://knowing-you-prod.eu-north-1.elasticbeanstalk.com';
  }
  return '';
}
