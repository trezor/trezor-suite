//! Auto-updater — Tauri equivalent of Electron `suite-desktop-core/src/modules/auto-updater.ts`
//! + `libs/update-checker.ts`.
//!
//! Same feed as the Electron build (electron-builder generic provider):
//! `https://data.trezor.io/suite/releases/desktop/latest` (or `/canary` for Early Access), with
//! `latest-mac.yml` / `latest-linux.yml` / `latest.yml` metadata. The downloaded installer is
//! verified with its detached OpenPGP signature (`<file>.asc`) against the same signing key the
//! Electron app embeds (`suite-desktop-core/scripts/app-key.asc`) plus the sha512 from the feed.
//! Install opens the verified installer and exits (Tauri has no in-place electron-updater).

use pgp::composed::{Deserializable, SignedPublicKey, StandaloneSignature};
use serde_json::{json, Value};
use sha2::{Digest, Sha512};
use std::io::Write;
use std::path::PathBuf;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Mutex;
use tauri::{AppHandle, Emitter, Manager};

const FEED_LATEST: &str = "https://data.trezor.io/suite/releases/desktop/latest";
const FEED_PRERELEASE: &str = "https://data.trezor.io/suite/releases/desktop/canary";

/// The Electron build embeds this key via `process.env.APP_PUBKEY` (webpack define).
const APP_PUBKEY: &str = include_str!("../../../suite-desktop-core/scripts/app-key.asc");

pub struct UpdaterState {
    is_manual_check: AtomicBool,
    cancel: AtomicBool,
    downloading: AtomicBool,
    pub auto_install_on_quit: AtomicBool,
    downloaded_file: Mutex<Option<PathBuf>>,
    latest: Mutex<Option<UpdateMeta>>,
}

#[derive(Clone, Debug)]
pub struct UpdateMeta {
    version: String,
    release_date: String,
    file_url: String,
    file_name: String,
    sha512_b64: Option<String>,
    feed: String,
    release_notes: Option<String>,
    /// electron-builder rollout gate; `Some(0)` is the team's hard "halt this release" switch.
    staging_percentage: Option<u8>,
}

impl UpdaterState {
    pub fn new() -> Self {
        UpdaterState {
            is_manual_check: AtomicBool::new(false),
            cancel: AtomicBool::new(false),
            downloading: AtomicBool::new(false),
            auto_install_on_quit: AtomicBool::new(false),
            downloaded_file: Mutex::new(None),
            latest: Mutex::new(None),
        }
    }
}

fn emit(app: &AppHandle, channel: &str, payload: Value) {
    let _ = app.emit(&format!("desktop://{channel}"), payload);
}

fn feed_url(app: &AppHandle) -> String {
    if let Ok(url) = std::env::var("TREZOR_UPDATER_URL") {
        if !url.is_empty() {
            return url;
        }
    }
    let store = app.state::<crate::store::Store>();
    let allow_prerelease = store
        .update_settings()
        .get("allowPrerelease")
        .and_then(|v| v.as_bool())
        .unwrap_or(false);
    (if allow_prerelease { FEED_PRERELEASE } else { FEED_LATEST }).to_string()
}

fn platform_yml() -> &'static str {
    #[cfg(target_os = "macos")]
    return "latest-mac.yml";
    #[cfg(target_os = "linux")]
    return "latest-linux.yml";
    #[cfg(target_os = "windows")]
    return "latest.yml";
}

/// Installer extension we can hand to the OS (electron-updater's in-place formats differ).
fn preferred_extension() -> &'static str {
    #[cfg(target_os = "macos")]
    return ".dmg";
    #[cfg(target_os = "linux")]
    return ".AppImage";
    #[cfg(target_os = "windows")]
    return ".exe";
}

/// URL substrings identifying the running CPU architecture in electron-builder artifact names
/// (mac uses `-arm64`/`-x64`, linux uses `x86_64`/`arm64`). Used to pick the right artifact — the
/// feed lists multiple arches and a naive first-match would hand an x64 installer to arm64 users.
fn arch_tokens() -> &'static [&'static str] {
    #[cfg(target_arch = "aarch64")]
    {
        return &["arm64", "aarch64"];
    }
    #[cfg(target_arch = "x86_64")]
    {
        return &["x64", "x86_64", "amd64"];
    }
    #[cfg(not(any(target_arch = "aarch64", target_arch = "x86_64")))]
    {
        return &[];
    }
}

