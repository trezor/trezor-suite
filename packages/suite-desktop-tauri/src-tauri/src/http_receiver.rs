//! Local HTTP server on 127.0.0.1:21335 — the Tauri equivalent of the Electron
//! `suite-desktop-core/src/libs/http-receiver.ts` + `modules/http-receiver.ts`.
//!
//! Serves:
//! - `/status` — always-on status page
//! - `/oauth` — OAuth (Google/Dropbox labeling) redirect endpoint → `oauth/response` event + focus
//! - `/buy-redirect`, `/sell-redirect`, `/exchange-redirect` — trading partner redirects → focus
//! - `/buy-post` — auto-submitting POST form forwarder
//! - `/connect-ws` — WebSocket upgrade for third-party dApp connect calls (see `connect_ws.rs`)
//!
//! Like Electron, the sensitive routes are inactive until the renderer requests their address via
//! `server/request-address` (route activation), and referer allowlists are enforced.

use axum::{
    extract::{ws::WebSocketUpgrade, Query, State},
    http::{header, HeaderMap, StatusCode},
    response::{Html, IntoResponse, Response},
    routing::get,
    Router,
};
use serde_json::json;
use std::collections::{HashMap, HashSet};
use std::sync::{Arc, Mutex};
use tauri::{AppHandle, Emitter, Manager};

use crate::connect_ws::{self, PendingMap};

pub const PORT: u16 = 21335;

pub struct HttpReceiverState {
    active_routes: Mutex<HashSet<String>>,
}

pub type SharedReceiver = Arc<HttpReceiverState>;

pub fn new_state() -> SharedReceiver {
    Arc::new(HttpReceiverState {
        active_routes: Mutex::new(HashSet::new()),
    })
}

pub fn base_url() -> String {
    format!("http://127.0.0.1:{PORT}")
}

/// `server/request-address` — activate the route and return its address (Electron
/// HttpServer.getRouteAddress + activateRoute).
pub fn request_address(state: &SharedReceiver, pathname: &str) -> Option<String> {
    const ROUTES: [&str; 5] = [
        "/oauth",
        "/buy-redirect",
        "/buy-post",
        "/sell-redirect",
        "/exchange-redirect",
    ];
    const TRADING_REDIRECTS: [&str; 3] =
        ["/buy-redirect", "/sell-redirect", "/exchange-redirect"];
    if !ROUTES.contains(&pathname) {
        return None;
    }
    state
        .active_routes
        .lock()
        .unwrap()
        .insert(pathname.to_string());

    // On macOS/Windows the trading-redirect partner return URL should re-open Suite via the OS
    // deep-link handler, not the browser's localhost page (Electron modules/http-receiver.ts).
    let use_deeplink = cfg!(target_os = "macos") || cfg!(windows);
    if use_deeplink && TRADING_REDIRECTS.contains(&pathname) {
        return Some(format!("trezorsuite:{pathname}"));
    }

    Some(format!("{}{}", base_url(), pathname))
}

fn is_active(state: &SharedReceiver, pathname: &str) -> bool {
    state.active_routes.lock().unwrap().contains(pathname)
}

/// Referer allowlist (Electron `allowReferers`): `""` allows requests without a Referer header,
/// `*.domain` allows any subdomain, otherwise the referer host must match exactly.
fn referer_allowed(headers: &HeaderMap, allowed: &[&str]) -> bool {
    let referer = headers
        .get(header::REFERER)
        .and_then(|v| v.to_str().ok())
        .unwrap_or("");
    if referer.is_empty() {
        return allowed.contains(&"");
    }
    // extract host[:port] from the referer URL
    let host = referer
        .split("//")
        .nth(1)
        .unwrap_or(referer)
        .split('/')
        .next()
        .unwrap_or("");
    let host_no_port = host.split(':').next().unwrap_or(host);
    allowed.iter().any(|a| match a.strip_prefix("*.") {
        Some(suffix) => host_no_port.ends_with(&format!(".{suffix}")) || host_no_port == suffix,
        None => host == *a || host_no_port == *a,
    })
}

fn escape_html(s: &str) -> String {
    s.replace('&', "&amp;").replace('<', "&lt;").replace('>', "&gt;")
}

fn escape_attr(s: &str) -> String {
    escape_html(s).replace('"', "&quot;")
}

