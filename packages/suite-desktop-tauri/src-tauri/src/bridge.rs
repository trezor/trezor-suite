//! Bridge lifecycle — thin wrapper over the in-process Rust Trezor Bridge (`bridge_server`).
//!
//! Previously this spawned `@trezor/transport-bridge` as a bundled Node.js sidecar. That runtime is
//! gone: the trezord HTTP daemon (127.0.0.1:21328) is now reimplemented natively in Rust and runs
//! in-process, so the bundle carries no Node. If an externally-installed Trezor Bridge already holds
//! the port we defer to it (don't start our own), matching the old behaviour.

use serde_json::{json, Value};
use std::sync::atomic::{AtomicBool, Ordering};
use tauri::{AppHandle, Emitter};

pub struct BridgeState {
    /// our in-process server was started
    started: AtomicBool,
    /// an external Bridge already held the port; we deferred to it
    using_external: AtomicBool,
}

impl BridgeState {
    pub fn new() -> Self {
        Self {
            started: AtomicBool::new(false),
            using_external: AtomicBool::new(false),
        }
    }
}

impl Default for BridgeState {
    fn default() -> Self {
        Self::new()
    }
}

/// Is our in-process bridge active (started and not deferring to an external one)?
pub fn process_running(state: &BridgeState) -> bool {
    state.started.load(Ordering::SeqCst) && !state.using_external.load(Ordering::SeqCst)
}

/// Start the in-process bridge unless it (or an external Bridge) is already running. Emulator mode
/// (UDP transport, for e2e) is selected via `TREZOR_BRIDGE_UDP=1`; otherwise USB serves devices.
pub fn spawn(_app: &AppHandle, state: &BridgeState) -> bool {
    if process_running(state) {
        return true;
    }
    if crate::bridge_server::service_up() {
        log::info!("bridge: a Bridge is already running on 127.0.0.1:21328; deferring to it");
        state.using_external.store(true, Ordering::SeqCst);
        return true;
    }
    let use_udp = std::env::var("TREZOR_BRIDGE_UDP").map(|v| v == "1").unwrap_or(false);
    crate::bridge_server::start(use_udp);
    state.started.store(true, Ordering::SeqCst);
    log::info!("bridge: started in-process Rust bridge (udp={use_udp})");
    true
}

/// The in-process server has no separate process to kill; it ends with the app. No-op (kept for
/// API compatibility with the previous sidecar implementation).
pub fn stop(_state: &BridgeState) {}

pub fn status(state: &BridgeState) -> Value {
    json!({ "service": crate::bridge_server::service_up(), "process": process_running(state) })
}

pub fn emit_status(app: &AppHandle, state: &BridgeState) {
    let _ = app.emit("desktop://bridge/status", status(state));
}
