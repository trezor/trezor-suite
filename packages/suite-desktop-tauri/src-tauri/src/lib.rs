mod auto_start;
mod bluetooth;
mod bluetooth_host;
mod bridge;
mod bridge_server;
mod connect_ws;
mod external_links;
mod http_receiver;
#[cfg(target_os = "macos")]
mod macos;
mod menu;
mod proc;
mod safe_storage;
mod store;
mod tor;
mod tor_proxy;
mod tray;
mod updater;
mod user_data;
mod window;

use serde_json::{json, Value};
use std::fs;
use std::path::PathBuf;
use std::sync::OnceLock;
use tauri::{AppHandle, Emitter, Manager, RunEvent, WindowEvent};
use tauri_plugin_deep_link::DeepLinkExt;

/// Per-launch shared secret authenticating the preload's `window.ipcProxy` WebSocket to the
/// bluetooth-host sidecar (so an arbitrary local process can't drive the BLE stack). Generated
/// once, handed to the sidecar via env and to the preload via the `bluetooth_token` command.
static BLUETOOTH_TOKEN: OnceLock<String> = OnceLock::new();

pub fn bluetooth_token() -> String {
    BLUETOOTH_TOKEN.get_or_init(new_token).clone()
}

/// The launch deep-link URL (cold-start custom protocol), consumed once by the first
/// `handshake/load-modules` (Electron `firstRunOnly`).
static LAUNCH_PROTOCOL_URL: OnceLock<std::sync::Mutex<Option<String>>> = OnceLock::new();

fn set_launch_protocol_url(url: String) {
    let slot = LAUNCH_PROTOCOL_URL.get_or_init(|| std::sync::Mutex::new(None));
    let mut guard = slot.lock().unwrap();
    if guard.is_none() {
        *guard = Some(url);
    }
}

fn take_launch_protocol_url() -> Option<String> {
    LAUNCH_PROTOCOL_URL
        .get_or_init(|| std::sync::Mutex::new(None))
        .lock()
        .unwrap()
        .take()
}

/// The preload fetches the per-launch bluetooth ipc-proxy token via this command.
#[tauri::command]
fn bluetooth_token_cmd() -> String {
    bluetooth_token()
}

/// Coordinates the "keep Suite running in the background?" prompt shown before quit on
/// Linux/Windows (Electron `promptForAutoStartBeforeQuit`).
struct AutoStartPrompt {
    /// resolves with the renderer's popup-response (`app/auto-start/popup-response`)
    pending: std::sync::Mutex<Option<tokio::sync::oneshot::Sender<String>>>,
    /// set once the user chose to quit, so the follow-up CloseRequested is allowed through
    /// (only read on the non-macOS before-quit path)
    #[cfg_attr(target_os = "macos", allow(dead_code))]
    quitting: std::sync::atomic::AtomicBool,
}

impl AutoStartPrompt {
    fn new() -> Self {
        AutoStartPrompt {
            pending: std::sync::Mutex::new(None),
            quitting: std::sync::atomic::AtomicBool::new(false),
        }
    }
}

/// Custom URI schemes the app handles (mirrors `suite-desktop/uriSchemes.json` — kept in sync
/// with `tauri.conf.json` `plugins.deep-link.desktop.schemes`).
const URI_SCHEMES: [&str; 11] = [
    "trezorsuite",
    "bitcoin",
    "litecoin",
    "bitcoincash",
    "bitcoingold",
    "dash",
    "digibyte",
    "dogecoin",
    "namecoin",
    "vertcoin",
    "zcash",
];

/// `<app_data_dir>/metadata` — where local metadata (labels) files live, mirroring the Electron
/// suite-desktop-core metadata module.
fn metadata_dir(app: &AppHandle) -> Option<PathBuf> {
    let dir = app.path().app_data_dir().ok()?.join("metadata");
    fs::create_dir_all(&dir).ok()?;
    Some(dir)
}

fn arg0<'a>(args: &'a Value, key: &str) -> Option<&'a str> {
    args.get(0)?.get(key)?.as_str()
}

/// Keep metadata filenames to a single path component (defence against path traversal).
fn sanitize_filename(name: &str) -> String {
    name.rsplit(['/', '\\']).next().unwrap_or(name).to_string()
}

