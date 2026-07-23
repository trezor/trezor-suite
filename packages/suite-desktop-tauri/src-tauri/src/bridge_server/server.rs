//! The trezord HTTP API on 127.0.0.1:21328 — the Rust port of `transport-bridge/src/http.ts`
//! + `core.ts`. Endpoints: /enumerate /listen /acquire /release /abort /call /read /post + info.

use axum::{
    extract::{Path, Request, State},
    http::{header, HeaderMap, HeaderValue, Method, StatusCode},
    middleware::{self, Next},
    response::{IntoResponse, Response},
    routing::{get, post},
    Router,
};
use serde_json::{json, Value};
use std::sync::Arc;

use super::protocol::{self, Message};
use super::sessions::{Descriptor, Sessions};
use super::thp::{self, ThpMode, ThpState};
use super::transport::Transport;

pub const PORT: u16 = 21328;
const VERSION: &str = "3.2.1";

pub struct BridgeState {
    pub transport: Transport,
    pub sessions: Arc<Sessions>,
}

pub type Shared = Arc<BridgeState>;

fn text(status: StatusCode, body: String) -> Response {
    (
        status,
        [(axum::http::header::CONTENT_TYPE, "text/plain")],
        body,
    )
        .into_response()
}

fn ok_json<T: serde::Serialize>(v: &T) -> Response {
    text(StatusCode::OK, serde_json::to_string(v).unwrap_or_default())
}

fn err_json(code: &str, message: &str) -> Response {
    text(
        StatusCode::BAD_REQUEST,
        json!({ "error": code, "message": message }).to_string(),
    )
}

/// Origin gate (http.ts): allow same-host direct nav (no Origin), else check the allowlist.
fn origin_allowed(headers: &HeaderMap) -> bool {
    let origin = headers
        .get(axum::http::header::ORIGIN)
        .and_then(|v| v.to_str().ok());
    match origin {
        None => true, // direct navigation / non-browser
        Some(o) => {
            let host = o.split("//").nth(1).unwrap_or(o).split('/').next().unwrap_or("");
            let host = host.split(':').next().unwrap_or(host);
            const ALLOWED: [&str; 4] = ["localhost", "127.0.0.1", "sldev.cz", "trezor.io"];
            // Only the single Trezor onion host, not any *.onion — matching transport-bridge
            // http.ts allowedOrigin. A wildcard would let any hidden service drive the device.
            const TREZOR_ONION: &str =
                "trezoriovpjcahpzkrewelclulmszwbqpzmzgub37gbcjlvluxtruqad.onion";
            ALLOWED.iter().any(|a| host == *a || host.ends_with(&format!(".{a}")))
                || host == TREZOR_ONION
        }
    }
}

/// CORS for the webview → bridge fetches (the Rust equivalent of TrezordNode's
/// `Access-Control-Allow-Origin` middleware, plus preflight handling).
///
/// The Suite webview runs on a foreign origin (`tauri://localhost` on macOS, `http://tauri.localhost`
/// elsewhere) and calls the bridge cross-origin, so the browser blocks every response that lacks
/// `Access-Control-Allow-Origin`. On top of that, the non-simple requests — `/listen` sends
/// `application/json`, `/call`+`/post` send `application/octet-stream` — trigger an `OPTIONS`
/// preflight, which the POST-only routes would answer with `405`. Without this middleware the device
/// enumerates in the bridge but never reaches the app. The per-handler `origin_allowed` gate stays
/// authoritative for the actual data; here we only echo the header for gate-allowed origins.
async fn cors_layer(req: Request, next: Next) -> Response {
    let origin = req
        .headers()
        .get(header::ORIGIN)
        .and_then(|v| v.to_str().ok())
        .map(str::to_owned);
    let allowed = origin_allowed(req.headers());
    let requested_headers = req
        .headers()
        .get(header::ACCESS_CONTROL_REQUEST_HEADERS)
        .and_then(|v| v.to_str().ok())
        .map(str::to_owned);

    let method = req.method().clone();
    let path = req.uri().path().to_string();

    // Enforce the origin gate for EVERY route (not just /enumerate + /listen), matching the JS
    // global middleware (http.ts:254-297): a disallowed origin must never reach acquire/call/read/
    // post/release/abort. Otherwise a malicious web page could drive the device with a simple
    // cross-origin POST (the browser only blocks it from reading the response, not from executing).
    // Denied → 403 for /enumerate + /listen, 404 for everything else, like trezord-go. OPTIONS
    // preflight is still answered (204) but without CORS headers, so the browser fails it anyway.
    if !allowed && method != Method::OPTIONS {
        let status = if path == "/enumerate" || path == "/listen" {
            StatusCode::FORBIDDEN
        } else {
            StatusCode::NOT_FOUND
        };
        log::info!("bridge: {method} {path} (origin=DENIED) -> {status}");
        return status.into_response();
    }

    // Answer the preflight directly — the routes only accept GET/POST and would otherwise 405.
    let mut res = if req.method() == Method::OPTIONS {
        StatusCode::NO_CONTENT.into_response()
    } else {
        next.run(req).await
    };

    log::info!(
        "bridge: {method} {path} (origin={}) -> {}",
        if allowed { "allowed" } else { "DENIED" },
        res.status(),
    );

    if allowed {
        if let Some(v) = origin.and_then(|o| HeaderValue::from_str(&o).ok()) {
            res.headers_mut().insert(header::ACCESS_CONTROL_ALLOW_ORIGIN, v);
        }
        res.headers_mut().insert(
            header::ACCESS_CONTROL_ALLOW_METHODS,
            HeaderValue::from_static("GET, POST, OPTIONS"),
        );
        let allow_headers = requested_headers
            .and_then(|h| HeaderValue::from_str(&h).ok())
            .unwrap_or_else(|| HeaderValue::from_static("Content-Type"));
        res.headers_mut()
            .insert(header::ACCESS_CONTROL_ALLOW_HEADERS, allow_headers);
    }
    res
}