/// Electron `applyTemplate` (without the inlined logo image — cosmetic only).
fn apply_template(content: &str) -> Html<String> {
    Html(format!(
        r#"<!DOCTYPE html>
<html>
    <head>
        <title>Trezor Suite</title>
        <style>
            body, html {{
              width: 100%; height: 100%; margin: 0; padding: 0;
              font-family: "Segoe UI", "Helvetica Neue", Arial, sans-serif;
              display: flex; flex-direction: column; justify-content: center; align-items: center;
            }}
            a {{ text-decoration: none; cursor: pointer; color: #171717; font-weight: 500; }}
            a:hover {{ text-decoration: underline; }}
        </style>
    </head>
    <body>
        {content}
        <a style="margin-top:40px" href="trezorsuite://">Go back to Trezor Suite</a>
    </body>
</html>"#
    ))
}

fn status_page(app: &AppHandle, ws_enabled: bool) -> Html<String> {
    let version = app.package_info().version.to_string();
    let (cls, label) = if ws_enabled { ("on", "Enabled") } else { ("off", "Disabled") };
    Html(format!(
        r#"<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="utf-8" />
        <title>Trezor Suite – Status</title>
        <style>
            body {{ margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center;
                font-family: system-ui, "Segoe UI", "Helvetica Neue", Arial, sans-serif; color: #171717; background: #f7f7f7; }}
            main {{ width: 320px; padding: 24px; background: #fff; border: 1px solid #ebebeb; border-radius: 12px; }}
            h1 {{ margin: 0 0 4px; font-size: 16px; font-weight: 600; }}
            p {{ margin: 0 0 20px; font-size: 13px; color: #757575; }}
            .row {{ display: flex; align-items: center; justify-content: space-between; padding: 10px 0;
                border-top: 1px solid #ebebeb; font-size: 14px; }}
            .value {{ display: inline-flex; align-items: center; gap: 8px; font-weight: 500; }}
            .value::before {{ content: ""; width: 8px; height: 8px; border-radius: 50%; background: currentColor; }}
            .value.on {{ color: #21963b; }}
            .value.off {{ color: #b0b0b0; }}
        </style>
    </head>
    <body>
        <main>
            <h1>Trezor Suite</h1>
            <p>Local HTTP server is running · v{version}.</p>
            <div class="row"><span class="label">Connect popup WebSocket</span><span class="value {cls}">{label}</span></div>
        </main>
    </body>
</html>"#
    ))
}

/// Show + focus the main window (Electron `app.focus({ steal: true })`).
pub fn focus_main_window(app: &AppHandle) {
    if let Some(win) = crate::window::main_window(app) {
        let _ = win.show();
        if win.is_minimized().unwrap_or(false) {
            let _ = win.unminimize();
        }
        let _ = win.set_focus();
    }
}

#[derive(Clone)]
struct Ctx {
    app: AppHandle,
    state: SharedReceiver,
    pending: PendingMap,
}

pub async fn run_server(app: AppHandle, state: SharedReceiver, pending: PendingMap) {
    let ctx = Ctx { app, state, pending };

    let router = Router::new()
        .route("/status", get(handle_status))
        .route("/oauth", get(handle_oauth))
        .route("/buy-redirect", get(handle_buy_redirect))
        .route("/buy-post", get(handle_buy_post))
        .route("/sell-redirect", get(handle_sell_redirect))
        .route("/exchange-redirect", get(handle_exchange_redirect))
        .route("/connect-ws", get(handle_connect_ws))
        .with_state(ctx);

    let listener = match tokio::net::TcpListener::bind(("127.0.0.1", PORT)).await {
        Ok(l) => l,
        Err(e) => {
            log::error!("http-receiver: bind 127.0.0.1:{PORT} failed: {e}");
            return;
        }
    };
    log::info!("http-receiver: listening on 127.0.0.1:{PORT}");
    // ConnectInfo exposes the peer socket address so connect-ws can resolve the calling process.
    let service = router.into_make_service_with_connect_info::<std::net::SocketAddr>();
    if let Err(e) = axum::serve(listener, service).await {
        log::error!("http-receiver: server error: {e}");
    }
}

fn connect_ws_enabled(app: &AppHandle) -> bool {
    let store = app.state::<crate::store::Store>();
    !store
        .connect_settings()
        .get("disableWs")
        .and_then(|v| v.as_bool())
        .unwrap_or(false)
}

async fn handle_status(State(ctx): State<Ctx>) -> Response {
    status_page(&ctx.app, connect_ws_enabled(&ctx.app)).into_response()
}

async fn handle_oauth(
    State(ctx): State<Ctx>,
    headers: HeaderMap,
    req: axum::extract::Request,
) -> Response {
    if !is_active(&ctx.state, "/oauth") {
        return StatusCode::NOT_FOUND.into_response();
    }
    // No referer is sent by Google, Dropbox sends referer when using Safari
    if !referer_allowed(&headers, &["", "127.0.0.1", "www.dropbox.com"]) {
        return StatusCode::FORBIDDEN.into_response();
    }
    let uri = req.uri();
    let search = uri.query().map(|q| format!("?{q}")).unwrap_or_default();

    let _ = ctx.app.emit(
        "desktop://oauth/response",
        json!({ "key": "trezor-oauth", "search": search }),
    );
    focus_main_window(&ctx.app);

    apply_template("You may now close this window.").into_response()
}

async fn trading_redirect(ctx: &Ctx, route: &str, allowed: &[&str], headers: &HeaderMap) -> Response {
    if !is_active(&ctx.state, route) {
        return StatusCode::NOT_FOUND.into_response();
    }
    if !referer_allowed(headers, allowed) {
        return StatusCode::FORBIDDEN.into_response();
    }
    // It is enough to focus the Suite: it should be on a page with the trade status already.
    focus_main_window(&ctx.app);

    apply_template("You may now close this window.").into_response()
}

async fn handle_buy_redirect(State(ctx): State<Ctx>, headers: HeaderMap) -> Response {
    trading_redirect(&ctx, "/buy-redirect", &["", "localhost:3000", "*.invity.io", "invity.io"], &headers)
        .await
}

async fn handle_sell_redirect(State(ctx): State<Ctx>, headers: HeaderMap) -> Response {
    trading_redirect(&ctx, "/sell-redirect", &[""], &headers).await
}

async fn handle_exchange_redirect(State(ctx): State<Ctx>, headers: HeaderMap) -> Response {
    trading_redirect(&ctx, "/exchange-redirect", &[""], &headers).await
}

async fn handle_buy_post(
    State(ctx): State<Ctx>,
    headers: HeaderMap,
    Query(params): Query<HashMap<String, String>>,
) -> Response {
    if !is_active(&ctx.state, "/buy-post") {
        return StatusCode::NOT_FOUND.into_response();
    }
    if !referer_allowed(&headers, &[""]) {
        return StatusCode::FORBIDDEN.into_response();
    }
    // action has to be a valid http(s) URL, otherwise refuse
    let Some(action) = params.get("a") else {
        return apply_template("Error").into_response();
    };
    if !(action.starts_with("https://") || action.starts_with("http://")) {
        return Html("invalid request".to_string()).into_response();
    }

    let inputs: String = params
        .iter()
        .filter(|(k, _)| k.as_str() != "a")
        .map(|(k, v)| {
            format!(
                r#"<input type="hidden" name="{}" value="{}">"#,
                escape_attr(k),
                escape_attr(v)
            )
        })
        .collect();

    let content = format!(
        r#"Forwarding to {}...
        <form id="buy-form" method="POST" action="{}">{}</form>
        <script type="text/javascript">document.getElementById("buy-form").submit();</script>"#,
        escape_html(action),
        escape_attr(action),
        inputs
    );

    apply_template(&content).into_response()
}

#[cfg(test)]
mod tests {
    use super::*;
    use axum::http::HeaderValue;

    fn headers_with_referer(value: &str) -> HeaderMap {
        let mut h = HeaderMap::new();
        if !value.is_empty() {
            h.insert(header::REFERER, HeaderValue::from_str(value).unwrap());
        }
        h
    }

    #[test]
    fn referer_empty_allowed_only_when_listed() {
        assert!(referer_allowed(&headers_with_referer(""), &[""]));
        assert!(!referer_allowed(&headers_with_referer(""), &["127.0.0.1"]));
    }

    #[test]
    fn referer_exact_and_wildcard() {
        // buy-redirect allowlist
        let allowed = &["", "localhost:3000", "*.invity.io", "invity.io"];
        assert!(referer_allowed(&headers_with_referer("https://foo.invity.io/x"), allowed));
        assert!(referer_allowed(&headers_with_referer("https://invity.io/x"), allowed));
        assert!(referer_allowed(&headers_with_referer("http://localhost:3000/x"), allowed));
        assert!(!referer_allowed(&headers_with_referer("https://evil.com/x"), allowed));
        // a look-alike suffix must not pass the wildcard
        assert!(!referer_allowed(&headers_with_referer("https://notinvity.io/x"), allowed));
    }

    #[test]
    fn request_address_gates_and_activates() {
        let state = new_state();
        assert_eq!(request_address(&state, "/unknown"), None);
        assert!(!is_active(&state, "/oauth"));
        let addr = request_address(&state, "/oauth").unwrap();
        assert_eq!(addr, "http://127.0.0.1:21335/oauth");
        assert!(is_active(&state, "/oauth"));
    }
}

async fn handle_connect_ws(
    State(ctx): State<Ctx>,
    axum::extract::ConnectInfo(peer): axum::extract::ConnectInfo<std::net::SocketAddr>,
    headers: HeaderMap,
    ws: WebSocketUpgrade,
) -> Response {
    if !connect_ws_enabled(&ctx.app) {
        return StatusCode::NOT_FOUND.into_response();
    }
    let origin = headers
        .get(header::ORIGIN)
        .and_then(|v| v.to_str().ok())
        .unwrap_or("")
        .to_string();
    let app = ctx.app.clone();
    let pending = ctx.pending.clone();
    let peer_port = peer.port();
    ws.on_upgrade(move |socket| {
        connect_ws::handle_socket(socket, origin, peer_port, app, pending)
    })
}