/// Bridge for the frontend to report boot/diagnostic info back to the Rust side, so we can verify
/// (from the CLI/log) what the WKWebView actually rendered.
#[tauri::command]
fn tauri_report(kind: String, message: String) {
    // frontend-sourced strings: keep the high-signal boot/error kinds at info, but the periodic
    // 'tick'/'diag' heartbeats go to debug so they are not persisted to the on-disk info log.
    match kind.as_str() {
        "tick" | "diag" => log::debug!("[frontend] {kind}: {message}"),
        _ => log::info!("[frontend] {kind}: {message}"),
    }
    println!("TAURI_REPORT {kind}: {message}");
}

/// Emit a desktopApi event to the renderer (delivered to `desktopApi.on(channel, ...)` listeners,
/// which the preload wires to the Tauri event `desktop://<channel>`).
fn emit_desktop_event(app: &AppHandle, channel: &str, payload: Value) {
    let _ = app.emit(&format!("desktop://{channel}"), payload);
}

/// `--state.foo.bar=value` CLI args → nested state patch (Electron `processStatePatch`; the
/// returned object is the content *under* the `state` root).
fn process_state_patch() -> Value {
    let mut patch = json!({});
    for arg in std::env::args() {
        let Some(rest) = arg.strip_prefix("--state") else {
            continue;
        };
        let Some((path, raw)) = rest.split_once('=') else {
            continue;
        };
        let value: Value = serde_json::from_str(raw).unwrap_or_else(|_| json!(raw));
        // "--state={...}" patches the whole root; "--state.a.b=x" a nested key
        let keys: Vec<&str> = path.trim_start_matches('.').split('.').filter(|k| !k.is_empty()).collect();
        if keys.is_empty() {
            if let (Some(patch_obj), Some(value_obj)) = (patch.as_object_mut(), value.as_object()) {
                for (k, v) in value_obj {
                    patch_obj.insert(k.clone(), v.clone());
                }
            }
            continue;
        }
        let mut cursor = &mut patch;
        for (i, key) in keys.iter().enumerate() {
            if i == keys.len() - 1 {
                cursor[key] = value.clone();
            } else {
                if cursor.get(*key).map(|v| !v.is_object()).unwrap_or(true) {
                    cursor[key] = json!({});
                }
                cursor = cursor.get_mut(*key).unwrap();
            }
        }
    }
    patch
}

fn has_switch(name: &str) -> bool {
    let flag = format!("--{name}");
    std::env::args().any(|a| a == flag)
}

/// Channels whose args carry confidential/user data (labels, plaintext handed to safe-storage,
/// URLs) that must never be persisted to the on-disk log (root CLAUDE.md rule). We log only the
/// channel name for these.
fn channel_args_sensitive(channel: &str) -> bool {
    matches!(
        channel,
        "safe-storage/encrypt"
            | "safe-storage/decrypt"
            | "metadata/write"
            | "metadata/read"
            | "metadata/rename-file"
            | "metadata/get-files"
            | "system/open-settings"
            | "__external-link"
            | "handshake/client"
            | "bio-auth/validate-bio-auth"
    )
}

/// Log an IPC call without leaking confidential payloads.
fn log_ipc(kind: &str, channel: &str, args: &Value) {
    if channel_args_sensitive(channel) {
        log::info!("{kind} {channel} [args redacted]");
    } else {
        log::info!("{kind} {channel} {args}");
    }
}

