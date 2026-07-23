//! Tor — Tauri equivalent of Electron `suite-desktop-core/src/modules/tor.ts` +
//! `libs/processes/TorProcess.ts`.
//!
//! Manages a bundled/system `tor` process (SocksPort + DataDirectory in the app data dir), parses
//! bootstrap progress from its stdout into `tor/bootstrap` events, reports `tor/status`
//! (Enabled/Disabled/Enabling/Disabling), supports the external-Tor mode (user-managed daemon,
//! fake bootstrap progress like Electron), and persists settings in the store.
//!
//! Proxy wiring differs from Electron by platform necessity: Electron flips the Chromium session
//! proxy at runtime; WKWebView/WebKitGTK can only receive a proxy when the webview is created, so
//! after Tor bootstraps the main window is recreated with `proxy_url` (one in-app reload).

use serde_json::{json, Value};
use std::io::BufRead;
use std::process::{Child, Command, Stdio};
use std::sync::atomic::{AtomicU8, Ordering};
use std::sync::{Arc, Mutex};
use tauri::{AppHandle, Emitter, Manager};

pub struct TorState {
    child: Mutex<Option<Child>>,
    bootstrap_progress: Arc<AtomicU8>,
    /// serializes `toggle()` so two concurrent invocations can't both spawn (and orphan) a daemon
    toggling: std::sync::atomic::AtomicBool,
}

impl TorState {
    pub fn new() -> Self {
        TorState {
            child: Mutex::new(None),
            bootstrap_progress: Arc::new(AtomicU8::new(0)),
            toggling: std::sync::atomic::AtomicBool::new(false),
        }
    }
}

fn emit(app: &AppHandle, channel: &str, payload: Value) {
    let _ = app.emit(&format!("desktop://{channel}"), payload);
}

fn settings(app: &AppHandle) -> Value {
    app.state::<crate::store::Store>().tor_settings()
}

fn set_settings(app: &AppHandle, patch: Value) {
    app.state::<crate::store::Store>().set_tor_settings(&patch);
}

fn s_bool(v: &Value, key: &str) -> bool {
    v.get(key).and_then(|x| x.as_bool()).unwrap_or(false)
}

fn s_u16(v: &Value, key: &str, default: u16) -> u16 {
    v.get(key).and_then(|x| x.as_u64()).map(|n| n as u16).unwrap_or(default)
}

fn s_str<'a>(v: &'a Value, key: &str, default: &'a str) -> &'a str {
    v.get(key).and_then(|x| x.as_str()).unwrap_or(default)
}

/// socks5h URL when Tor is enabled — used for Rust-side HTTP (updater). `socks5h` (not `socks5`)
/// forces remote (proxy-side) DNS resolution inside Tor, so the feed hostname is never resolved on
/// the local/ISP resolver (no DNS leak) and .onion feeds work.
pub fn active_socks_url(app: &AppHandle) -> Option<String> {
    let s = settings(app);
    if !s_bool(&s, "running") {
        return None;
    }
    let host = s_str(&s, "host", "127.0.0.1").to_string();
    let port = if s_bool(&s, "useExternalTor") {
        s_u16(&s, "externalPort", 9050)
    } else {
        s_u16(&s, "port", 9050)
    };
    Some(format!("socks5h://{host}:{port}"))
}

fn service_up(host: &str, port: u16) -> bool {
    let addr = format!("{host}:{port}");
    std::net::TcpStream::connect_timeout(
        &addr.parse().unwrap_or_else(|_| "127.0.0.1:9050".parse().unwrap()),
        std::time::Duration::from_millis(700),
    )
    .is_ok()
}

/// Async wrapper for the blocking connectivity probe so we never park a tokio worker thread from
/// inside the async `toggle` command handler.
async fn service_up_async(host: String, port: u16) -> bool {
    tauri::async_runtime::spawn_blocking(move || service_up(&host, port))
        .await
        .unwrap_or(false)
}

fn process_running(state: &TorState) -> bool {
    let mut guard = state.child.lock().unwrap();
    if let Some(child) = guard.as_mut() {
        match child.try_wait() {
            Ok(None) => true,
            _ => {
                *guard = None;
                false
            }
        }
    } else {
        false
    }
}

/// Mirrors Electron's handleTorProcessStatus: Disabled / Enabled (external or service ready) /
/// Enabling.
pub fn emit_status(app: &AppHandle, state: &TorState) {
    let s = settings(app);
    let should_enable = s_bool(&s, "running");
    let use_external = s_bool(&s, "useExternalTor");
    let host = s_str(&s, "host", "127.0.0.1");
    let port = if use_external {
        s_u16(&s, "externalPort", 9050)
    } else {
        s_u16(&s, "port", 9050)
    };

    let status_type = if !should_enable {
        "Disabled"
    } else if use_external || (process_running(state) && service_up(host, port)) {
        "Enabled"
    } else {
        "Enabling"
    };
    emit(app, "tor/status", json!({ "type": status_type }));
}