fn parse_semverish(v: &str) -> (u64, u64, u64, bool) {
    let core = v.split('-').next().unwrap_or(v);
    let has_pre = v.contains('-');
    let mut parts = core.split('.').map(|p| p.parse::<u64>().unwrap_or(0));
    (
        parts.next().unwrap_or(0),
        parts.next().unwrap_or(0),
        parts.next().unwrap_or(0),
        has_pre,
    )
}

fn is_newer(candidate: &str, current: &str) -> bool {
    let (ca, cb, cc, c_pre) = parse_semverish(candidate);
    let (ua, ub, uc, u_pre) = parse_semverish(current);
    if (ca, cb, cc) != (ua, ub, uc) {
        return (ca, cb, cc) > (ua, ub, uc);
    }
    // same core: a stable release is newer than the running prerelease
    u_pre && !c_pre
}

/// Minimal parse of an electron-builder `latest*.yml` (avoids a YAML dependency): extracts
/// `version:`, `releaseDate:` and the `url:`/`sha512:` pairs from the `files:` list.
fn parse_feed_yml(yml: &str, feed: &str) -> Option<UpdateMeta> {
    let mut version = None;
    let mut release_date = None;
    let mut files: Vec<(String, Option<String>)> = vec![];
    let mut last_url: Option<String> = None;

    let mut release_notes: Option<String> = None;
    let mut staging_percentage: Option<u8> = None;

    for line in yml.lines() {
        let trimmed = line.trim();
        if let Some(v) = trimmed.strip_prefix("version:") {
            version = Some(v.trim().trim_matches(['\'', '"']).to_string());
        } else if let Some(v) = trimmed.strip_prefix("releaseDate:") {
            release_date = Some(v.trim().trim_matches(['\'', '"']).to_string());
        } else if let Some(v) = trimmed.strip_prefix("releaseNotes:") {
            let v = v.trim().trim_matches(['\'', '"']).to_string();
            if !v.is_empty() {
                release_notes = Some(v);
            }
        } else if let Some(v) = trimmed.strip_prefix("stagingPercentage:") {
            staging_percentage = v.trim().parse::<u8>().ok();
        } else if let Some(v) = trimmed.strip_prefix("- url:") {
            if let Some(url) = last_url.take() {
                files.push((url, None));
            }
            last_url = Some(v.trim().trim_matches(['\'', '"']).to_string());
        } else if let Some(v) = trimmed.strip_prefix("sha512:") {
            if let Some(url) = last_url.take() {
                files.push((url, Some(v.trim().trim_matches(['\'', '"']).to_string())));
            }
        }
    }
    if let Some(url) = last_url.take() {
        files.push((url, None));
    }

    let version = version?;
    let ext = preferred_extension();
    let tokens = arch_tokens();
    // Prefer the artifact matching BOTH our extension AND our CPU architecture; then any file with
    // the extension; then anything. Without the arch filter the first `.dmg` is the x64 build, which
    // would be handed to arm64 users (sha512/PGP would still validate the wrong-arch file).
    let (file_name, sha512_b64) = files
        .iter()
        .find(|(u, _)| u.ends_with(ext) && tokens.iter().any(|t| u.contains(t)))
        .or_else(|| files.iter().find(|(u, _)| u.ends_with(ext)))
        .or_else(|| files.first())?
        .clone();

    Some(UpdateMeta {
        version,
        release_date: release_date.unwrap_or_default(),
        file_url: format!("{}/{}", feed.trim_end_matches('/'), file_name),
        file_name,
        sha512_b64,
        feed: feed.to_string(),
        release_notes,
        staging_percentage,
    })
}

