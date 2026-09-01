use futures::{SinkExt, StreamExt};
use http_body_util::Full;
use hyper::{
    body::{Bytes, Incoming},
    Response as HyperResponse,
};
use hyper_tungstenite::{tungstenite::Message, HyperWebsocket};
use hyper_util::rt::TokioIo;
use log::info;
use std::sync::Arc;
use tokio::{
    net::TcpListener,
    sync::{broadcast::error::RecvError, Mutex},
};

use crate::server::{
    adapter_manager::{AdapterError, AdapterManager},
    connection_broadcast::{ConnectionBroadcast, ConnectionBroadcastError},
    handle_message,
    types::{AbortProcess, ChannelMessage},
    utils,
};

#[derive(Debug, thiserror::Error)]
pub enum ServerError {
    #[error("WebSocketError: {0}")]
    WebSocket(#[from] hyper_tungstenite::tungstenite::Error),

    #[error("HTTPError: {0}")]
    Http(#[from] hyper::Error),

    #[error("IOError: {0}")]
    Io(#[from] std::io::Error),

    #[error("ConnectionBroadcastError: {0}")]
    ConnectionBroadcast(#[from] ConnectionBroadcastError),

    #[error("AdapterManagerError: {0}")]
    AdapterManager(#[from] AdapterError),
}

async fn handle_ws_connection(
    peer: String,
    websocket: HyperWebsocket,
    manager: AdapterManager,
) -> Result<(), ServerError> {
    info!("WebSocket connection: {peer}");

    let websocket = websocket.await?;
    let (ws_write, mut ws_read) = websocket.split();
    let broadcast = ConnectionBroadcast::new(peer.clone())?;
    let mut receiver = broadcast.subscribe();

    manager.add_listener(broadcast.clone()).await;

    // create websocket stream mutex to be shared between two threads
    let ws_write = Arc::new(Mutex::new(ws_write));

    // start thread and listen for ChannelMessages emitted by current connection processes
    let ws_write_event = ws_write.clone();
    let ws_write_peer = peer.clone();
    let channel_message_listener = tokio::spawn(async move {
        loop {
            let event = match receiver.recv().await {
                Ok(event) => event,
                Err(RecvError::Lagged(skipped)) => {
                    // Keep the loop alive, exiting here would silently stop
                    // event delivery while the websocket stays open.
                    info!("ChannelMessage listener lagged, {skipped} events skipped");
                    continue;
                }
                Err(RecvError::Closed) => break,
            };

            match event {
                ChannelMessage::Notification(event) => {
                    info!("Sending notification to peer {ws_write_peer}");
                    let response = match serde_json::to_string(&event) {
                        Ok(json) => json,
                        Err(err) => {
                            info!("Error serialize notification {err:?}");
                            continue;
                        }
                    };

                    let mut ws = ws_write_event.lock().await;
                    if let Err(err) = ws.send(response.into()).await {
                        info!("Error sending notification {err:?}");
                    };
                }
                _ => {
                    info!("ChannelMessage listener {event:?}");
                }
            }
        }
    });

    // in current thread keep listening for incoming websocket messages
    let ws_write_method = ws_write.clone();
    while let Some(msg) = ws_read.next().await {
        // TODO: panic thrown here when computer suspended (macos?)
        // fallback to empty json. it should fail in handle_message serialization
        let request = msg.unwrap_or(Message::text("{}"));
        let ws_write_method = Arc::clone(&ws_write_method);

        let broadcast_ref = broadcast.clone();
        let manager = manager.clone();
        // spawn new thread and process request
        tokio::spawn(async move {
            let response = handle_message(request.clone(), broadcast_ref, manager).await;
            match response {
                Some(response) => {
                    let mut ws = ws_write_method.lock().await;
                    if let Err(err) = ws.send(response).await {
                        info!("Error response to ws {err:?}");
                    };
                }
                None => {
                    info!("No response request {request:?}");
                }
            }
        });
    }

    // peer disconnected
    manager.remove_listener(&broadcast).await;
    channel_message_listener.abort();

    broadcast.send(ChannelMessage::Abort(AbortProcess::ClientDisconnected(
        peer,
    )));

    info!("Closing websocket connection");

    Ok(())
}

pub const INDEX_HTML: &str = if cfg!(debug_assertions) {
    include_str!("../../build/index.html")
} else {
    "ok"
};

async fn handle_http_request(
    peer: String,
    req: hyper::Request<Incoming>,
    manager: AdapterManager,
    ws_token: Arc<Option<String>>,
) -> Result<HyperResponse<Full<Bytes>>, ServerError> {
    if hyper_tungstenite::is_upgrade_request(&req) {
        if let Some(ref expected_token) = *ws_token {
            let is_token_valid = req
                .headers()
                .get("authorization")
                .and_then(|value| value.to_str().ok())
                .and_then(|value| value.strip_prefix("Bearer "))
                .is_some_and(|token| token == expected_token);

            if !is_token_valid {
                info!("Missing or invalid websocket Authorization token");
                info!("- Peer: {peer}");

                // Stealth rejection: return error to close connection without sending response
                return Err(ServerError::Io(std::io::Error::new(
                    std::io::ErrorKind::ConnectionReset,
                    "",
                )));
            }
        }

        let (response, websocket) = match hyper_tungstenite::upgrade(req, None) {
            Ok(r) => r,
            Err(e) => {
                info!("Failed to upgrade WebSocket: {e:?}");
                return Ok(HyperResponse::new(Full::<Bytes>::from("Upgrade failed")));
            }
        };
        tokio::spawn(async move {
            if let Err(err) = handle_ws_connection(peer.clone(), websocket, manager).await {
                log::error!("WebSocket connection error for peer {}: {:?}", peer, err);

                match err {
                    ServerError::WebSocket(ws_err) => {
                        log::debug!("WebSocket protocol error: {}", ws_err);
                    }
                    ServerError::Io(io_err) => {
                        log::warn!("IO error in WebSocket connection: {}", io_err);
                    }
                    ServerError::Http(http_err) => {
                        log::warn!("HTTP error in WebSocket connection: {}", http_err);
                    }
                    ServerError::ConnectionBroadcast(err) => {
                        log::warn!("ConnectionBroadcastError {err}");
                    }
                    ServerError::AdapterManager(adapter_err) => {
                        log::warn!("AdapterManagerError {adapter_err}");
                    }
                }
            }
        });
        Ok(response)
    } else {
        // In debug builds serve the UI
        // Stealth rejection in release builds to avoid fingerprinting the service
        if cfg!(debug_assertions) {
            Ok(HyperResponse::new(Full::<Bytes>::from(INDEX_HTML)))
        } else {
            Err(ServerError::Io(std::io::Error::new(
                std::io::ErrorKind::ConnectionReset,
                "",
            )))
        }
    }
}

pub async fn start_server(address: &str) -> Result<(), ServerError> {
    let tcp_listener = TcpListener::bind(&address).await?;
    info!("Version: {} Listening on: {}", utils::APP_VERSION, address);

    let ws_token = Arc::new(match std::env::var("TREZOR_BLUETOOTH_AUTH_TOKEN") {
        Ok(token) if !token.trim().is_empty() => Some(token),
        _ => {
            if cfg!(debug_assertions) {
                log::warn!("WebSocket auth disabled");
                None
            } else {
                return Err(ServerError::Io(std::io::Error::new(
                    std::io::ErrorKind::InvalidInput,
                    "TREZOR_BLUETOOTH_AUTH_TOKEN is missing",
                )));
            }
        }
    });

    let manager = AdapterManager::new().await?;

    let mut http = hyper::server::conn::http1::Builder::new();
    http.keep_alive(true);

    loop {
        let (stream, _) = tcp_listener.accept().await?;
        let peer = stream.peer_addr()?;
        let manager = manager.clone();
        let ws_token = ws_token.clone();
        let service = hyper::service::service_fn(move |req| {
            handle_http_request(peer.to_string(), req, manager.clone(), ws_token.clone())
        });

        let connection = http
            .serve_connection(TokioIo::new(stream), service)
            .with_upgrades();

        tokio::spawn(async move {
            if let Err(err) = connection.await {
                info!("HTTP connection error {err:?}");
            }
        });
    }
}