/// Locate the tor binary: env override → bundled resource → repo (dev) → PATH.
fn resolve_tor_binary(app: &AppHandle) -> Option<String> {
    if let Ok(bin) = std::env::var("TREZOR_TOR_BIN") {
        if !bin.is_empty() && std::path::Path::new(&bin).exists() {
            return Some(bin);
        }
    }
    if let Ok(res) = app.path().resource_dir() {
        let bundled = res.join("tor").join(if cfg!(windows) { "tor.exe" } else { "tor" });
        if bundled.exists() {
            return Some(bundled.to_string_lossy().into_owned());
        }
    }
    // dev: the same binaries the Electron build bundles (git LFS)
    let plat = match (std::env::consts::OS, std::env::consts::ARCH) {
        ("macos", "aarch64") => "mac-arm64",
        ("macos", _) => "mac-x64",
        ("linux", "aarch64") => "linux-arm64",
        ("linux", _) => "linux-x64",
        _ => "win-x64",
    };
    let dev = format!(
        "{}/../../suite-data/files/bin/tor/{}/tor{}",
        env!("CARGO_MANIFEST_DIR"),
        plat,
        if cfg!(windows) { ".exe" } else { "" }
    );
    if std::path::Path::new(&dev).exists() {
        return Some(dev);
    }
    // system tor
    if Command::new("tor").arg("--version").output().map(|o| o.status.success()).unwrap_or(false) {
        return Some("tor".into());
    }
    None
}

fn free_port() -> u16 {
    std::net::TcpListener::bind("127.0.0.1:0")
        .and_then(|l| l.local_addr())
        .map(|a| a.port())
        .unwrap_or(0)
}

fn spawn_tor(app: &AppHandle, state: &TorState) -> Result<(), String> {
    let bin = resolve_tor_binary(app).ok_or("tor binary not found")?;

    let data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?
        .join("tor");
    std::fs::create_dir_all(&data_dir).map_err(|e| e.to_string())?;

    let port = free_port();
    let control_port = free_port();
    if port == 0 || control_port == 0 {
        return Err("no free port".into());
    }
    set_settings(
        app,
        json!({
            "port": port,
            "controlPort": control_port,
            "torDataDir": data_dir.to_string_lossy(),
        }),
    );

    // kill any previous daemon before spawning so we never overwrite (and orphan) a live child
    stop(state);

    log::info!("tor: spawning {bin} (socks :{port})");
    let mut command = Command::new(&bin);
    command
        .args([
            "--SocksPort",
            &format!("127.0.0.1:{port}"),
            "--ControlPort",
            &format!("127.0.0.1:{control_port}"),
            "--CookieAuthentication",
            "1",
            "--DataDirectory",
            &data_dir.to_string_lossy(),
            "--Log",
            "notice stdout",
        ])
        .stdout(Stdio::piped())
        .stderr(Stdio::null());
    let mut child = crate::proc::harden_keep_stdout(&mut command)
        .spawn()
        .map_err(|e| format!("failed to spawn tor: {e}"))?;

    // parse "Bootstrapped NN% (tag): summary" lines into tor/bootstrap progress events
    state.bootstrap_progress.store(0, Ordering::SeqCst);
    if let Some(stdout) = child.stdout.take() {
        let app = app.clone();
        let progress_flag = state.bootstrap_progress.clone();
        std::thread::spawn(move || {
            let reader = std::io::BufReader::new(stdout);
            for line in reader.lines().map_while(Result::ok) {
                if let Some(idx) = line.find("Bootstrapped ") {
                    let rest = &line[idx + "Bootstrapped ".len()..];
                    let percent: u8 = rest
                        .split('%')
                        .next()
                        .and_then(|p| p.trim().parse().ok())
                        .unwrap_or(0);
                    let summary = rest.split(": ").nth(1).unwrap_or("").to_string();
                    log::info!("tor: bootstrap {percent}% {summary}");
                    progress_flag.store(percent, Ordering::SeqCst);
                    emit(
                        &app,
                        "tor/bootstrap",
                        json!({
                            "type": "progress",
                            "summary": summary,
                            "progress": { "current": percent, "total": 100 },
                        }),
                    );
                }
            }
        });
    }

    *state.child.lock().unwrap() = Some(child);
    Ok(())
}

pub fn stop(state: &TorState) {
    if let Some(mut child) = state.child.lock().unwrap().take() {
        let _ = child.kill();
        let _ = child.wait();
    }
}

