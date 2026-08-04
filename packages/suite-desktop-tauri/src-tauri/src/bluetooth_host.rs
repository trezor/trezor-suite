//! In-process Bluetooth host — the Rust reimplementation of the `bluetooth-host` Node sidecar, so
//! the bundle carries no Node runtime at all.
//!
//! It reproduces three things the Node host did:
//! - spawns the native `trezor-bluetooth` server binary (BLE ↔ WS on 127.0.0.1:21327),
//! - runs the stateful `BluetoothIpc` logic (connect, scan, adapter events, device filtering),
//! - exposes the `@trezor/ipc-proxy` `Bluetooth` channel over a WebSocket (127.0.0.1:21329) that
//!   the Tauri preload's `window.ipcProxy` connects to — the exact same wire protocol as before.
//!
//! Wire protocols:
//! - preload ↔ host (ipc-proxy over ws): `{t:'invoke',id,channel,args}` / `{t:'send',channel,args}`
//!   → `{t:'invoke-res',id,ok,value}` / `{t:'event',channel,data}` (see the former ws-ipc-main.ts).
//! - host ↔ trezor-bluetooth (ws): `{id,method,params}` → `{id,payload}` / `{id,error}` /
//!   `{event,payload}` notifications.

use futures_util::{SinkExt, StreamExt};
use serde_json::{json, Value};
use std::collections::HashMap;
use std::process::Child;
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::{Arc, Mutex as StdMutex};
use tokio::sync::{oneshot, Mutex};
use tokio_tungstenite::tungstenite::Message;

const HOST_PORT: u16 = 21329;
const SERVER_PORT: u16 = 21327;

pub struct BluetoothHost {
    server_child: StdMutex<Option<Child>>,
}

impl BluetoothHost {
    pub fn new() -> Self {
        BluetoothHost {
            server_child: StdMutex::new(None),
        }
    }
    pub fn stop(&self) {
        if let Some(mut c) = self.server_child.lock().unwrap().take() {
            let _ = c.kill();
            let _ = c.wait();
        }
    }
}

/// Start the in-process bluetooth host: spawn the native server binary + serve the ipc-proxy WS.
/// `token` authenticates the preload's WS connection (per-launch shared secret).
pub fn start(host: Arc<BluetoothHost>, binary: Option<String>, token: String) {
    // spawn the native trezor-bluetooth server (unless one is already listening)
    if let Some(bin) = binary {
        if !service_up(SERVER_PORT) {
            let mut command = std::process::Command::new(&bin);
            command.env("TREZOR_BLUETOOTH_PORT", SERVER_PORT.to_string());
            // Harden like the Electron BaseProcess: kill the server if the app dies (Linux
            // PDEATHSIG) and detach stdio, so a crash never leaves an orphan holding :21327.
            match crate::proc::harden(&mut command).spawn() {
                Ok(child) => {
                    log::info!("bluetooth: spawned trezor-bluetooth server ({bin})");
                    *host.server_child.lock().unwrap() = Some(child);
                }
                Err(e) => log::error!("bluetooth: failed to spawn server binary: {e}"),
            }
        }
    }

    tauri::async_runtime::spawn(async move {
        run_ipc_server(token).await;
    });
}

fn service_up(port: u16) -> bool {
    use std::net::{SocketAddr, TcpStream};
    format!("127.0.0.1:{port}")
        .parse::<SocketAddr>()
        .ok()
        .and_then(|a| TcpStream::connect_timeout(&a, std::time::Duration::from_millis(300)).ok())
        .is_some()
}

// ---------------------------------------------------------------------------------------------
// trezor-bluetooth WS client (BluetoothIpc's `api`)
// ---------------------------------------------------------------------------------------------

type WsSink = futures_util::stream::SplitSink<
    tokio_tungstenite::WebSocketStream<tokio_tungstenite::MaybeTlsStream<tokio::net::TcpStream>>,
    Message,
>;

/// Connection to the native trezor-bluetooth server + the BluetoothIpc state.
struct BleApi {
    sink: Mutex<Option<WsSink>>,
    next_id: AtomicU64,
    pending: Arc<StdMutex<HashMap<String, oneshot::Sender<Result<Value, String>>>>>,
    /// event name -> listeners that forward to the ipc-proxy client
    event_tx: tokio::sync::broadcast::Sender<(String, Value)>,
    known_devices: StdMutex<Vec<Value>>,
    is_scanning: StdMutex<bool>,
    connected: StdMutex<bool>,
}