pub async fn run(state: Shared) {
    let router = Router::new()
        .route("/", get(handle_root).post(handle_info))
        .route("/configure", post(handle_info))
        .route("/status", get(handle_status))
        .route("/enumerate", post(handle_enumerate))
        .route("/listen", post(handle_listen))
        .route("/acquire/:path/:previous", post(handle_acquire))
        .route("/release/:session", post(handle_release))
        .route("/abort/:session", post(handle_abort))
        .route("/call/:session", post(handle_call))
        .route("/read/:session", post(handle_read))
        .route("/post/:session", post(handle_post))
        .layer(middleware::from_fn(cors_layer))
        .with_state(state);

    let listener = match tokio::net::TcpListener::bind(("127.0.0.1", PORT)).await {
        Ok(l) => l,
        Err(e) => {
            log::error!("bridge: bind 127.0.0.1:{PORT} failed: {e}");
            return;
        }
    };
    log::info!("bridge: trezord HTTP server listening on 127.0.0.1:{PORT}");
    if let Err(e) = axum::serve(listener, router).await {
        log::error!("bridge: server error: {e}");
    }
}

async fn handle_root() -> Response {
    (
        StatusCode::MOVED_PERMANENTLY,
        [(axum::http::header::LOCATION, format!("http://127.0.0.1:{PORT}/status"))],
    )
        .into_response()
}

async fn handle_info() -> Response {
    text(
        StatusCode::OK,
        json!({ "version": VERSION, "protocolMessages": true, "githash": "not provided" })
            .to_string(),
    )
}

async fn handle_status() -> Response {
    (
        StatusCode::OK,
        [(axum::http::header::CONTENT_TYPE, "text/html")],
        format!("<!DOCTYPE html><title>Trezor Bridge</title><body>Trezor Bridge (Rust) v{VERSION} running.</body>"),
    )
        .into_response()
}

async fn enumerate(state: &Shared) -> Vec<Descriptor> {
    match state.transport.enumerate().await {
        Some(devices) => state.sessions.enumerate_done(devices).await,
        // enumeration failed transiently — return the last-known descriptors, don't wipe sessions
        None => state.sessions.current_descriptors().await,
    }
}

async fn handle_enumerate(State(state): State<Shared>, headers: HeaderMap) -> Response {
    if !origin_allowed(&headers) {
        return StatusCode::FORBIDDEN.into_response();
    }
    ok_json(&enumerate(&state).await)
}

async fn handle_listen(
    State(state): State<Shared>,
    headers: HeaderMap,
    body: String,
) -> Response {
    if !origin_allowed(&headers) {
        return StatusCode::FORBIDDEN.into_response();
    }
    // the client sends its last-known descriptors; hold until the set differs.
    let client: Vec<Value> = serde_json::from_str(&body).unwrap_or_default();
    let client_key = descriptors_key_json(&client);

    let mut rx = state.sessions.subscribe();
    // fast path: already changed
    let current = state.sessions.current_descriptors().await;
    if descriptors_key(&current) != client_key {
        return ok_json(&current);
    }
    // wait for a change (bounded so a stuck client eventually gets a response)
    let deadline = tokio::time::Instant::now() + std::time::Duration::from_secs(30);
    loop {
        if tokio::time::timeout_at(deadline, rx.changed()).await.is_err() {
            return ok_json(&state.sessions.current_descriptors().await);
        }
        let current = rx.borrow_and_update().clone();
        if descriptors_key(&current) != client_key {
            return ok_json(&current);
        }
    }
}