/// Fire-and-forget desktopApi channel (mirrors ipcRenderer.send).
#[tauri::command]
fn desktop_send(app: AppHandle, channel: String, args: Value) {
    log_ipc("desktop_send", &channel, &args);
    let first = args.get(0).cloned().unwrap_or(Value::Null);
    let first_bool = first.as_bool().unwrap_or(false);
    match channel.as_str() {
        // window controls
        "app/restart" => window::restart(&app),
        "app/focus" => http_receiver::focus_main_window(&app),
        "app/hide" => window::hide(&app),
        "app/auto-start" => auto_start::set_enabled(first_bool),
        // store + theme
        "store/clear" => app.state::<store::Store>().clear(),
        "theme/change" => {
            if let Some(theme) = first.as_str() {
                window::set_theme(&app, theme);
            }
        }
        // tor
        "tor/get-status" => tor::get_status(&app),
        // auto-updater
        "update/check" => {
            let is_manual = first
                .get("isManual")
                .and_then(|v| v.as_bool())
                .unwrap_or(false);
            updater::check(&app, is_manual);
        }
        "update/download" => updater::download(&app),
        "update/install" => updater::install(&app),
        "update/cancel" => updater::cancel(&app),
        "update/allow-prerelease" => updater::allow_prerelease(&app, first.as_bool().unwrap_or(true)),
        "update/set-automatic-update-enabled" => {
            updater::set_automatic_update_enabled(&app, first.as_bool().unwrap_or(true))
        }
        "update/set-auto-install-on-app-quit" => {
            app.state::<updater::UpdaterState>()
                .auto_install_on_quit
                .store(true, std::sync::atomic::Ordering::SeqCst);
        }
        // logger
        "logger/config" => {
            let level = first.get("level").and_then(|v| v.as_str()).unwrap_or("info");
            let filter = match level {
                "mute" => log::LevelFilter::Off,
                "error" => log::LevelFilter::Error,
                "warn" => log::LevelFilter::Warn,
                "debug" => log::LevelFilter::Debug,
                _ => log::LevelFilter::Info,
            };
            log::set_max_level(filter);
        }
        // external links (preload window.open/target=_blank intercept)
        "__external-link" => {
            if let Some(url) = first.as_str() {
                external_links::open(&app, url);
            }
        }
        _ => {}
    }
}