impl BleApi {
    fn new() -> Arc<Self> {
        let (event_tx, _) = tokio::sync::broadcast::channel(256);
        Arc::new(BleApi {
            sink: Mutex::new(None),
            next_id: AtomicU64::new(1),
            pending: Arc::new(StdMutex::new(HashMap::new())),
            event_tx,
            known_devices: StdMutex::new(Vec::new()),
            is_scanning: StdMutex::new(false),
            connected: StdMutex::new(false),
        })
    }

    /// Establish the WS connection to trezor-bluetooth and wire notifications (BluetoothIpc.connectApi).
    async fn connect(self: &Arc<Self>) -> Result<(), String> {
        if *self.connected.lock().unwrap() {
            return Ok(());
        }
        let url = format!("ws://127.0.0.1:{SERVER_PORT}/");
        let (ws, _) = tokio_tungstenite::connect_async(&url)
            .await
            .map_err(|e| format!("bluetooth server connect: {e}"))?;
        let (sink, mut stream) = ws.split();
        *self.sink.lock().await = Some(sink);
        *self.connected.lock().unwrap() = true;

        let pending = self.pending.clone();
        let event_tx = self.event_tx.clone();
        let this = self.clone();
        tokio::spawn(async move {
            while let Some(Ok(msg)) = stream.next().await {
                let Message::Text(text) = msg else { continue };
                let Ok(v) = serde_json::from_str::<Value>(&text) else { continue };
                // notification: { event, payload }
                if let Some(event) = v.get("event").and_then(|e| e.as_str()) {
                    this.on_notification(event, v.get("payload").cloned().unwrap_or(Value::Null), &event_tx);
                    continue;
                }
                // response: { id, payload } or { id, error }
                if let Some(id) = v.get("id").and_then(|i| i.as_str()) {
                    if let Some(tx) = pending.lock().unwrap().remove(id) {
                        let res = if let Some(err) = v.get("error").and_then(|e| e.as_str()) {
                            Err(err.to_string())
                        } else {
                            Ok(v.get("payload").cloned().unwrap_or(Value::Null))
                        };
                        let _ = tx.send(res);
                    }
                }
            }
            // Server WS dropped (crash/restart). Mark disconnected, tear down the sink, and reject
            // every in-flight request — otherwise their `rx.await` (e.g. connect_device mid-pairing)
            // hangs forever and the renderer promise never settles.
            *this.connected.lock().unwrap() = false;
            *this.sink.lock().await = None;
            let drained: Vec<_> = pending.lock().unwrap().drain().map(|(_, tx)| tx).collect();
            for tx in drained {
                let _ = tx.send(Err("bluetooth server connection lost".to_string()));
            }
        });
        Ok(())
    }

    /// BluetoothIpc.connectApi event wiring → ipc-proxy events.
    fn on_notification(
        self: &Arc<Self>,
        event: &str,
        payload: Value,
        event_tx: &tokio::sync::broadcast::Sender<(String, Value)>,
    ) {
        let emit_list_update = |devices: &Value| {
            let filtered = self.filter_connectable(devices);
            let _ = event_tx.send(("device-list-update".to_string(), filtered));
        };
        match event {
            "device_discovered" | "device_connected" | "device_disconnected" => {
                emit_list_update(payload.get("devices").unwrap_or(&Value::Null));
            }
            "device_updated" => {
                let devices = payload.get("devices").cloned().unwrap_or(Value::Null);
                emit_list_update(&devices);
                let filtered = self.filter_connectable(&devices);
                if let (Some(id), Some(arr)) = (payload.get("id").and_then(|i| i.as_str()), filtered.as_array())
                {
                    if let Some(dev) = arr.iter().find(|d| d.get("id").and_then(|x| x.as_str()) == Some(id)) {
                        let _ = event_tx.send(("device-update".to_string(), dev.clone()));
                    }
                }
            }
            "adapter_state_changed" => {
                let state = payload.get("state").cloned().unwrap_or(Value::Null);
                let _ = event_tx.send(("adapter-event".to_string(), state.clone()));
                if state.as_str() == Some("enabled") && *self.is_scanning.lock().unwrap() {
                    let this = self.clone();
                    tokio::spawn(async move {
                        let _ = this.send("start_scan", json!({})).await;
                    });
                }
            }
            "device_connection_status" => {
                // JS BluetoothIpc.connectDevice temporarily subscribes to this during pairing and
                // re-emits it as `device-update`, which drives the pairing-progress UI (connecting /
                // pin / connected). The renderer only reacts to it while connecting, so a global
                // subscription is equivalent. Without this arm the whole pairing flow shows no progress.
                let device = payload.get("device").cloned().unwrap_or(Value::Null);
                let _ = event_tx.send(("device-update".to_string(), device));
            }
            "open_bluetooth_settings" => {
                let _ = event_tx.send(("open-bluetooth-settings".to_string(), payload));
            }
            _ => {}
        }
    }