/// Stable [0,100) rollout bucket for this install, derived from a persisted random GUID (so a
/// staged rollout is deterministic per machine across launches — electron-updater does the same).
fn install_rollout_bucket(store: &crate::store::Store) -> u32 {
    let settings = store.update_settings();
    let guid = match settings.get("installGuid").and_then(|v| v.as_str()) {
        Some(g) if !g.is_empty() => g.to_string(),
        _ => {
            let g = crate::new_token();
            store.set_update_settings(&json!({ "installGuid": g }));
            g
        }
    };
    // FNV-1a hash of the GUID → bucket. Stable and uniform enough for rollout gating.
    let mut hash: u64 = 0xcbf2_9ce4_8422_2325;
    for b in guid.as_bytes() {
        hash ^= *b as u64;
        hash = hash.wrapping_mul(0x0000_0100_0000_01b3);
    }
    (hash % 100) as u32
}

fn http_client(app: &AppHandle) -> reqwest::Client {
    let mut builder = reqwest::Client::builder();
    // route updater traffic through Tor when it is enabled (Electron includes the updater
    // session in the Tor proxy)
    if let Some(proxy_url) = crate::tor::active_socks_url(app) {
        if let Ok(proxy) = reqwest::Proxy::all(&proxy_url) {
            builder = builder.proxy(proxy);
        }
    }
    builder.build().unwrap_or_default()
}

/// `update/check` — fetch the feed metadata and emit available/not-available.
pub fn check(app: &AppHandle, is_manual: bool) {
    let state = app.state::<UpdaterState>();
    if is_manual {
        state.is_manual_check.store(true, Ordering::SeqCst);
    }
    let app = app.clone();
    tauri::async_runtime::spawn(async move {
        emit(&app, "update/checking", Value::Null);

        let feed = feed_url(&app);
        let yml_url = format!("{}/{}", feed.trim_end_matches('/'), platform_yml());
        let result = async {
            let resp = http_client(&app).get(&yml_url).send().await.ok()?;
            if !resp.status().is_success() {
                return None;
            }
            let text = resp.text().await.ok()?;
            parse_feed_yml(&text, &feed)
        }
        .await;

        let state = app.state::<UpdaterState>();
        let is_manual = state.is_manual_check.swap(false, Ordering::SeqCst);
        let Some(meta) = result else {
            log::error!("updater: failed to fetch/parse feed {yml_url}");
            emit(&app, "update/error", Value::Null);
            return;
        };

        let current = app.package_info().version.to_string();
        let store = app.state::<crate::store::Store>();
        let allow_prerelease = store
            .update_settings()
            .get("allowPrerelease")
            .and_then(|v| v.as_bool())
            .unwrap_or(false);

        // rollout gate (electron-updater isUserWithinRollout): stagingPercentage 0 is the hard halt
        // (a bad release the team pulled) — honour it even for manual checks; for 1..=99 gate
        // non-manual checks to a stable per-install bucket so a staged rollout doesn't hit everyone.
        let within_rollout = match meta.staging_percentage {
            Some(0) => false,
            Some(p) if p < 100 && !is_manual => install_rollout_bucket(&store) < p as u32,
            _ => true,
        };

        if is_newer(&meta.version, &current) && within_rollout {
            log::info!("updater: update available {} (current {current})", meta.version);
            emit(
                &app,
                "update/available",
                json!({
                    "version": meta.version,
                    "releaseDate": meta.release_date,
                    "isManualCheck": is_manual,
                    "prerelease": allow_prerelease,
                    "changelog": meta.release_notes,
                }),
            );
            *state.latest.lock().unwrap() = Some(meta);

            let automatic = store
                .update_settings()
                .get("isAutomaticUpdateEnabled")
                .and_then(|v| v.as_bool())
                .unwrap_or(false);
            if automatic {
                download(&app);
            }
        } else if is_newer(&meta.version, &current) {
            log::info!(
                "updater: {} available but outside rollout (staging {:?}) — not offering",
                meta.version,
                meta.staging_percentage
            );
            emit(
                &app,
                "update/not-available",
                json!({
                    "version": current,
                    "releaseDate": meta.release_date,
                    "isManualCheck": is_manual,
                }),
            );
        } else {
            log::info!("updater: no update ({} <= {current})", meta.version);
            emit(
                &app,
                "update/not-available",
                json!({
                    "version": meta.version,
                    "releaseDate": meta.release_date,
                    "isManualCheck": is_manual,
                }),
            );
            *state.latest.lock().unwrap() = Some(meta);
        }
    });
}