/// Compare descriptors on the fields the JS `checkAffectedSubscriptions` uses.
fn descriptors_key(d: &[Descriptor]) -> String {
    let mut parts: Vec<String> = d
        .iter()
        .map(|x| {
            format!(
                "{}|{}|{:?}|{:?}|{}|{:?}",
                x.path, x.device_type, x.vendor, x.product, x.session.as_deref().unwrap_or(""), x.session_owner
            )
        })
        .collect();
    parts.sort();
    parts.join(",")
}

fn descriptors_key_json(d: &[Value]) -> String {
    let mut parts: Vec<String> = d
        .iter()
        .map(|x| {
            format!(
                "{}|{}|{:?}|{:?}|{}|{:?}",
                x.get("path").and_then(|v| v.as_str()).unwrap_or(""),
                x.get("type").and_then(|v| v.as_u64()).unwrap_or(0),
                x.get("vendor").and_then(|v| v.as_u64()),
                x.get("product").and_then(|v| v.as_u64()),
                x.get("session").and_then(|v| v.as_str()).unwrap_or(""),
                x.get("sessionOwner").and_then(|v| v.as_str()),
            )
        })
        .collect();
    parts.sort();
    parts.join(",")
}

async fn handle_acquire(
    State(state): State<Shared>,
    Path((path, previous)): Path<(String, String)>,
    body: String,
) -> Response {
    let session_owner = serde_json::from_str::<Value>(&body)
        .ok()
        .and_then(|v| v.get("sessionOwner").and_then(|s| s.as_str()).map(String::from));
    match state.sessions.acquire(&state.transport, &path, &previous, session_owner).await {
        Ok(session) => ok_json(&json!({ "session": session })),
        Err(e) => err_json(&e, &e),
    }
}

async fn handle_release(State(state): State<Shared>, Path(session): Path<String>) -> Response {
    match state.sessions.release(&state.transport, &session).await {
        Ok(()) => ok_json(&json!({ "session": session })),
        Err(e) => err_json(&e, &e),
    }
}

async fn handle_abort(State(state): State<Shared>, Path(session): Path<String>) -> Response {
    // minimal: report success if the session currently maps to a device (a call may be in-flight)
    if state.sessions.internal_by_session(&session).await.is_some() {
        ok_json(&json!({ "success": true }))
    } else {
        err_json("session not found", "session not found")
    }
}

/// Parsed BridgeProtocolMessage request body.
struct ProtoBody {
    protocol: String,
    data: Vec<u8>,
    thp_state: Option<ThpState>,
}

fn parse_proto_body(body: &str, data_required: bool) -> Result<ProtoBody, Response> {
    let v: Value = serde_json::from_str(body).map_err(|_| err_json("unexpected-error", "invalid body"))?;
    let protocol = v.get("protocol").and_then(|p| p.as_str()).unwrap_or("bridge").to_string();
    let data_hex = v.get("data").and_then(|d| d.as_str()).unwrap_or("");
    if data_required && data_hex.is_empty() {
        return Err(err_json("unexpected-error", "missing data"));
    }
    let data = hex::decode(data_hex).map_err(|_| err_json("unexpected-error", "invalid hex"))?;
    let thp_state = v
        .get("thpState")
        .filter(|s| !s.is_null())
        .and_then(|s| serde_json::from_value::<ThpState>(s.clone()).ok());
    Ok(ProtoBody { protocol, data, thp_state })
}

/// Build the BridgeProtocolMessage response body.
fn proto_response(protocol: &str, data: &[u8], thp_state: Option<&ThpState>) -> Value {
    let mut out = json!({ "protocol": protocol, "data": hex::encode(data) });
    if let Some(s) = thp_state {
        out["thpState"] = serde_json::to_value(s).unwrap_or(Value::Null);
    }
    out
}

async fn handle_call(State(state): State<Shared>, Path(session): Path<String>, body: String) -> Response {
    proto_op(&state, &session, &body, ThpMode::Call, true).await
}
async fn handle_read(State(state): State<Shared>, Path(session): Path<String>, body: String) -> Response {
    proto_op(&state, &session, &body, ThpMode::Receive, false).await
}
async fn handle_post(State(state): State<Shared>, Path(session): Path<String>, body: String) -> Response {
    proto_op(&state, &session, &body, ThpMode::Send, true).await
}