    /// filterConnectableDevices: known || paired || pairing-mode (data[0] > 0).
    fn filter_connectable(&self, devices: &Value) -> Value {
        let known = self.known_devices.lock().unwrap();
        let arr = devices.as_array().cloned().unwrap_or_default();
        let filtered: Vec<Value> = arr
            .into_iter()
            .filter(|d| {
                let mac = d.get("macAddress").and_then(|m| m.as_str());
                let is_known = known.iter().any(|k| k.get("macAddress").and_then(|m| m.as_str()) == mac);
                let paired = d.get("paired").and_then(|p| p.as_bool()).unwrap_or(false);
                let pairing = d
                    .get("data")
                    .and_then(|x| x.as_array())
                    .and_then(|a| a.first())
                    .and_then(|b| b.as_u64())
                    .map(|b| b > 0)
                    .unwrap_or(false);
                is_known || paired || pairing
            })
            .collect();
        json!(filtered)
    }

    /// Send a request to the trezor-bluetooth server and await its response.
    async fn send(self: &Arc<Self>, method: &str, params: Value) -> Result<Value, String> {
        let id = self.next_id.fetch_add(1, Ordering::SeqCst).to_string();
        let (tx, rx) = oneshot::channel();
        self.pending.lock().unwrap().insert(id.clone(), tx);
        let msg = json!({ "id": id, "method": method, "params": params }).to_string();
        {
            let mut guard = self.sink.lock().await;
            let sink = guard.as_mut().ok_or("bluetooth server not connected")?;
            sink.send(Message::text(msg)).await.map_err(|e| e.to_string())?;
        }
        rx.await.map_err(|_| "bluetooth request dropped".to_string())?
    }
}

// ---------------------------------------------------------------------------------------------
// BluetoothIpc methods (ipc-proxy 'Bluetooth' surface)
// ---------------------------------------------------------------------------------------------

