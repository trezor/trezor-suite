//! Bluetooth (BLE) transport lifecycle — the Tauri equivalent of the Electron `suite-desktop-core`
//! `modules/bluetooth.ts`.
//!
//! The BLE management stack (BluetoothIpc + the ipc-proxy channel) is now reimplemented natively in
//! Rust (`bluetooth_host`), so there is NO Node sidecar. This module resolves the native
//! `trezor-bluetooth` server binary and starts the in-process host, which spawns that binary and
//! serves the `@trezor/ipc-proxy` `Bluetooth` channel over `ws://127.0.0.1:21329` for the preload.

use std::sync::Arc;
use tauri::{AppHandle, Manager};

use crate::bluetooth_host::BluetoothHost;

pub struct BluetoothState {
    host: Arc<BluetoothHost>,
    started: std::sync::atomic::AtomicBool,
}

impl BluetoothState {
    pub fn new() -> Self {
        BluetoothState {
            host: Arc::new(BluetoothHost::new()),
            started: std::sync::atomic::AtomicBool::new(false),
        }
    }
}

/// Resolve the native `trezor-bluetooth` server binary path (bundled resource → dev repo path).
fn resolve_binary(app: &AppHandle) -> Option<String> {
    let bin_name = if cfg!(windows) { "trezor-bluetooth.exe" } else { "trezor-bluetooth" };

    if let Ok(res) = app.path().resource_dir() {
        let binary = res.join("bluetooth").join(bin_name);
        if binary.exists() {
            return Some(binary.to_string_lossy().into_owned());
        }
    }
    let manifest = env!("CARGO_MANIFEST_DIR");
    let plat = match (std::env::consts::OS, std::env::consts::ARCH) {
        ("macos", "aarch64") => "mac-arm64",
        ("macos", _) => "mac-x64",
        ("linux", "aarch64") => "linux-arm64",
        ("linux", _) => "linux-x64",
        _ => "win-x64",
    };
    let binary = format!("{manifest}/../../suite-data/files/bin/bluetooth/{plat}/{bin_name}");
    if std::path::Path::new(&binary).exists() {
        Some(binary)
    } else {
        None
    }
}

/// Start the in-process bluetooth host (idempotent). Best-effort: a missing binary just means no
/// BLE transport (like Electron on unsupported setups).
pub fn spawn(app: &AppHandle, state: &BluetoothState) {
    if state.started.swap(true, std::sync::atomic::Ordering::SeqCst) {
        return;
    }
    let binary = resolve_binary(app);
    if binary.is_none() {
        log::info!("bluetooth: trezor-bluetooth binary not found; BLE transport disabled");
    }
    crate::bluetooth_host::start(state.host.clone(), binary, crate::bluetooth_token());
    log::info!("bluetooth: started in-process Rust bluetooth host");
}

pub fn stop(state: &BluetoothState) {
    state.host.stop();
}