/// Request/response desktopApi channel (mirrors ipcRenderer.invoke). This is the Tauri equivalent
/// of the Electron suite-desktop-core module IPC handlers.
#[tauri::command]
async fn desktop_invoke(app: AppHandle, channel: String, args: Value) -> Value {
    log_ipc("desktop_invoke", &channel, &args);

    match channel.as_str() {
        // --- handshake ---------------------------------------------------------------
        "handshake/client" => json!({ "statePatch": process_state_patch() }),
        "handshake/load-modules" => {
            // one-time migration of the legacy bio-auth flag from redux → the desktop store, when
            // no value has been persisted yet (Electron app.ts), from payload.legacyBioAuthEnabled
            let store = app.state::<store::Store>();
            if store.bio_auth_settings().get("enabled").is_none() {
                if let Some(legacy) = args
                    .get(0)
                    .and_then(|o| o.get("legacyBioAuthEnabled"))
                    .and_then(|v| v.as_bool())
                {
                    store.set_bio_auth_settings(&json!({ "enabled": legacy }));
                }
            }

            let user_dir = app
                .path()
                .app_data_dir()
                .map(|p| p.to_string_lossy().to_string())
                .unwrap_or_default();
            // bin dir must be a URL the WEBVIEW can fetch: unlike Electron (connect Core runs in
            // Node main and reads bundled binaries via fs), the Tauri build runs connect in the
            // webview browser build, so it fetch()es binDir + firmware/<model>/<name>. The frontend
            // build copies firmware to build/static/bin/firmware (served at <origin>/static/bin), so
            // a root-relative URL resolves in both dev (:8000) and the bundled app (tauri://).
            let bin_dir = "/static/bin".to_string();
            let mut payload = json!({
                "paths": { "userDir": user_dir, "binDir": bin_dir },
                "urls": { "httpReceiver": http_receiver::base_url() },
                "desktopUpdate": updater::handshake_payload(&app),
            });
            // a cold-start custom-protocol launch delivers its URL through the first handshake only
            // (Electron firstRunOnly), so a payment URI opening Suite on first launch is not lost
            if let Some(url) = take_launch_protocol_url() {
                payload["protocol"] = json!(url);
            }
            json!({ "success": true, "payload": payload })
        }
        "handshake/load-tor-module" => {
            let running = app
                .state::<store::Store>()
                .tor_settings()
                .get("running")
                .and_then(|v| v.as_bool())
                .unwrap_or(false);
            // Skip the boot Tor-loading screen if our tor daemon is already up — this handshake runs
            // on every page load, and applying the proxy reloads the SPA while the daemon (and this
            // backend) survive. Re-showing the loader there would hang on an already-bootstrapped
            // daemon; the reloaded page instead seeds `Enabled` via `tor/get-status` (see tor::is_running).
            let should_run = (running || has_switch("tor")) && !tor::is_running(&app);
            json!({ "shouldRunTor": should_run })
        }

        // --- window / app ------------------------------------------------------------
        "app/is-visible" => json!(window::is_visible(&app)),
        "app/is-fullscreen" => json!(window::is_fullscreen(&app)),
        "browser-window/reload" => {
            window::reload(&app);
            Value::Null
        }

        // --- auto-start ----------------------------------------------------------------
        "app/auto-start/is-enabled" => {
            json!({ "success": true, "payload": auto_start::is_enabled() })
        }
        "app/auto-start/popup-ack" => Value::Null,
        "app/auto-start/popup-response" => {
            let response = args.get(0).and_then(|v| v.as_str()).unwrap_or("quit-now").to_string();
            // hand the decision to the before-quit waiter (which applies the side effects); if no
            // prompt is in flight, fall back to applying persistence directly.
            let tx = app.state::<AutoStartPrompt>().pending.lock().unwrap().take();
            if let Some(tx) = tx {
                let _ = tx.send(response);
            } else {
                match response.as_str() {
                    "background-always" => auto_start::set_enabled(true),
                    "quit-always" => app
                        .state::<store::Store>()
                        .set_connect_settings(&json!({ "autoStartDontAskAgain": true })),
                    _ => {}
                }
            }
            Value::Null
        }

        // --- tor ---------------------------------------------------------------------
        "tor/toggle" => {
            let should_enable = args.get(0).and_then(|v| v.as_bool()).unwrap_or(false);
            tor::toggle(app.clone(), should_enable).await
        }
        "tor/get-settings" => tor::get_settings(&app),
        "tor/change-settings" => {
            let payload = args.get(0).cloned().unwrap_or(json!({}));
            tor::change_settings(&app, &payload)
        }

        // --- bridge --------------------------------------------------------------------
        "bridge/get-settings" => {
            json!({ "success": true, "payload": app.state::<store::Store>().bridge_settings() })
        }
        "bridge/change-settings" => {
            let payload = args.get(0).cloned().unwrap_or(json!({}));
            let store = app.state::<store::Store>();
            store.set_bridge_settings(&payload);
            emit_desktop_event(&app, "bridge/settings", store.bridge_settings());
            json!({ "success": true })
        }
        "bridge/get-status" => {
            json!({ "success": true, "payload": bridge::status(&app.state::<bridge::BridgeState>()) })
        }
        "bridge/toggle" => {
            let result = {
                let state = app.state::<bridge::BridgeState>();
                if bridge::process_running(&state) {
                    bridge::stop(&state);
                } else {
                    bridge::spawn(&app, &state);
                }
                bridge::emit_status(&app, &state);
                json!({ "success": true, "payload": bridge::status(&state) })
            };
            tray::render(&app);
            result
        }

        // --- tray ----------------------------------------------------------------------
        "tray/get-settings" => {
            json!({ "success": true, "payload": app.state::<store::Store>().tray_settings() })
        }
        "tray/change-settings" => {
            let payload = args.get(0).cloned().unwrap_or(json!({}));
            app.state::<store::Store>().set_tray_settings(&payload);
            tray::render(&app);
            json!({ "success": true })
        }

        // --- connect popup / connect-ws --------------------------------------------------
        "connect-popup/enabled" => {
            let disable_ws = app
                .state::<store::Store>()
                .connect_settings()
                .get("disableWs")
                .and_then(|v| v.as_bool())
                .unwrap_or(false);
            json!(!disable_ws)
        }
        "connect-popup/set-enabled" => {
            let enabled = args.get(0).and_then(|v| v.as_bool()).unwrap_or(true);
            app.state::<store::Store>()
                .set_connect_settings(&json!({ "disableWs": !enabled }));
            window::restart(&app)
        }
        "connect-popup/ready" => json!(true),
        "connect-popup/response" => {
            let response = args.get(0).cloned().unwrap_or(Value::Null);
            connect_ws::resolve_pending(&app.state::<connect_ws::PendingMap>(), &response);
            Value::Null
        }

        // --- http receiver ----------------------------------------------------------------
        "server/request-address" => {
            let pathname = args.get(0).and_then(|v| v.as_str()).unwrap_or("");
            match http_receiver::request_address(&app.state::<http_receiver::SharedReceiver>(), pathname)
            {
                Some(address) => json!(address),
                None => Value::Null,
            }
        }

        // --- system ------------------------------------------------------------------------
        "system/open-settings" => {
            let target = args.get(0).and_then(|v| v.as_str()).unwrap_or("");
            open_system_settings(target)
        }

        // --- safe storage ---------------------------------------------------------------------
        "safe-storage/encrypt" => {
            let value = arg0(&args, "value").unwrap_or("").to_string();
            tauri::async_runtime::spawn_blocking(move || safe_storage::encrypt(&value))
                .await
                .unwrap_or_else(|_| json!({ "success": false, "error": { "type": "EncryptionUnavailable", "message": "task failed" } }))
        }
        "safe-storage/decrypt" => {
            let value = arg0(&args, "value").unwrap_or("").to_string();
            tauri::async_runtime::spawn_blocking(move || safe_storage::decrypt(&value))
                .await
                .unwrap_or_else(|_| json!({ "success": false, "error": { "type": "DecryptionFailed" } }))
        }

        // --- bio auth ---------------------------------------------------------------------------
        "bio-auth/is-bio-auth-available" => {
            #[cfg(target_os = "macos")]
            {
                json!(macos::bio_auth_available())
            }
            #[cfg(not(target_os = "macos"))]
            {
                json!(false)
            }
        }
        "bio-auth/validate-bio-auth" => {
            let _message = arg0(&args, "message").map(|s| s.to_string());
            #[cfg(target_os = "macos")]
            {
                let result =
                    tauri::async_runtime::spawn_blocking(move || macos::bio_auth_validate(_message))
                        .await
                        .unwrap_or_else(|_| Err("validation task failed".to_string()));
                match result {
                    Ok(()) => {
                        app.state::<macos::BioAuthState>().mark_validated();
                        emit_desktop_event(&app, "bio-auth/validation-status-changed", json!(true));
                        json!({ "success": true })
                    }
                    Err(message) => json!({ "success": false, "message": message }),
                }
            }
            #[cfg(not(target_os = "macos"))]
            {
                json!({ "success": false, "message": "bio auth not available" })
            }
        }
        "bio-auth/get-validation-status" => {
            #[cfg(target_os = "macos")]
            {
                json!(app.state::<macos::BioAuthState>().is_validated())
            }
            #[cfg(not(target_os = "macos"))]
            {
                json!(false)
            }
        }
        "bio-auth/set-bio-auth-settings" => {
            let payload = args.get(0).cloned().unwrap_or(json!({}));
            let store = app.state::<store::Store>();
            store.set_bio_auth_settings(&payload);
            emit_desktop_event(&app, "bio-auth/settings-changed", store.bio_auth_settings());
            Value::Null
        }
        "bio-auth/get-bio-auth-settings" => app.state::<store::Store>().bio_auth_settings(),

        // --- MCP (settings surface only; the MCP server itself is Electron-only for now) ---------
        "mcp/get-settings" => {
            let settings = app.state::<store::Store>().mcp_settings();
            json!({
                "enabled": settings.get("enabled").cloned().unwrap_or(json!(false)),
                "port": settings.get("port").cloned().unwrap_or(json!(21340)),
                "running": false,
                "url": Value::Null,
                "token": settings.get("token").cloned().unwrap_or(Value::Null),
            })
        }
        "mcp/set-enabled" => {
            let enabled = args.get(0).and_then(|v| v.as_bool()).unwrap_or(false);
            app.state::<store::Store>()
                .set_mcp_settings(&json!({ "enabled": enabled }));
            Value::Null
        }
        "mcp/regenerate-token" => {
            let token = new_token();
            app.state::<store::Store>()
                .set_mcp_settings(&json!({ "token": token }));
            json!({ "token": token })
        }

        // --- user data ------------------------------------------------------------------------
        "user-data/clear" => user_data::clear(&app),
        "user-data/open" => {
            let directory = args.get(0).and_then(|v| v.as_str()).unwrap_or("");
            user_data::open(&app, directory)
        }

        // --- metadata: real local files under <app_data_dir>/metadata --------------
        "metadata/write" => match (metadata_dir(&app), arg0(&args, "file")) {
            (Some(dir), Some(file)) => {
                let content = args
                    .get(0)
                    .and_then(|o| o.get("content"))
                    .and_then(|c| c.as_str())
                    .unwrap_or("");
                match fs::write(dir.join(sanitize_filename(file)), content) {
                    Ok(_) => json!({ "success": true }),
                    Err(e) => json!({ "success": false, "error": e.to_string() }),
                }
            }
            _ => json!({ "success": false, "error": "invalid params" }),
        },
        "metadata/read" => match (metadata_dir(&app), arg0(&args, "file")) {
            (Some(dir), Some(file)) => match fs::read_to_string(dir.join(sanitize_filename(file))) {
                Ok(content) => json!({ "success": true, "payload": content }),
                // failure → the metadata provider treats a missing file as "no metadata yet";
                // report the real error kind (Electron returns error.code), not a blanket ENOENT.
                Err(e) => json!({ "success": false, "error": e.to_string(), "code": io_error_code(&e) }),
            },
            _ => json!({ "success": false, "error": "invalid params" }),
        },
        "metadata/get-files" => match metadata_dir(&app) {
            Some(dir) => {
                let files: Vec<String> = fs::read_dir(&dir)
                    .map(|rd| {
                        rd.filter_map(|e| e.ok())
                            .filter_map(|e| e.file_name().into_string().ok())
                            // skip dotfiles (.DS_Store, …) like Electron's readDir
                            .filter(|name| !name.starts_with('.'))
                            .collect()
                    })
                    .unwrap_or_default();
                json!({ "success": true, "payload": files })
            }
            None => json!({ "success": true, "payload": [] }),
        },
        "metadata/rename-file" => match (metadata_dir(&app), arg0(&args, "file"), arg0(&args, "to")) {
            (Some(dir), Some(file), Some(to)) => {
                let from = dir.join(sanitize_filename(file));
                let dst = dir.join(sanitize_filename(to));
                if from.exists() {
                    match fs::rename(from, dst) {
                        Ok(_) => json!({ "success": true }),
                        Err(e) => json!({ "success": false, "error": e.to_string() }),
                    }
                } else {
                    json!({ "success": true })
                }
            }
            _ => json!({ "success": false, "error": "invalid params" }),
        },

        // unknown / not-yet-implemented channel
        other => {
            log::warn!("desktop_invoke: unhandled channel '{other}', returning null");
            Value::Null
        }
    }
}

