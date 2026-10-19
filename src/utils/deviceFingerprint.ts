import { computeDeterministicDeviceHash } from './authLogic';

const DEVICE_TOKEN_STORAGE_KEY = 'math_detective_device_hw_token_v1';

export interface ClientNetworkIdentity {
  deviceHash: string;
  ipAddress: string;
  userAgent: string;
}

export function getOrCreateDeviceHash(): string {
  let persistentSeed = '';
  try {
    persistentSeed = localStorage.getItem(DEVICE_TOKEN_STORAGE_KEY) || '';
    if (!persistentSeed) {
      persistentSeed =
        Math.random().toString(36).slice(2) + '-' + Date.now().toString(36);
      localStorage.setItem(DEVICE_TOKEN_STORAGE_KEY, persistentSeed);
    }
  } catch {
    persistentSeed = 'fallback-seed';
  }

  const nav = typeof navigator !== 'undefined' ? navigator : ({} as Navigator);
  const scr = typeof screen !== 'undefined' ? screen : ({} as Screen);
  const hwTraits = [
    nav.platform || '',
    nav.language || '',
    String(nav.hardwareConcurrency || ''),
    String(nav.maxTouchPoints || ''),
    `${scr.width || 0}x${scr.height || 0}x${scr.colorDepth || 0}`,
    Intl.DateTimeFormat().resolvedOptions().timeZone || '',
    persistentSeed,
  ].join('|');

  return computeDeterministicDeviceHash(hwTraits);
}

export async function detectClientIpAddress(): Promise<string> {
  const endpoints = [
    'https://api.ipify.org?format=json',
    'https://api64.ipify.org?format=json',
  ];
  for (const url of endpoints) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 2500);
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timer);
      if (res.ok) {
        const data = (await res.json()) as { ip?: string };
        if (data?.ip && typeof data.ip === 'string') {
          return data.ip.trim().slice(0, 64);
        }
      }
    } catch {
      // try next or fallback
    }
  }
  return 'local-network';
}

export async function getClientNetworkIdentity(): Promise<ClientNetworkIdentity> {
  const deviceHash = getOrCreateDeviceHash();
  const ipAddress = await detectClientIpAddress();
  const userAgent =
    (typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown').slice(
      0,
      240
    ) || 'Unknown';
  return { deviceHash, ipAddress, userAgent };
}
