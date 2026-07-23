//! Main-window management: creation with init scripts, persisted bounds (Electron `winBounds`),
//! theme, navigation guard (request-filter equivalent for top-level navigations), and proxy
//! application (Tor). WKWebView/WebKitGTK can only get a proxy at creation time, so
//! `apply_proxy` recreates the window when the desired proxy changes.

use serde_json::json;
use std::sync::Mutex;
use tauri::{AppHandle, Emitter, Manager, Theme, WebviewUrl, WebviewWindow, WebviewWindowBuilder};

const PRELOAD_SCRIPT: &str = include_str!("../preload/tauri-preload.js");

// Boot diagnostics — DEBUG BUILDS ONLY. It must never ship in a release: it reported
// `document.body.innerText` (which on the dashboard contains account labels, balances, and
// addresses — all confidential) to `tauri_report`, whose output is persisted to the on-disk log.
// Release builds inject nothing here (see create_main_window). Even in debug it now reports only the
// non-sensitive app-element length + tick count, never the rendered text.
#[cfg(debug_assertions)]
const DIAG_SCRIPT: &str = r#"
(function () {
  function report(kind, msg) {
    try {
      if (window.__TAURI__ && window.__TAURI__.core) {
        window.__TAURI__.core.invoke('tauri_report', { kind: kind, message: String(msg) });
      }
    } catch (e) {}
  }
  report('diag', 'diagnostics running');
  window.addEventListener('error', function (e) {
    report('js-error', (e.message || '') + ' @ ' + (e.filename || '') + ':' + (e.lineno || ''));
  }, true);
  window.addEventListener('unhandledrejection', function (e) {
    var r = e && e.reason;
    report('promise-rejection', (r && (r.message || r)) || 'unknown');
  });
  var ticks = 0;
  var iv = setInterval(function () {
    ticks++;
    var a = document.getElementById('app');
    var len = a ? a.innerHTML.length : -1;
    report('tick', 'n=' + ticks + ' appLen=' + len);
    if (ticks >= 12) clearInterval(iv);
  }, 2500);
})();
"#;

pub struct WindowState {
    /// proxy URL the current webview was created with
    pub proxy: Mutex<Option<String>>,
    pub zoom: Mutex<f64>,
    /// label of the current main webview — changing the proxy needs a fresh webview (WKWebView /
    /// WebKitGTK can't reconfigure a proxy at runtime), and reusing the label races the async
    /// teardown, so each rebuild gets a new unique label.
    label: Mutex<String>,
    counter: std::sync::atomic::AtomicU32,
}

impl WindowState {
    pub fn new() -> Self {
        WindowState {
            proxy: Mutex::new(None),
            zoom: Mutex::new(1.0),
            label: Mutex::new("main".to_string()),
            counter: std::sync::atomic::AtomicU32::new(0),
        }
    }
}

/// The current main webview, whatever its label (see WindowState::label).
pub fn main_window(app: &AppHandle) -> Option<WebviewWindow> {
    let label = app.state::<WindowState>().label.lock().unwrap().clone();
    app.get_webview_window(&label)
}

/// True if a window rect at (x, y, w, h) intersects at least one connected monitor's area, so the
/// title bar is reachable. Used to reject stale saved bounds from a disconnected display.
fn position_on_screen(win: &WebviewWindow, x: f64, y: f64, w: f64, h: f64) -> bool {
    let Ok(monitors) = win.available_monitors() else {
        return true; // can't enumerate — trust the saved value rather than fight the OS
    };
    if monitors.is_empty() {
        return true;
    }
    let (wx0, wy0, wx1, wy1) = (x, y, x + w, y + h);
    monitors.iter().any(|m| {
        let p = m.position();
        let s = m.size();
        let (mx0, my0) = (p.x as f64, p.y as f64);
        let (mx1, my1) = (mx0 + s.width as f64, my0 + s.height as f64);
        // require a real overlap, not just a touching edge
        wx0 < mx1 && wx1 > mx0 && wy0 < my1 && wy1 > my0
    })
}