/// `update/download` — stream the installer with progress, then verify sha512 + PGP signature.
pub fn download(app: &AppHandle) {
    let state = app.state::<UpdaterState>();
    if state.downloading.swap(true, Ordering::SeqCst) {
        return; // already downloading
    }
    state.cancel.store(false, Ordering::SeqCst);
    let Some(meta) = state.latest.lock().unwrap().clone() else {
        state.downloading.store(false, Ordering::SeqCst);
        emit(app, "update/error", Value::Null);
        return;
    };

    let app = app.clone();
    tauri::async_runtime::spawn(async move {
        emit(
            &app,
            "update/downloading",
            json!({ "percent": 0, "bytesPerSecond": 0, "total": 0, "transferred": 0 }),
        );

        let result = download_and_verify(&app, &meta).await;
        let state = app.state::<UpdaterState>();
        state.downloading.store(false, Ordering::SeqCst);

        match result {
            Ok(path) => {
                *state.downloaded_file.lock().unwrap() = Some(path.clone());
                log::info!("updater: downloaded + verified {}", path.display());
                emit(
                    &app,
                    "update/downloaded",
                    json!({
                        "version": meta.version,
                        "releaseDate": meta.release_date,
                        "downloadedFile": path.to_string_lossy(),
                    }),
                );
            }
            Err(Cancelled) => {
                log::info!("updater: download cancelled");
                // Electron emits no dedicated event on cancel; the renderer initiated it.
            }
            Err(Failed(e)) => {
                log::error!("updater: {e}");
                emit(&app, "update/error", Value::Null);
            }
        }
    });
}

use DownloadError::{Cancelled, Failed};
enum DownloadError {
    Cancelled,
    Failed(String),
}

async fn download_and_verify(app: &AppHandle, meta: &UpdateMeta) -> Result<PathBuf, DownloadError> {
    use futures_util::StreamExt;

    let dir = app
        .path()
        .app_cache_dir()
        .map_err(|e| Failed(format!("no cache dir: {e}")))?
        .join("updates");
    std::fs::create_dir_all(&dir).map_err(|e| Failed(e.to_string()))?;
    let target = dir.join(&meta.file_name);

    let resp = http_client(app)
        .get(&meta.file_url)
        .send()
        .await
        .map_err(|e| Failed(format!("download failed: {e}")))?;
    if !resp.status().is_success() {
        return Err(Failed(format!("download failed: HTTP {}", resp.status())));
    }
    let total = resp.content_length().unwrap_or(0);

    let mut file = std::fs::File::create(&target).map_err(|e| Failed(e.to_string()))?;
    let mut hasher = Sha512::new();
    let mut transferred: u64 = 0;
    let started = std::time::Instant::now();
    let mut last_emit = std::time::Instant::now();
    let mut stream = resp.bytes_stream();

    let state = app.state::<UpdaterState>();
    while let Some(chunk) = stream.next().await {
        if state.cancel.load(Ordering::SeqCst) {
            drop(file);
            let _ = std::fs::remove_file(&target);
            return Err(Cancelled);
        }
        let chunk = chunk.map_err(|e| Failed(format!("download stream: {e}")))?;
        file.write_all(&chunk).map_err(|e| Failed(e.to_string()))?;
        hasher.update(&chunk);
        transferred += chunk.len() as u64;

        if last_emit.elapsed().as_millis() > 400 {
            last_emit = std::time::Instant::now();
            let elapsed = started.elapsed().as_secs_f64().max(0.001);
            emit(
                app,
                "update/downloading",
                json!({
                    "total": total,
                    "transferred": transferred,
                    "percent": if total > 0 { transferred as f64 / total as f64 * 100.0 } else { 0.0 },
                    "bytesPerSecond": (transferred as f64 / elapsed) as u64,
                    "delta": chunk.len(),
                }),
            );
        }
    }
    file.flush().map_err(|e| Failed(e.to_string()))?;
    drop(file);

    emit(app, "update/downloading", json!({ "verifying": true }));

    // sha512 from the feed metadata (base64, like electron-updater)
    if let Some(expected_b64) = &meta.sha512_b64 {
        let digest = hasher.finalize();
        let actual_b64 = base64_encode(&digest);
        if &actual_b64 != expected_b64 {
            let _ = std::fs::remove_file(&target);
            return Err(Failed("sha512 mismatch".into()));
        }
    }

    // detached OpenPGP signature next to the installer on the feed
    let sig_url = format!("{}/{}.asc", meta.feed.trim_end_matches('/'), meta.file_name);
    let sig_text = http_client(app)
        .get(&sig_url)
        .timeout(std::time::Duration::from_secs(10))
        .send()
        .await
        .ok()
        .filter(|r| r.status().is_success());
    let Some(sig_resp) = sig_text else {
        let _ = std::fs::remove_file(&target);
        return Err(Failed(format!("signature file not available: {sig_url}")));
    };
    let armored_sig = sig_resp
        .text()
        .await
        .map_err(|e| Failed(format!("signature fetch: {e}")))?;

    let data = std::fs::read(&target).map_err(|e| Failed(e.to_string()))?;
    verify_pgp(&armored_sig, &data).map_err(|e| {
        let _ = std::fs::remove_file(&target);
        Failed(format!("signature check failed: {e}"))
    })?;

    Ok(target)
}