pub(crate) fn new_token() -> String {
    use aes_gcm::aead::rand_core::RngCore;
    let mut bytes = [0u8; 24];
    aes_gcm::aead::OsRng.fill_bytes(&mut bytes);
    bytes.iter().map(|b| format!("{b:02x}")).collect()
}

/// Map an io::Error kind to the errno-style string the frontend's `InvokeResult.code` expects
/// (Electron surfaces the real `error.code`).
fn io_error_code(e: &std::io::Error) -> &'static str {
    match e.kind() {
        std::io::ErrorKind::NotFound => "ENOENT",
        std::io::ErrorKind::PermissionDenied => "EACCES",
        std::io::ErrorKind::AlreadyExists => "EEXIST",
        _ => "EIO",
    }
}

fn open_system_settings(target: &str) -> Value {
    let error = json!({ "success": false, "error": "Cannot open system settings (unsupported system). Please open the settings manually." });
    let cmd: Option<(&str, Vec<&str>)> = match (target, std::env::consts::OS) {
        ("bluetooth", "macos") => Some(("open", vec!["x-apple.systempreferences:com.apple.Bluetooth"])),
        ("bluetooth-permissions", "macos") => Some((
            "open",
            vec!["x-apple.systempreferences:com.apple.preference.security?Privacy_Bluetooth"],
        )),
        ("bluetooth", "linux") => Some(("blueman-manager", vec![])),
        _ => None,
    };
    match cmd {
        Some((program, args)) => match std::process::Command::new(program).args(args).spawn() {
            Ok(_) => json!({ "success": true }),
            Err(_) => error,
        },
        None => error,
    }
}