fn theme_from_store(app: &AppHandle) -> Option<Theme> {
    match app.state::<crate::store::Store>().theme_settings().as_str() {
        "dark" => Some(Theme::Dark),
        "light" => Some(Theme::Light),
        _ => None,
    }
}

/// Hosts the frontend may navigate to inside the app window; anything else opens in the default
/// browser (Electron: request-filter + setWindowOpenHandler).
fn navigation_allowed(url: &tauri::Url) -> bool {
    match url.scheme() {
        "tauri" | "about" | "data" => true,
        "http" | "https" => {
            let host = url.host_str().unwrap_or("");
            host == "localhost" || host == "127.0.0.1" || host == "tauri.localhost"
        }
        _ => false,
    }
}

pub fn create_main_window(app: &AppHandle, proxy: Option<String>) -> tauri::Result<WebviewWindow> {
    let win_state = app.state::<WindowState>();
    let previous = win_state.label.lock().unwrap().clone();
    let n = win_state
        .counter
        .fetch_add(1, std::sync::atomic::Ordering::SeqCst);
    // first window keeps the "main" label; rebuilds get a fresh one to avoid the async-teardown
    // label race (and so the window count never drops to zero mid-swap → no accidental quit).
    let label = if n == 0 { "main".to_string() } else { format!("main-{n}") };

    let store = app.state::<crate::store::Store>();
    let bounds = store.win_bounds();
    let width = bounds.get("width").and_then(|v| v.as_f64()).unwrap_or(1280.0).max(720.0);
    let height = bounds.get("height").and_then(|v| v.as_f64()).unwrap_or(720.0).max(512.0);
    let pos = bounds
        .get("x")
        .and_then(|v| v.as_f64())
        .zip(bounds.get("y").and_then(|v| v.as_f64()));

    let open_external = app.clone();
    let mut builder = WebviewWindowBuilder::new(app, &label, WebviewUrl::App("".into()))
        .title("Trezor Suite")
        .inner_size(width, height)
        .min_inner_size(720.0, 512.0)
        .resizable(true)
        .theme(theme_from_store(app))
        .initialization_script(PRELOAD_SCRIPT)
        .on_navigation(move |url| {
            if navigation_allowed(url) {
                return true;
            }
            log::info!("navigation to {url} blocked; opening externally");
            crate::external_links::open(&open_external, url.as_str());
            false
        });

    // boot diagnostics are debug-only (release must not report rendered text to the log)
    #[cfg(debug_assertions)]
    {
        builder = builder.initialization_script(DIAG_SCRIPT);
    }

    if let Some(p) = &proxy {
        match p.parse::<tauri::Url>() {
            Ok(url) => builder = builder.proxy_url(url),
            Err(e) => log::error!("window: invalid proxy url {p}: {e}"),
        }
    }

    let win = builder.build()?;
    // Restore the saved position only if it still lands on a connected monitor — otherwise a window
    // last placed on a now-disconnected external display would open off-screen and invisible.
    if let Some((x, y)) = pos {
        if position_on_screen(&win, x, y, width, height) {
            let _ = win.set_position(tauri::PhysicalPosition::new(x as i32, y as i32));
        } else {
            log::info!("window: saved position off-screen; letting the OS place the window");
            let _ = win.center();
        }
    }
    let _ = win.show();
    let _ = win.set_focus();

    // publish the new label + proxy, then tear the old webview down (new one already exists, so
    // the window count never hits zero)
    {
        let win_state = app.state::<WindowState>();
        *win_state.label.lock().unwrap() = label.clone();
        *win_state.proxy.lock().unwrap() = proxy;
    }
    if label != previous {
        if let Some(old) = app.get_webview_window(&previous) {
            let _ = old.destroy();
        }
    }

    log::info!("main window created ({label})");
    println!("TAURI_REPORT window: main window created");
    Ok(win)
}

