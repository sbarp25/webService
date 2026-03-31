import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Gets the base URL for the application.
 * In the browser, it uses window.location.origin.
 * On the server, it uses environment variables or provided host.
 */
export function getBaseUrl(host?: string | null) {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }

  // Use NEXT_PUBLIC_URL if available
  if (process.env.NEXT_PUBLIC_URL) {
    return process.env.NEXT_PUBLIC_URL;
  }

  // Fallback to host header or NEXTAUTH_URL
  if (host) {
    const protocol = host.includes('localhost') || host.match(/^\d+\.\d+\.\d+\.\d+/) ? 'http' : 'https';
    return `${protocol}://${host}`;
  }

  return process.env.NEXTAUTH_URL || 'http://localhost:3000';
}