/// Dispatch a BluetoothIpc method call (mirrors bluetooth-ipc-main.ts + modules/bluetooth.ts).
/// Runs a BluetoothIpc method and returns its FULL result value (an IpcResponse-shaped object or a
/// bare value). `None` means the method is unknown — the caller mirrors a thrown handler by replying
/// `{success:false,error}`. Everything else is wrapped verbatim in `{success:true, payload:<result>}`
/// by the caller, exactly like Electron's createIpcProxyHandler; the renderer then inspects the
/// inner `.success` itself. (Do NOT flatten the inner success here — that made init resolve to null
/// and turned normal BluetoothIpc `{success:false}` results into promise rejections.)
async fn ipc_request(api: &Arc<BleApi>, method: &str, params: &[Value]) -> Option<Value> {
    let ok = json!({ "success": true });
    Some(match method {
        "init" => {
            if let Some(state) = params.first() {
                if let Some(known) = state.get("knownDevices").and_then(|k| k.as_array()) {
                    *api.known_devices.lock().unwrap() = known.clone();
                }
            }
            // with known devices, connect + set_state + start_scan (best-effort)
            let has_known = !api.known_devices.lock().unwrap().is_empty();
            if has_known {
                if api.connect().await.is_ok() {
                    let devices = api.known_devices.lock().unwrap().clone();
                    let _ = api.send("set_state", json!({ "devices": devices })).await;
                    let _ = api.send("start_scan", json!({})).await;
                }
            }
            ok
        }
        "getInfo" => match api.connect().await {
            Ok(()) => match api.send("get_info", json!({})).await {
                Ok(info) => json!({ "success": true, "payload": info }),
                Err(e) => json!({ "success": false, "error": e }),
            },
            Err(e) => json!({ "success": false, "error": e }),
        },
        "startScan" => {
            if let Err(e) = api.connect().await {
                return Some(json!({ "success": false, "error": e }));
            }
            match api.send("start_scan", json!({})).await {
                Ok(res) => {
                    *api.is_scanning.lock().unwrap() = true;
                    let devices = res.get("devices").cloned().unwrap_or(json!([]));
                    let _ = api.event_tx.send(("device-list-update".into(), api.filter_connectable(&devices)));
                    ok
                }
                Err(e) => json!({ "success": false, "error": e }),
            }
        }
        "stopScan" => {
            let _ = api.connect().await;
            if api.known_devices.lock().unwrap().is_empty() {
                *api.is_scanning.lock().unwrap() = false;
                let _ = api.send("stop_scan", json!({})).await;
            }
            ok
        }
        "connectDevice" => {
            let id = params.first().and_then(|v| v.as_str()).unwrap_or("");
            if let Err(e) = api.connect().await {
                return Some(json!({ "success": false, "error": e }));
            }
            // macOS pairing workaround: kill searchpartyuseragent for an unpaired device
            #[cfg(target_os = "macos")]
            {
                if let Ok(devices) = api.send("enumerate", json!({})).await {
                    let paired = devices
                        .get("devices")
                        .and_then(|d| d.as_array())
                        .and_then(|a| a.iter().find(|d| d.get("id").and_then(|x| x.as_str()) == Some(id)))
                        .and_then(|d| d.get("paired").and_then(|p| p.as_bool()))
                        .unwrap_or(false);
                    if !paired {
                        let _ = std::process::Command::new("pkill").arg("searchpartyuseragent").status();
                    }
                }
            }
            match api.send("connect_device", json!({ "id": id, "timeout": 30000 })).await {
                Ok(_) => ok,
                Err(e) => json!({ "success": false, "error": e }),
            }
        }
        "disconnectDevice" | "forgetDevice" => {
            let id = params.first().and_then(|v| v.as_str()).unwrap_or("");
            let server_method = if method == "disconnectDevice" { "disconnect_device" } else { "forget_device" };
            let _ = api.connect().await;
            match api.send(server_method, json!({ "id": id })).await {
                Ok(_) => ok,
                Err(e) => json!({ "success": false, "error": e }),
            }
        }
        "enumerateDevices" => match api.connect().await {
            Ok(()) => match api.send("enumerate", json!({})).await {
                Ok(res) => api.filter_connectable(res.get("devices").unwrap_or(&Value::Null)),
                Err(_) => json!([]),
            },
            Err(_) => json!([]),
        },
        "dispose" => ok,
        _ => return None,
    })
}

// ---------------------------------------------------------------------------------------------
// ipc-proxy WS server (preload's window.ipcProxy)
// ---------------------------------------------------------------------------------------------

async fn run_ipc_server(token: String) {
    let api = BleApi::new();
    let listener = match tokio::net::TcpListener::bind(("127.0.0.1", HOST_PORT)).await {
        Ok(l) => l,
        Err(e) => {
            log::error!("bluetooth: ipc-proxy bind 127.0.0.1:{HOST_PORT} failed: {e}");
            return;
        }
    };
    log::info!("bluetooth: ipc-proxy WS server listening on 127.0.0.1:{HOST_PORT}");
    loop {
        let Ok((stream, _)) = listener.accept().await else { continue };
        let api = api.clone();
        let token = token.clone();
        tokio::spawn(async move {
            handle_ipc_conn(stream, api, token).await;
        });
    }
}