/// Recreate the window if the desired proxy differs from what the current webview was built with.
///
/// Parity note: Electron flips the Chromium session proxy at runtime without navigating, so the SPA
/// keeps its in-memory route + transient UI state across a Tor toggle. WKWebView/WebKitGTK can only
/// receive a proxy at webview creation, so this reloads the SPA (equivalent to a Ctrl+R). Persisted
/// state (accounts/settings in IndexedDB) is restored on reload; only the in-memory route (the app
/// uses `createMemoryHistory`, so the route lives in Redux, not the URL) and any unsaved modal are
/// reset — the same effect as a manual reload. There is no URL to preserve for a memory-history SPA.
pub fn apply_proxy(app: &AppHandle, proxy: Option<String>) {
    let current = app.state::<WindowState>().proxy.lock().unwrap().clone();
    if current == proxy {
        return;
    }
    log::info!("window: applying proxy {proxy:?} (recreating webview)");
    if let Err(e) = create_main_window(app, proxy) {
        log::error!("window: recreate failed: {e}");
    }
}

pub fn save_bounds(app: &AppHandle) {
    let Some(win) = main_window(app) else {
        return;
    };
    let store = app.state::<crate::store::Store>();
    let size = win.inner_size().ok();
    let pos = win.outer_position().ok();
    if let Some(size) = size {
        let mut bounds = json!({ "width": size.width, "height": size.height });
        if let Some(pos) = pos {
            bounds["x"] = json!(pos.x);
            bounds["y"] = json!(pos.y);
        }
        store.set_win_bounds(bounds);
    }
}

/// `theme/change` — persist + switch the window theme (Electron nativeTheme.themeSource).
pub fn set_theme(app: &AppHandle, theme: &str) {
    let store = app.state::<crate::store::Store>();
    store.set_theme_settings(theme);
    if let Some(win) = main_window(app) {
        let _ = win.set_theme(match theme {
            "dark" => Some(Theme::Dark),
            "light" => Some(Theme::Light),
            _ => None,
        });
    }
}

/// OS theme changed (WindowEvent::ThemeChanged) → notify renderer when following the system.
pub fn on_system_theme_changed(app: &AppHandle, theme: Theme) {
    let store = app.state::<crate::store::Store>();
    if store.theme_settings() != "system" {
        return;
    }
    let value = if theme == Theme::Dark { "dark" } else { "light" };
    log::info!("theme: OS theme changed to {value}");
    let _ = app.emit("desktop://theme/system-change", json!(value));
}

pub fn zoom_by(app: &AppHandle, delta: Option<f64>) {
    let state = app.state::<WindowState>();
    let mut zoom = state.zoom.lock().unwrap();
    *zoom = match delta {
        Some(d) => (*zoom + d).clamp(0.25, 5.0),
        None => 1.0,
    };
    if let Some(win) = main_window(app) {
        let _ = win.set_zoom(*zoom);
    }
}

/// Restart the whole app (Electron `restartApp`).
pub fn restart(app: &AppHandle) -> ! {
    app.restart()
}

pub fn reload(app: &AppHandle) {
    if let Some(win) = main_window(app) {
        let _ = win.eval("window.location.reload()");
    }
}

/// `app/hide` (Windows minimizes, others hide — mirrors window-controls.ts).
pub fn hide(app: &AppHandle) {
    if let Some(win) = main_window(app) {
        if cfg!(windows) {
            let _ = win.minimize();
        } else {
            let _ = win.hide();
        }
    }
}

pub fn is_visible(app: &AppHandle) -> bool {
    main_window(app)
        .and_then(|w| w.is_visible().ok())
        .unwrap_or(false)
}

pub fn is_fullscreen(app: &AppHandle) -> bool {
    main_window(app)
        .and_then(|w| w.is_fullscreen().ok())
        .unwrap_or(false)
}
