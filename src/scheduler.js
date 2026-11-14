// Interner Zeitplan: TMDB-Nachladen und (falls verbunden) Trakt-Sync alle SYNC_INTERVAL_MINUTES.
// Läuft in der App selbst – auf Render ist kein separater Cron-Job nötig.
import { config } from './config.js';
import * as tmdb from './tmdb.js';

const jobs = [];
/** Weitere Module (Trakt) hängen hier ihre Jobs ein. */
export function registerJob(name, fn) {
  jobs.push({ name, fn });
}

let busy = false;
export async function runAllJobs() {
  if (busy) return { busy: true };
  busy = true;
  const result = {};
  try {
    for (const j of jobs) {
      try { result[j.name] = await j.fn(); } catch (err) { result[j.name] = { error: err.message }; console.error(`[job] ${j.name}`, err.message); }
    }
    result.tmdb = await tmdb.enrich().catch((err) => ({ error: err.message }));
  } finally {
    busy = false;
  }
  return result;
}

export function startScheduler() {
  if (!config.internalScheduler) return;
  // Kurz nach dem Start einmal laufen (z. B. offene TMDB-Abgleiche nach einem Deploy)
  setTimeout(() => runAllJobs().catch(() => {}), 15_000).unref();
  setInterval(() => runAllJobs().catch(() => {}), config.syncIntervalMinutes * 60_000).unref();
  // Render-Free schläft nach 15 Min. ohne Anfrage ein → alle 10 Min. selbst anpingen
  if (config.keepAliveUrl) setInterval(() => fetch(config.keepAliveUrl).catch(() => {}), 10 * 60_000).unref();
}
