//! connect-ws protocol handler — the Tauri-native equivalent of the Electron
//! `packages/suite-desktop-core/src/libs/connect-ws.ts`.
//!
//! A dApp using `@trezor/connect-web` with `coreMode: 'suite-desktop'` connects to
//! `ws://127.0.0.1:21335/connect-ws` (served by `http_receiver`) and sends CORE_CALL messages; we
//! relay each call to the Suite frontend (which runs connect Core in the webview) via the
//! `desktop://connect-popup/call` event, then send the frontend's `connect-popup/response` back
//! over the socket.

use axum::extract::ws::{Message, WebSocket};
use futures_util::{SinkExt, StreamExt};
use serde_json::{json, Value};
use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use tauri::{AppHandle, Emitter};
use tokio::sync::oneshot;

// message-type constants (packages/connect-common/src/events)
const PING: &str = "ping";
const CORE_CALL: &str = "iframe-call";
const CORE_CALL_CANCEL: &str = "core-call-cancel";
const POPUP_HANDSHAKE: &str = "popup-handshake";
const POPUP_CLOSED: &str = "popup-closed";

/// fallback process name when the peer process can't be resolved
const PROCESS_NAME: &str = "connect-ws";

/// Best-effort equivalent of Electron's `findProcessFromIncomingPort`: find the name of the local
/// process that owns the client side of this connection (the dApp). Returns (name, fullPath,
/// warning) so the connect permissions dialog shows the real requester and flags a binary running
/// from an unusual (temp/download) location, mirroring Electron's findProcessFromIncomingPort.
/// Unix-only (lsof); falls back to (PROCESS_NAME, PROCESS_NAME, false).
fn process_info_from_peer(peer_port: u16) -> (String, String, bool) {
    let fallback = || (PROCESS_NAME.to_string(), PROCESS_NAME.to_string(), false);
    if peer_port == 0 {
        return fallback();
    }
    #[cfg(unix)]
    {
        // `lsof -nP -iTCP:<port>` — first non-header row: COMMAND PID ...
        let Ok(out) = std::process::Command::new("lsof")
            .args(["-nP", &format!("-iTCP:{peer_port}")])
            .output()
        else {
            return fallback();
        };
        let text = String::from_utf8_lossy(&out.stdout);
        let Some(line) = text.lines().find(|l| !l.starts_with("COMMAND")) else {
            return fallback();
        };
        let mut cols = line.split_whitespace();
        let name = cols.next().unwrap_or(PROCESS_NAME).to_string();
        let pid = cols.next().and_then(|p| p.parse::<u32>().ok());

        // resolve the full executable path (Linux: /proc/<pid>/exe; macOS: ps -o comm=)
        let full_path = pid
            .and_then(exe_path_for_pid)
            .unwrap_or_else(|| name.clone());
        // a caller running from a temp/download dir is a mild impersonation signal
        let warning = ["/tmp/", "/var/tmp/", "/private/var/folders/", "/Downloads/", "/.cache/"]
            .iter()
            .any(|s| full_path.contains(s));

        return (name, full_path, warning);
    }
    #[allow(unreachable_code)]
    fallback()
}

#[cfg(unix)]
fn exe_path_for_pid(pid: u32) -> Option<String> {
    #[cfg(target_os = "linux")]
    {
        std::fs::read_link(format!("/proc/{pid}/exe"))
            .ok()
            .map(|p| p.to_string_lossy().into_owned())
    }
    #[cfg(not(target_os = "linux"))]
    {
        let out = std::process::Command::new("ps")
            .args(["-p", &pid.to_string(), "-o", "comm="])
            .output()
            .ok()?;
        let s = String::from_utf8_lossy(&out.stdout).trim().to_string();
        if s.is_empty() {
            None
        } else {
            Some(s)
        }
    }
}

/// id -> sender that resolves a pending CORE_CALL with the frontend's response.
pub type PendingMap = Arc<Mutex<HashMap<String, oneshot::Sender<Value>>>>;

pub fn new_pending() -> PendingMap {
    Arc::new(Mutex::new(HashMap::new()))
}

/// Called from the `connect-popup/response` desktopApi command: resolve the waiting socket task.
pub fn resolve_pending(pending: &PendingMap, response: &Value) {
    if let Some(id) = response.get("id").and_then(|v| v.as_str()) {
        if let Some(tx) = pending.lock().unwrap().remove(id) {
            let _ = tx.send(response.clone());
        }
    }
}