async fn proto_op(
    state: &Shared,
    session: &str,
    body: &str,
    mode: ThpMode,
    data_required: bool,
) -> Response {
    let parsed = match parse_proto_body(body, data_required) {
        Ok(p) => p,
        Err(r) => return r,
    };
    let Some(internal) = state.sessions.internal_by_session(session).await else {
        return err_json("session not found", "session not found");
    };
    // per-device I/O isolation (runInIsolation)
    let _io = state.sessions.io_lock(&internal).await;

    if parsed.protocol == "v2" {
        let Some(mut thp_state) = parsed.thp_state else {
            return err_json("ThpStateError", "ThpStateError");
        };
        let chunks = thp::create_chunks(&parsed.data);
        let transport = state.transport.clone();
        let internal2 = internal.clone();
        let internal3 = internal.clone();
        let result = thp::thp_loop(
            chunks,
            &mut thp_state,
            |chunk| {
                let t = transport.clone();
                let p = internal2.clone();
                async move { t.write(&p, &chunk).await }
            },
            || {
                let t = transport.clone();
                let p = internal3.clone();
                async move { t.read(&p).await }
            },
            mode,
        )
        .await;
        return match result {
            Ok(res) => {
                let data = hex::decode(&res.response_hex).unwrap_or_default();
                ok_json(&proto_response("v2", &data, Some(&thp_state)))
            }
            Err(e) => err_json("unexpected-error", &e),
        };
    }

    // v1 / bridge
    let is_bridge = parsed.protocol == "bridge";
    // Decode the request message only for modes that write. `/read` (Receive) carries NO request
    // data by design — the client sends `{"protocol":"v1","data":""}` (createProtocolMessage with
    // an empty buffer) — so decoding there would reject every valid read with 400.
    let decode_request = |data: &[u8]| {
        if is_bridge {
            protocol::bridge_decode(data)
        } else {
            // v1: the data already is the full 3f2323 frame; parse type/len for re-chunking
            parse_v1_frame(data)
        }
    };

    let response_msg = match mode {
        ThpMode::Send => {
            // write only
            let msg = match decode_request(&parsed.data) {
                Ok(m) => m,
                Err(e) => return err_json("unexpected-error", &e),
            };
            if let Err(e) = v1_write(state, &internal, &msg).await {
                return err_json("unexpected-error", &e);
            }
            None
        }
        ThpMode::Receive => match v1_read(state, &internal).await {
            Ok(m) => Some(m),
            Err(e) => return err_json("unexpected-error", &e),
        },
        ThpMode::Call => {
            let msg = match decode_request(&parsed.data) {
                Ok(m) => m,
                Err(e) => return err_json("unexpected-error", &e),
            };
            if let Err(e) = v1_write(state, &internal, &msg).await {
                return err_json("unexpected-error", &e);
            }
            match v1_read(state, &internal).await {
                Ok(m) => Some(m),
                Err(e) => return err_json("unexpected-error", &e),
            }
        }
    };

    let out_data = match response_msg {
        Some(m) if is_bridge => protocol::bridge_encode(&m),
        Some(m) => protocol::v1_encode(&m),
        None => Vec::new(),
    };
    ok_json(&proto_response(&parsed.protocol, &out_data, None))
}

fn parse_v1_frame(bytes: &[u8]) -> Result<Message, String> {
    if bytes.len() < 9 || bytes[0] != 0x3f || bytes[1] != 0x23 || bytes[2] != 0x23 {
        return Err("invalid v1 frame".into());
    }
    let message_type = u16::from_be_bytes([bytes[3], bytes[4]]);
    let length = u32::from_be_bytes([bytes[5], bytes[6], bytes[7], bytes[8]]) as usize;
    let payload = &bytes[9..];
    Ok(Message {
        message_type,
        payload: payload[..length.min(payload.len())].to_vec(),
    })
}

async fn v1_write(state: &Shared, internal: &str, msg: &Message) -> Result<(), String> {
    let encoded = protocol::v1_encode(msg);
    for chunk in protocol::create_chunks(&encoded) {
        state.transport.write(internal, &chunk).await?;
    }
    Ok(())
}

async fn v1_read(state: &Shared, internal: &str) -> Result<Message, String> {
    let transport = state.transport.clone();
    let internal = internal.to_string();
    protocol::read_v1_message(|| {
        let t = transport.clone();
        let p = internal.clone();
        async move { t.read(&p).await }
    })
    .await
}