/// Whether to show the "keep running in background?" prompt before quitting (Electron parity):
/// connect-ws has been used, the user hasn't opted out, and auto-start isn't already enabled.
#[cfg(not(target_os = "macos"))]
fn should_prompt_before_quit(app: &AppHandle) -> bool {
    let connect = app.state::<store::Store>().connect_settings();
    let used_ws = connect.get("hasUsedConnectWs").and_then(|v| v.as_bool()).unwrap_or(false);
    let dont_ask = connect.get("autoStartDontAskAgain").and_then(|v| v.as_bool()).unwrap_or(false);
    used_ws && !dont_ask && !auto_start::is_enabled()
}

/// Emit the popup-request and defer the quit until the renderer responds (or a timeout), applying
/// the chosen action. Always terminates in a bounded time so quit can never hang.
#[cfg(not(target_os = "macos"))]
fn begin_before_quit_prompt(app: AppHandle) {
    let (tx, rx) = tokio::sync::oneshot::channel::<String>();
    *app.state::<AutoStartPrompt>().pending.lock().unwrap() = Some(tx);
    emit_desktop_event(&app, "app/auto-start/popup-request", Value::Null);

    tauri::async_runtime::spawn(async move {
        // wait for the user's choice; on timeout treat as quit-now (Electron's fallback)
        let decision = tokio::time::timeout(std::time::Duration::from_secs(30), rx)
            .await
            .ok()
            .and_then(|r| r.ok())
            .unwrap_or_else(|| "quit-now".to_string());

        let quit = |app: &AppHandle| {
            app.state::<AutoStartPrompt>()
                .quitting
                .store(true, std::sync::atomic::Ordering::SeqCst);
            app.exit(0);
        };
        match decision.as_str() {
            "background-always" => {
                auto_start::set_enabled(true);
                window::hide(&app);
            }
            "background-now" => window::hide(&app),
            "quit-always" => {
                app.state::<store::Store>()
                    .set_connect_settings(&json!({ "autoStartDontAskAgain": true }));
                quit(&app);
            }
            _ => quit(&app),
        }
    });
}

