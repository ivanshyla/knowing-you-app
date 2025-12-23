const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://knowing-you-prod.eu-north-1.elasticbeanstalk.com';
const IS_CAPACITOR = process.env.NEXT_PUBLIC_IS_CAPACITOR === 'true';

export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const url = IS_CAPACITOR 
    ? `${API_BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`
    : endpoint;

  // In Capacitor, we might need to handle cookies differently or use CapHttp
  // For now, standard fetch works if CORS is configured on the server
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  return response;
}

