// src/utils/eventBus.ts
import type { Activity } from '../types';

const EVT = 'activity:log';

export function logActivity(a: Activity) {
  window.dispatchEvent(new CustomEvent<Activity>(EVT, { detail: a }));
}

export function listenActivity(cb: (a: Activity) => void) {
  const handler = (e: Event) => cb((e as CustomEvent<Activity>).detail);
  window.addEventListener(EVT, handler as EventListener);
  return () => window.removeEventListener(EVT, handler as EventListener);
}
