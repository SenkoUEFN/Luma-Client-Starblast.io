const fs = require("fs"), path = require("path");
const pkg = require("../package.json");
const cfg = Array.isArray(pkg.build.publish) ? pkg.build.publish[0] : pkg.build.publish;
const token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;

function die(m) { console.error(m); process.exit(1); }
if (!token) die('Token GitHub manquant: mets $env:GH_TOKEN="ton_token" puis relance npm run publish');

const owner = cfg.owner, repo = cfg.repo, version = pkg.version, tag = `v${version}`;
const dist = path.join(__dirname, "..", "dist");
const latestFile = path.join(dist, "latest.yml");
const latest = fs.readFileSync(latestFile, "utf8");
const remoteExe = (latest.match(/^path:\s*(.+)$/m) || [])[1]?.trim().replace(/^['"]|['"]$/g, "");
const localExe = fs.readdirSync(dist).find(n => n.endsWith(`${version}.exe`) && !n.includes("__uninstaller"));

if (!remoteExe || !localExe) die("Impossible de trouver le .exe ou latest.yml dans dist");

const assets = [
  { file: path.join(dist, localExe), name: remoteExe },
  { file: path.join(dist, `${localExe}.blockmap`), name: `${remoteExe}.blockmap` },
  { file: latestFile, name: "latest.yml" }
];

async function api(p, o = {}) {
  const body = o.body ? JSON.stringify(o.body) : undefined;
  const r = await fetch(`https://api.github.com${p}`, {
    method: o.method || "GET",
    headers: {
      "Accept": "application/vnd.github+json",
      "Authorization": `Bearer ${token}`,
      "User-Agent": "luma-client-publisher",
      ...(body ? { "Content-Type": "application/json" } : {})
    },
    body
  });
  const text = await r.text();
  if (r.status === 404 && o.allow404) return null;
  if (!r.ok) die(`GitHub ${r.status}: ${text}`);
  return text ? JSON.parse(text) : null;
}

async function main() {
  let release = await api(`/repos/${owner}/${repo}/releases/tags/${tag}`, { allow404: true });
  if (!release) release = await api(`/repos/${owner}/${repo}/releases`, {
    method: "POST",
    body: { tag_name: tag, name: tag, draft: false, prerelease: false }
  });

  for (const a of assets) {
    for (const old of (release.assets || []).filter(x => x.name === a.name || x.name === path.basename(a.file))) {
      await api(`/repos/${owner}/${repo}/releases/assets/${old.id}`, { method: "DELETE" });
    }
    const u = new URL(release.upload_url.replace("{?name,label}", ""));
    u.searchParams.set("name", a.name);
    const r = await fetch(u, {
      method: "POST",
      headers: { "Authorization": `Bearer ${token}`, "User-Agent": "luma-client-publisher", "Content-Type": "application/octet-stream" },
      body: fs.readFileSync(a.file)
    });
    const text = await r.text();
    if (!r.ok) die(`Upload ${a.name}: GitHub ${r.status}: ${text}`);
    console.log(`uploaded ${a.name}`);
  }
  console.log(`Release ${tag} OK`);
}

main().catch(e => die(e.message));