/*
 * Demo data seeder for screenshots.
 *
 * Open the dashboard (web: http://localhost:3617 — or the extension's full-page tab),
 * open DevTools → Console, paste this whole file, press Enter, then reload the page.
 * The dashboard will show a realistic last-30-days snapshot you can screenshot. It writes
 * to the same IndexedDB store the app uses (DB "mw-stats", store "kv") under the default
 * date range, so it loads automatically. Delete it later by clearing the extension/site data.
 */
(async () => {
  const end = new Date().toISOString().slice(0, 10);
  const sd = new Date();
  sd.setUTCDate(sd.getUTCDate() - 30);
  const start = sd.toISOString().slice(0, 10);

  const CATS = ["Gadgets", "Home", "Toys & Games", "Art", "Tools", "Miniatures", "Organization"];
  const LICENSES = ["CC BY", "CC BY-NC", "CC BY-SA", "Standard Digital File License"];
  const TAGPOOL = ["functional", "print-in-place", "no-supports", "articulated", "desk", "gift",
    "cute", "modular", "useful", "fidget", "kitchen", "cable", "minimal", "remix"];
  const TITLES = [
    "Modular Desk Organizer", "Print-in-Place Dragon", "Cable Clip Set", "Hexagon Wall Shelf",
    "Articulated Slug", "Minimalist Pen Holder", "Snap-Fit Battery Box", "Low-Poly Planter",
    "Phone Stand Pro", "Keycap Sampler", "Tolerance Test Cube", "Headphone Hook",
    "Drawer Divider Kit", "Whistle (Loud)", "Coaster Set of 4", "Self-Watering Pot",
    "Filament Clip", "Measuring Spoon Set", "Wall Hook Heavy", "Dice Tower",
    "SD Card Tray", "Cookie Cutter Star", "Toothbrush Holder", "Mini Toolbox"];

  let seed = 1337;
  const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
  const pick = (a) => a[Math.floor(rnd() * a.length)];
  const between = (lo, hi) => Math.floor(lo + rnd() * (hi - lo));

  const models = TITLES.map((title, i) => {
    const impr = between(2000, 90000);
    const view = Math.floor(impr * (0.18 + rnd() * 0.22));
    const dl = Math.floor(view * (0.05 + rnd() * 0.18));
    const print = Math.floor(dl * (0.2 + rnd() * 0.5));
    const collect = Math.floor(dl * (0.1 + rnd() * 0.3));
    const like = Math.floor(view * (0.01 + rnd() * 0.04));
    const boost = between(0, 14);
    const point = between(20, 1400);
    // traffic source mix → 5 buckets summing to 100
    const raw = [rnd(), rnd(), rnd(), rnd(), rnd()];
    const sum = raw.reduce((a, b) => a + b, 0);
    const ts = raw.map((v) => Math.round((v / sum) * 100));
    ts[0] += 100 - ts.reduce((a, b) => a + b, 0); // fix rounding on first bucket
    const ageDays = between(15, 900);
    const pubDate = new Date();
    pubDate.setUTCDate(pubDate.getUTCDate() - ageDays);
    const pub = pubDate.toISOString().slice(0, 10);
    const tags = Array.from({ length: between(2, 6) }, () => pick(TAGPOOL))
      .filter((t, idx, arr) => arr.indexOf(t) === idx);
    return {
      id: 100000 + i,
      cat: pick(CATS),
      category: pick(CATS),
      tags,
      title,
      impr, view, dl, print, collect, like, boost, point,
      ts,
      pub,
      license: pick(LICENSES),
      instances: between(1, 6),
      ageDays,
      viewPerDay: Math.round((view / ageDays) * 10) / 10,
      dlPerDay: Math.round((dl / ageDays) * 100) / 100,
    };
  });

  const snapshot = {
    meta: {
      dateRange: { start, end },
      collectedAt: new Date().toISOString(),
      buildId: "demo",
      modelCount: models.length,
      errors: 0,
      metaErrors: 0,
      hasMetadata: true,
    },
    models,
  };

  const key = `snapshot:${start}_${end}`;
  await new Promise((resolve, reject) => {
    const req = indexedDB.open("mw-stats");
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains("kv")) db.createObjectStore("kv");
    };
    req.onerror = () => reject(req.error);
    req.onsuccess = () => {
      const db = req.result;
      const tx = db.transaction("kv", "readwrite");
      tx.objectStore("kv").put(snapshot, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    };
  });

  console.log(`✓ Seeded demo snapshot "${key}" with ${models.length} models. Reload the page.`);
})();