async fn handle_ipc_conn(stream: tokio::net::TcpStream, api: Arc<BleApi>, token: String) {
    // authenticate the preload connection via ?token= in the handshake URL
    let mut authed = token.is_empty();
    let ws = match tokio_tungstenite::accept_hdr_async(
        stream,
        |req: &tokio_tungstenite::tungstenite::handshake::server::Request, resp| {
            if !token.is_empty() {
                let q = req.uri().query().unwrap_or("");
                let provided = q
                    .split('&')
                    .find_map(|kv| kv.strip_prefix("token="))
                    .unwrap_or("");
                if provided == token {
                    authed = true;
                }
            }
            Ok(resp)
        },
    )
    .await
    {
        Ok(ws) => ws,
        Err(e) => {
            log::debug!("bluetooth: ipc handshake failed: {e}");
            return;
        }
    };
    if !authed {
        log::error!("bluetooth: ipc-proxy rejected connection with bad/absent token");
        return;
    }

    let (sink, mut stream) = ws.split();
    let sink = Arc::new(Mutex::new(sink));

    // forward BLE events to this connection's registered listeners
    // map: eventName -> ipcEventName (the add-listener registration)
    let listeners: Arc<StdMutex<HashMap<String, String>>> = Arc::new(StdMutex::new(HashMap::new()));
    {
        let mut rx = api.event_tx.subscribe();
        let sink = sink.clone();
        let listeners = listeners.clone();
        tokio::spawn(async move {
            while let Ok((event, payload)) = rx.recv().await {
                let ipc_event = listeners.lock().unwrap().get(&event).cloned();
                if let Some(ipc_event) = ipc_event {
                    // ipc-proxy event listeners are called with an array payload
                    let msg = json!({ "t": "event", "channel": ipc_event, "data": [payload] }).to_string();
                    let _ = sink.lock().await.send(Message::text(msg)).await;
                }
            }
        });
    }

    while let Some(Ok(msg)) = stream.next().await {
        let Message::Text(text) = msg else { continue };
        let Ok(v) = serde_json::from_str::<Value>(&text) else { continue };
        let t = v.get("t").and_then(|x| x.as_str()).unwrap_or("");
        let channel = v.get("channel").and_then(|c| c.as_str()).unwrap_or("").to_string();

        match t {
            "invoke" => {
                // only 'Bluetooth/create' — just ack
                let id = v.get("id").cloned().unwrap_or(Value::Null);
                let res = json!({ "t": "invoke-res", "id": id, "ok": true, "value": Value::Null });
                let _ = sink.lock().await.send(Message::text(res.to_string())).await;
            }
            "send" => {
                let args = v.get("args").cloned().unwrap_or(json!([]));
                let args = args.as_array().cloned().unwrap_or_default();
                if channel.ends_with("/request") {
                    // args = [responseEvent, method, methodArgs]
                    let response_event = args.first().and_then(|x| x.as_str()).unwrap_or("").to_string();
                    let method = args.get(1).and_then(|x| x.as_str()).unwrap_or("").to_string();
                    let method_args = args.get(2).and_then(|x| x.as_array()).cloned().unwrap_or_default();
                    let api = api.clone();
                    let sink = sink.clone();
                    tokio::spawn(async move {
                        // Mirror Electron's createIpcProxyHandler: wrap the WHOLE handler return
                        // value in {success:true, payload:<result>} (the renderer reads .payload then
                        // inspects the inner .success itself); reply {success:false,error} only for
                        // the throw-equivalent (unknown method → None).
                        let response = match ipc_request(&api, &method, &method_args).await {
                            Some(payload) => json!({ "success": true, "payload": payload }),
                            None => json!({ "success": false, "error": format!("unknown method {method}") }),
                        };
                        let msg = json!({ "t": "event", "channel": response_event, "data": response }).to_string();
                        let _ = sink.lock().await.send(Message::text(msg)).await;
                    });
                } else if channel.ends_with("/add-listener") {
                    // args = [eventName, ipcEventName]
                    if let (Some(ev), Some(ipc)) = (
                        args.first().and_then(|x| x.as_str()),
                        args.get(1).and_then(|x| x.as_str()),
                    ) {
                        listeners.lock().unwrap().insert(ev.to_string(), ipc.to_string());
                    }
                } else if channel.ends_with("/remove-listener") {
                    if let Some(ev) = args.first().and_then(|x| x.as_str()) {
                        listeners.lock().unwrap().remove(ev);
                    }
                }
            }
            _ => {}
        }
    }
}