pub async fn handle_socket(
    ws: WebSocket,
    origin: String,
    peer_port: u16,
    app: AppHandle,
    pending: PendingMap,
) {
    let (sink, mut stream) = ws.split();
    let sink = Arc::new(tokio::sync::Mutex::new(sink));

    let mut manifest: Option<Value> = None;
    let mut version: Option<Value> = None;
    // (name, fullPath, warning) resolved lazily on the first CORE_CALL (lsof shell-out)
    let mut process_info: Option<(String, String, bool)> = None;
    // ids this connection registered in the shared PendingMap, so they can be cleaned up when the
    // socket ends (Electron's ws.on('close') deletes the connection's pending ids + emits cancel).
    let mut connection_ids: std::collections::HashSet<String> = std::collections::HashSet::new();

    while let Some(Ok(msg)) = stream.next().await {
        let text = match msg {
            Message::Text(t) => t.to_string(),
            Message::Close(_) => break,
            _ => continue,
        };
        let Ok(m) = serde_json::from_str::<Value>(&text) else {
            continue;
        };
        let mtype = m.get("type").and_then(|v| v.as_str()).unwrap_or("");
        let id = m.get("id").and_then(|v| v.as_str()).unwrap_or("").to_string();
        // Electron rejects frames whose id is not a base-10 integer string (validateIncomingMessage)
        if id.is_empty() || id.parse::<u64>().is_err() {
            continue;
        }

        match mtype {
            PING => {
                let _ = sink
                    .lock()
                    .await
                    .send(Message::Text(
                        json!({ "id": id, "type": "pong" }).to_string().into(),
                    ))
                    .await;
            }
            POPUP_HANDSHAKE => {
                let settings = m.get("payload").and_then(|p| p.get("settings"));
                manifest = settings.and_then(|s| s.get("manifest")).cloned();
                version = settings.and_then(|s| s.get("version")).cloned();
                let _ = sink
                    .lock()
                    .await
                    .send(Message::Text(
                        json!({ "id": id, "type": POPUP_HANDSHAKE, "payload": "ok" })
                            .to_string()
                            .into(),
                    ))
                    .await;
            }
            POPUP_CLOSED | CORE_CALL_CANCEL => {
                let payload = m.get("payload");
                let _ = app.emit(
                    "desktop://connect-popup/cancel",
                    json!({
                        "error": payload.and_then(|p| p.get("reason").or_else(|| p.get("error"))),
                        "callId": payload.and_then(|p| p.get("callId")),
                    }),
                );
            }
            CORE_CALL => {
                // Electron requires a prior POPUP.HANDSHAKE carrying a manifest with appName and a
                // non-empty origin before honouring a call; a dApp that skips the handshake must not
                // be able to surface a spoof-able "Unknown" origin popup.
                let manifest_out = match &manifest {
                    Some(man) if man.get("appName").and_then(|v| v.as_str()).is_some()
                        && !origin.is_empty() =>
                    {
                        json!({
                            "appName": man.get("appName"),
                            "appIcon": man.get("appIcon"),
                            "appUrl": man.get("appUrl"),
                            "email": man.get("email"),
                            "npmVersion": version,
                        })
                    }
                    _ => {
                        log::warn!("connect-ws: CORE_CALL without a valid handshake/origin; dropping");
                        continue;
                    }
                };

                let payload = m.get("payload").cloned().unwrap_or(json!({}));
                let method = payload.get("method").and_then(|v| v.as_str()).unwrap_or("");
                let mut rest = payload.clone();
                if let Some(obj) = rest.as_object_mut() {
                    obj.remove("method");
                }

                // resolve the calling process (name, fullPath, warning) once per connection
                if process_info.is_none() {
                    process_info = Some(
                        tauri::async_runtime::spawn_blocking(move || {
                            process_info_from_peer(peer_port)
                        })
                        .await
                        .unwrap_or_else(|_| {
                            (PROCESS_NAME.to_string(), PROCESS_NAME.to_string(), false)
                        }),
                    );
                }
                let (pname, pfull, pwarn) = process_info.clone().unwrap_or_else(|| {
                    (PROCESS_NAME.to_string(), PROCESS_NAME.to_string(), false)
                });

                let (tx, rx) = oneshot::channel::<Value>();
                pending.lock().unwrap().insert(id.clone(), tx);
                connection_ids.insert(id.clone());

                let _ = app.emit(
                    "desktop://connect-popup/call",
                    json!({
                        "id": id,
                        "method": method,
                        "payload": rest,
                        "origin": origin,
                        "process": { "name": pname, "fullPath": pfull, "warning": pwarn },
                        "manifest": manifest_out,
                    }),
                );

                let sink = sink.clone();
                let pending = pending.clone();
                let id2 = id.clone();
                tokio::spawn(async move {
                    // Bound the wait so a renderer that never responds (window not ready, user
                    // dismissed) can't leak the pending entry + spawned task forever (Electron uses
                    // a 5-minute deferred timeout).
                    let outcome =
                        tokio::time::timeout(std::time::Duration::from_secs(300), rx).await;
                    // resolve_pending already removed the entry on a real response; on timeout/drop
                    // remove it ourselves.
                    pending.lock().unwrap().remove(&id2);
                    let response = match outcome {
                        Ok(Ok(mut response)) => {
                            if let Some(obj) = response.as_object_mut() {
                                obj.insert("id".into(), json!(id2));
                            }
                            response
                        }
                        _ => json!({
                            "id": id2,
                            "success": false,
                            "payload": { "error": "connect-popup response timeout" },
                            "error": "connect-popup response timeout",
                        }),
                    };
                    let _ = sink
                        .lock()
                        .await
                        .send(Message::Text(response.to_string().into()))
                        .await;
                });
            }
            _ => {}
        }
    }

    // Socket ended: drop this connection's still-pending calls and tell the renderer to close any
    // popup that is waiting on them (mirrors Electron's ws.on('close')).
    let mut had_pending = false;
    {
        let mut map = pending.lock().unwrap();
        for cid in &connection_ids {
            if map.remove(cid).is_some() {
                had_pending = true;
            }
        }
    }
    if had_pending {
        let _ = app.emit(
            "desktop://connect-popup/cancel",
            json!({ "error": "Connection closed" }),
        );
    }
}