/// Handle an incoming custom-protocol URL (deep link / second instance argv).
fn handle_protocol_url(app: &AppHandle, url: &str) {
    let valid = URI_SCHEMES.iter().any(|s| url.starts_with(&format!("{s}:")));
    if !valid {
        log::warn!("custom-protocols: ignoring invalid protocol url");
        return;
    }
    log::info!("custom-protocols: handling protocol url");
    http_receiver::focus_main_window(app);
    emit_desktop_event(app, "protocol/open", json!(url));
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let pending = connect_ws::new_pending();
    let receiver_state = http_receiver::new_state();

    let mut builder = tauri::Builder::default()
        .manage(pending.clone())
        .manage(receiver_state.clone())
        .manage(bridge::BridgeState::new())
        .manage(bluetooth::BluetoothState::new())
        .manage(store::Store::new())
        .manage(tor::TorState::new())
        .manage(updater::UpdaterState::new())
        .manage(window::WindowState::new())
        .manage(tray::TrayState::new())
        .manage(AutoStartPrompt::new());

    #[cfg(target_os = "macos")]
    {
        builder = builder.manage(macos::BioAuthState::new());
    }

    builder = builder
        .plugin(tauri_plugin_single_instance::init(|app, argv, _cwd| {
            // second app instance: focus the running one and forward a protocol url (Linux/Windows)
            http_receiver::focus_main_window(app);
            if let Some(url) = argv.iter().skip(1).find(|a| {
                URI_SCHEMES.iter().any(|s| a.starts_with(&format!("{s}:")))
            }) {
                handle_protocol_url(app, url);
            }
        }))
        .plugin(tauri_plugin_deep_link::init())
        .plugin(
            tauri_plugin_log::Builder::default()
                .level(log::LevelFilter::Info)
                .target(tauri_plugin_log::Target::new(
                    tauri_plugin_log::TargetKind::Stdout,
                ))
                .target(tauri_plugin_log::Target::new(
                    tauri_plugin_log::TargetKind::LogDir {
                        file_name: Some("trezor-suite-log".into()),
                    },
                ))
                .build(),
        )
        .invoke_handler(tauri::generate_handler![
            tauri_report,
            desktop_invoke,
            desktop_send,
            bluetooth_token_cmd
        ])
        .on_window_event(|window, event| {
            let app = window.app_handle();
            match event {
                WindowEvent::CloseRequested { api, .. } => {
                    window::save_bounds(app);
                    // macOS: keep the app alive in the Dock (Electron window-controls behavior)
                    #[cfg(target_os = "macos")]
                    {
                        api.prevent_close();
                        let _ = window.hide();
                    }
                    // Linux/Windows: before quitting, offer to keep Suite running in the background
                    // (Electron promptForAutoStartBeforeQuit) when connect-ws has been used.
                    #[cfg(not(target_os = "macos"))]
                    {
                        let prompt = app.state::<AutoStartPrompt>();
                        if prompt.quitting.load(std::sync::atomic::Ordering::SeqCst) {
                            // user already chose to quit; let this close proceed
                        } else if should_prompt_before_quit(app) {
                            api.prevent_close();
                            begin_before_quit_prompt(app.clone());
                        }
                    }
                }
                WindowEvent::Focused(_focused) => {
                    #[cfg(target_os = "macos")]
                    app.state::<macos::BioAuthState>().on_focus_change(*_focused);
                }
                WindowEvent::ThemeChanged(theme) => {
                    window::on_system_theme_changed(app, *theme);
                }
                _ => {}
            }
        })
        .setup(move |app| {
            let handle = app.handle().clone();

            // persistent settings store
            app.state::<store::Store>().load(&handle);

            // application menu (also carries the reload/devtools/zoom shortcuts)
            if let Err(e) = menu::build(&handle) {
                log::error!("menu: failed to build: {e}");
            }

            // http-receiver: HTTP routes + connect-ws on 127.0.0.1:21335
            {
                let app_handle = handle.clone();
                let state = receiver_state.clone();
                let pending = pending.clone();
                tauri::async_runtime::spawn(async move {
                    http_receiver::run_server(app_handle, state, pending).await;
                });
            }

            // bundled node-bridge (unless disabled in settings or an external Bridge runs)
            {
                let store = app.state::<store::Store>();
                let do_not_start = store
                    .bridge_settings()
                    .get("doNotStartOnStartup")
                    .and_then(|v| v.as_bool())
                    .unwrap_or(false);
                let bridge_state = app.state::<bridge::BridgeState>();
                if !do_not_start {
                    bridge::spawn(&handle, &bridge_state);
                }
                bridge::emit_status(&handle, &bridge_state);
            }

            // bluetooth (BLE) transport sidecar — spawns the trezor-bluetooth server + BLE stack
            bluetooth::spawn(&handle, &app.state::<bluetooth::BluetoothState>());

            // tray icon (if enabled in settings)
            tray::render(&handle);

            // cold-start deep link: capture the launch URL so the first handshake/load-modules can
            // deliver it as `protocol` (Electron firstRunOnly), avoiding the race where an early
            // `protocol/open` emit is lost before the webview registers its listener.
            {
                let launch_url = app
                    .deep_link()
                    .get_current()
                    .ok()
                    .flatten()
                    .and_then(|urls| urls.into_iter().next().map(|u| u.to_string()))
                    .or_else(|| {
                        std::env::args().skip(1).find(|a| {
                            URI_SCHEMES.iter().any(|s| a.starts_with(&format!("{s}:")))
                        })
                    });
                if let Some(url) = launch_url {
                    if URI_SCHEMES.iter().any(|s| url.starts_with(&format!("{s}:"))) {
                        set_launch_protocol_url(url);
                    }
                }
            }

            // deep links while running (macOS open-url; Linux/Windows come via single-instance argv)
            {
                let handle2 = handle.clone();
                app.deep_link().on_open_url(move |event| {
                    for url in event.urls() {
                        handle_protocol_url(&handle2, url.as_str());
                    }
                });
            }

            // macOS: power-monitor suspend events + bio-auth relock/availability watcher
            #[cfg(target_os = "macos")]
            {
                macos::register_power_monitor(&handle);
                macos::spawn_bio_auth_watcher(&handle);
            }

            // main window — created without a proxy even when Tor is enabled: like Electron, the
            // renderer's Tor loader gates the UI and calls tor/toggle, which bootstraps Tor and
            // then applies the proxy (recreating the webview).
            window::create_main_window(&handle, None)?;

            Ok(())
        });

    builder
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(|app_handle, event| match event {
            RunEvent::Exit => {
                window::save_bounds(app_handle);
                bridge::stop(&app_handle.state::<bridge::BridgeState>());
                bluetooth::stop(&app_handle.state::<bluetooth::BluetoothState>());
                tor::stop(&app_handle.state::<tor::TorState>());
                // "install on quit": open the verified installer as we exit (Electron
                // autoInstallOnAppQuit). No-op unless the user opted in and an update is downloaded.
                updater::install_on_quit_if_requested(app_handle);
            }
            #[cfg(target_os = "macos")]
            RunEvent::Reopen { .. } => {
                // Dock icon clicked with the window hidden
                http_receiver::focus_main_window(app_handle);
            }
            _ => {}
        });
}