fn verify_pgp(armored_sig: &str, data: &[u8]) -> Result<(), String> {
    let (key, _) = SignedPublicKey::from_string(APP_PUBKEY).map_err(|e| e.to_string())?;
    let (sig, _) = StandaloneSignature::from_string(armored_sig).map_err(|e| e.to_string())?;

    if sig.verify(&key, data).is_ok() {
        return Ok(());
    }
    for subkey in &key.public_subkeys {
        if sig.verify(subkey, data).is_ok() {
            return Ok(());
        }
    }
    Err("invalid signature".into())
}

fn base64_encode(data: &[u8]) -> String {
    const CHARS: &[u8] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    let mut out = String::with_capacity(data.len().div_ceil(3) * 4);
    for chunk in data.chunks(3) {
        let b = [chunk[0], *chunk.get(1).unwrap_or(&0), *chunk.get(2).unwrap_or(&0)];
        let n = (u32::from(b[0]) << 16) | (u32::from(b[1]) << 8) | u32::from(b[2]);
        out.push(CHARS[(n >> 18 & 63) as usize] as char);
        out.push(CHARS[(n >> 12 & 63) as usize] as char);
        out.push(if chunk.len() > 1 { CHARS[(n >> 6 & 63) as usize] as char } else { '=' });
        out.push(if chunk.len() > 2 { CHARS[(n & 63) as usize] as char } else { '=' });
    }
    out
}

/// `update/cancel`
pub fn cancel(app: &AppHandle) {
    app.state::<UpdaterState>().cancel.store(true, Ordering::SeqCst);
}

/// Open the verified downloaded installer (shared by `install` and install-on-quit).
fn open_installer(app: &AppHandle) -> bool {
    let state = app.state::<UpdaterState>();
    let file = state.downloaded_file.lock().unwrap().clone();
    let Some(file) = file else {
        return false;
    };
    #[cfg(target_os = "linux")]
    {
        use std::os::unix::fs::PermissionsExt;
        let _ = std::fs::set_permissions(&file, std::fs::Permissions::from_mode(0o755));
    }
    crate::user_data::open_path(&file).is_ok()
}

/// `update/install` — open the verified installer and quit (the closest Tauri equivalent of
/// electron-updater's quitAndInstall).
pub fn install(app: &AppHandle) {
    if open_installer(app) {
        app.exit(0);
    } else {
        emit(app, "update/error", Value::Null);
    }
}