/// Deliver a bootstrap-to-100% event for the "tor already running" fast path (see `toggle`).
///
/// The frontend `TorLoader` (both the settings `tor-loading` modal and the boot `TorLoadingScreen`)
/// only dismisses when it receives a `tor/bootstrap` `progress` event with `current == total`;
/// `tor/status = Enabled` alone does NOT close it. When Tor is already bootstrapped — which on macOS
/// happens right after enabling, because applying the proxy recreates the webview, and the reloaded
/// page re-enables the now-already-running daemon — the fast path emits no stdout bootstrap lines, so
/// without this the modal/boot screen would hang forever at 0%.
///
/// Emitted several times over ~1s because the reloaded page mounts its `tor/bootstrap` listener a
/// tick after it fires the `tor/toggle` invoke; a single immediate emit could lose the race, so we
/// repeat until the freshly-mounted listener is guaranteed to have caught a 100% event.
fn emit_bootstrap_complete(app: AppHandle) {
    tauri::async_runtime::spawn(async move {
        for i in 0..5 {
            emit(
                &app,
                "tor/bootstrap",
                json!({
                    "type": "progress",
                    "summary": "Done",
                    "progress": { "current": 100, "total": 100 },
                }),
            );
            if i < 4 {
                tokio::time::sleep(std::time::Duration::from_millis(250)).await;
            }
        }
    });
}

/// Fake bootstrap progress for external Tor (Electron createFakeBootstrapProcess: 3s / 300ms).
fn fake_bootstrap(app: AppHandle) {
    tauri::async_runtime::spawn(async move {
        let mut progress = 0u32;
        while progress < 100 {
            progress = (progress + 10).min(100);
            emit(
                &app,
                "tor/bootstrap",
                json!({
                    "type": "progress",
                    "summary": "Using External Tor fake progress",
                    "progress": { "current": progress, "total": 100 },
                }),
            );
            tokio::time::sleep(std::time::Duration::from_millis(300)).await;
        }
    });
}

/// RAII guard that clears TorState::toggling on drop (all `toggle` return paths).
struct ToggleGuard(AppHandle);
impl Drop for ToggleGuard {
    fn drop(&mut self) {
        self.0
            .state::<TorState>()
            .toggling
            .store(false, Ordering::SeqCst);
    }
}

/// `tor/toggle` — the async heart of the module.
pub async fn toggle(app: AppHandle, should_enable: bool) -> Value {
    // Serialize concurrent ENABLES (renderer double-toggle / loader race) so two invocations can't
    // both spawn a daemon and orphan one. A DISABLE is always honored — even mid-enable, when the
    // user cancels the enabling loader — because it calls stop(), which kills the daemon so the
    // in-flight enable's wait loop sees the process die and bails with FAILED_TO_ENABLE_TOR.
    // Otherwise a cancel was rejected with TOGGLE_IN_PROGRESS and Tor force-enabled anyway.
    let _guard = if should_enable {
        if app.state::<TorState>().toggling.swap(true, Ordering::SeqCst) {
            log::warn!("tor: toggle already in progress; ignoring");
            return json!({ "success": false, "error": "TOGGLE_IN_PROGRESS" });
        }
        Some(ToggleGuard(app.clone()))
    } else {
        None
    };

    log::info!("tor: toggling {}", if should_enable { "ON" } else { "OFF" });
    set_settings(&app, json!({ "running": should_enable }));

    if !should_enable {
        emit(&app, "tor/status", json!({ "type": "Disabling" }));
        {
            let state = app.state::<TorState>();
            stop(&state);
        }
        let state = app.state::<TorState>();
        emit_status(&app, &state);
        crate::window::apply_proxy(&app, None);
        return json!({ "success": true });
    }

    let s = settings(&app);
    let use_external = s_bool(&s, "useExternalTor");
    let host = s_str(&s, "host", "127.0.0.1").to_string();

    if use_external {
        let port = s_u16(&s, "externalPort", 9050);
        set_settings(&app, json!({ "port": port }));
        if !service_up_async(host.clone(), port).await {
            emit(
                &app,
                "tor/bootstrap",
                json!({ "type": "error", "message": format!("external Tor not reachable on {host}:{port}") }),
            );
            return json!({ "success": false, "error": "FAILED_TO_ENABLE_TOR" });
        }
        fake_bootstrap(app.clone());
        {
            let state = app.state::<TorState>();
            emit_status(&app, &state);
        }
        apply_forwarder_proxy(&app, &host, port).await;
        return json!({ "success": true });
    }

    // bundled tor: reuse a live process, otherwise spawn and wait for bootstrap
    let mut port = s_u16(&s, "port", 9050);
    let already_up = {
        let running = process_running(&app.state::<TorState>());
        running && service_up_async(host.clone(), port).await
    };
    if !already_up {
        let spawn_result = {
            let state = app.state::<TorState>();
            emit(&app, "tor/status", json!({ "type": "Enabling" }));
            spawn_tor(&app, &state)
        };
        if let Err(e) = spawn_result {
            log::error!("tor: {e}");
            emit(&app, "tor/bootstrap", json!({ "type": "error", "message": e }));
            return json!({ "success": false, "error": "FAILED_TO_ENABLE_TOR" });
        }
        // spawn_tor picked a fresh free port; probe that one, not the pre-spawn value
        port = s_u16(&settings(&app), "port", 9050);

        // wait for the SOCKS service; report 'slow' after 30s like the request-manager does
        let started = std::time::Instant::now();
        let mut reported_slow = false;
        loop {
            let progress = {
                let state = app.state::<TorState>();
                state.bootstrap_progress.load(Ordering::SeqCst)
            };
            if progress >= 100 && service_up_async(host.clone(), port).await {
                break;
            }
            let alive = {
                let state = app.state::<TorState>();
                process_running(&state)
            };
            if !alive {
                emit(
                    &app,
                    "tor/bootstrap",
                    json!({ "type": "error", "message": "tor process exited during bootstrap" }),
                );
                return json!({ "success": false, "error": "FAILED_TO_ENABLE_TOR" });
            }
            if !reported_slow && started.elapsed().as_secs() > 30 {
                reported_slow = true;
                emit(&app, "tor/bootstrap", json!({ "type": "slow" }));
            }
            if started.elapsed().as_secs() > 180 {
                let state = app.state::<TorState>();
                stop(&state);
                emit(
                    &app,
                    "tor/bootstrap",
                    json!({ "type": "error", "message": "tor bootstrap timed out" }),
                );
                return json!({ "success": false, "error": "FAILED_TO_ENABLE_TOR" });
            }
            tokio::time::sleep(std::time::Duration::from_millis(400)).await;
        }
    } else {
        // Tor is already bootstrapped (typically: the proxy webview-recreate reloaded the page and
        // the reloaded app re-enabled the already-running daemon). No stdout bootstrap lines will be
        // produced, so synthesize the 100% event the frontend TorLoader needs to dismiss.
        emit_bootstrap_complete(app.clone());
    }

    {
        let state = app.state::<TorState>();
        emit_status(&app, &state);
    }
    apply_forwarder_proxy(&app, &host, port).await;
    json!({ "success": true })
}

