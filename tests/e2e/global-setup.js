// Erstes Konto = Admin. Wird vor allen Tests angelegt, damit die Admin-Rolle eindeutig ist.
export default async function globalSetup(config) {
  const base = config.projects[0].use.baseURL;
  for (let i = 0; i < 50; i++) {
    try { if ((await fetch(`${base}/healthz`)).ok) break; } catch { /* startet noch */ }
    await new Promise((r) => setTimeout(r, 200));
  }
  const r = await fetch(`${base}/api/auth/register`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'adminpass1', privacy: true, lang: 'de' }),
  });
  if (!r.ok && r.status !== 409) throw new Error(`Admin anlegen fehlgeschlagen: ${r.status}`);
}