/// On app exit, if the user chose "install on quit" and a verified update is downloaded, open the
/// installer (electron-updater autoInstallOnAppQuit parity).
pub fn install_on_quit_if_requested(app: &AppHandle) {
    if app
        .state::<UpdaterState>()
        .auto_install_on_quit
        .load(Ordering::SeqCst)
    {
        if open_installer(app) {
            log::info!("updater: opened installer on quit");
        }
    }
}

/// `update/allow-prerelease` — persist + switch feed + echo to renderer.
pub fn allow_prerelease(app: &AppHandle, value: bool) {
    let store = app.state::<crate::store::Store>();
    store.set_update_settings(&json!({ "allowPrerelease": value }));
    emit(app, "update/allow-prerelease", json!(value));
}

/// `update/set-automatic-update-enabled` — persist + echo; when turned on, check right away.
pub fn set_automatic_update_enabled(app: &AppHandle, value: bool) {
    let store = app.state::<crate::store::Store>();
    store.set_update_settings(&json!({ "isAutomaticUpdateEnabled": value }));
    emit(app, "update/set-automatic-update-enabled", json!(value));
    let state = app.state::<UpdaterState>();
    if value {
        check(app, false);
    } else {
        state.auto_install_on_quit.store(false, Ordering::SeqCst);
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn semver_compare() {
        assert!(is_newer("26.9.0", "26.8.0"));
        assert!(is_newer("27.0.0", "26.8.0"));
        assert!(!is_newer("26.8.0", "26.8.0"));
        assert!(!is_newer("26.7.2", "26.8.0"));
        // a stable release supersedes the running prerelease of the same core version
        assert!(is_newer("26.8.0", "26.8.0-beta"));
        assert!(!is_newer("26.8.0-beta", "26.8.0"));
    }

    #[test]
    fn parse_latest_mac_yml() {
        // shape of a real electron-builder latest-mac.yml
        let yml = "\
version: 26.8.0
files:
  - url: Trezor-Suite-26.8.0-mac-arm64.dmg
    sha512: abc123==
    size: 123
  - url: Trezor-Suite-26.8.0-mac-arm64.zip
    sha512: def456==
    size: 456
path: Trezor-Suite-26.8.0-mac-arm64.dmg
releaseDate: '2026-07-01T00:00:00.000Z'
";
        let meta = parse_feed_yml(yml, "https://data.trezor.io/suite/releases/desktop/latest")
            .expect("parse");
        assert_eq!(meta.version, "26.8.0");
        assert_eq!(meta.file_name, "Trezor-Suite-26.8.0-mac-arm64.dmg");
        assert_eq!(meta.sha512_b64.as_deref(), Some("abc123=="));
        assert_eq!(meta.release_date, "2026-07-01T00:00:00.000Z");
        assert!(meta.file_url.ends_with("/Trezor-Suite-26.8.0-mac-arm64.dmg"));
    }

    #[test]
    fn base64_matches_known_vector() {
        // "hello" → aGVsbG8=
        assert_eq!(base64_encode(b"hello"), "aGVsbG8=");
        assert_eq!(base64_encode(b""), "");
        assert_eq!(base64_encode(b"f"), "Zg==");
    }
}

/// handshake `desktopUpdate` payload (allowPrerelease, isAutomaticUpdateEnabled, firstRun).
pub fn handshake_payload(app: &AppHandle) -> Value {
    let store = app.state::<crate::store::Store>();
    let settings = store.update_settings();
    let current = app.package_info().version.to_string();
    let saved = settings
        .get("savedCurrentVersion")
        .and_then(|v| v.as_str())
        .map(|s| s.to_string());
    store.set_update_settings(&json!({ "savedCurrentVersion": current }));

    let first_run = match saved {
        Some(prev) if prev != current => Some(current.clone()),
        _ => None,
    };
    json!({
        "allowPrerelease": settings.get("allowPrerelease").and_then(|v| v.as_bool()).unwrap_or(false),
        "isAutomaticUpdateEnabled": settings.get("isAutomaticUpdateEnabled").and_then(|v| v.as_bool()).unwrap_or(false),
        "firstRun": first_run,
    })
}