/// Route the webview through the loopback-bypassing forwarder (see `tor_proxy.rs`) which tunnels
/// non-local traffic into the Tor SOCKS port.
async fn apply_forwarder_proxy(app: &AppHandle, host: &str, socks_port: u16) {
    match crate::tor_proxy::ensure_running(format!("{host}:{socks_port}")).await {
        Ok(forwarder_port) => {
            crate::window::apply_proxy(app, Some(format!("http://127.0.0.1:{forwarder_port}")));
        }
        Err(e) => log::error!("tor: failed to start proxy forwarder: {e}"),
    }
}

/// `tor/change-settings`
pub fn change_settings(app: &AppHandle, payload: &Value) -> Value {
    let use_external = s_bool(payload, "useExternalTor");
    let external_port = s_u16(payload, "externalPort", 9050);
    set_settings(
        app,
        json!({ "useExternalTor": use_external, "externalPort": external_port }),
    );
    emit(app, "tor/settings", settings(app));
    json!({ "success": true })
}

/// `tor/get-settings`
pub fn get_settings(app: &AppHandle) -> Value {
    json!({ "success": true, "payload": settings(app) })
}

/// `tor/get-status` (send) — recompute + emit.
pub fn get_status(app: &AppHandle) {
    let state = app.state::<TorState>();
    emit_status(app, &state);
}

/// True when THIS process is already running its own bootstrapped tor daemon.
///
/// Used by the `handshake/load-tor-module` handler: applying the Tor proxy recreates the webview
/// (macOS/Linux can't switch a live webview's proxy), which reloads the SPA — but the Rust backend
/// and its tor child survive that reload. Without this, the reloaded page would re-run the boot
/// `TorLoadingScreen` and re-enable an already-running daemon, hanging on a loader that never gets a
/// fresh bootstrap. Reporting "already running" lets the reloaded page skip the redundant loader;
/// `useTor` then seeds `Enabled` via `tor/get-status`.
///
/// External Tor is intentionally excluded: it has no child here and still needs its forwarder proxy
/// applied on each fresh page load, so it must keep going through the normal enable path.
pub fn is_running(app: &AppHandle) -> bool {
    let s = settings(app);
    if s_bool(&s, "useExternalTor") {
        return false;
    }
    let state = app.state::<TorState>();
    let host = s_str(&s, "host", "127.0.0.1");
    let port = s_u16(&s, "port", 9050);
    process_running(&state) && service_up(host, port)
}
