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
use tokio::net::TcpListener;
use tokio::sync::broadcast;
use tokio::sync::Mutex;

use crate::server::handle_message;
use crate::server::types::{AbortProcess, ChannelMessage};
use crate::server::utils;

#[derive(Debug, thiserror::Error)]
pub enum ServerError {
    #[error("WebSocket error: {0}")]
    WebSocketError(#[from] hyper_tungstenite::tungstenite::Error),

    #[error("HTTP error: {0}")]
    HttpError(#[from] hyper::Error),

    #[error("IO error: {0}")]
    IoError(#[from] std::io::Error),
}

async fn handle_ws_connection(peer: String, websocket: HyperWebsocket) -> Result<(), ServerError> {
    info!("WebSocket connection: {peer}");

    let websocket = websocket.await?;
    let (ws_write, mut ws_read) = websocket.split();
    let (sender, mut receiver) = broadcast::channel::<ChannelMessage>(32);

    // create websocket stream mutex to be shared between two threads
    let ws_write = Arc::new(Mutex::new(ws_write));

    // start thread and listen for ChannelMessages emitted by current connection processes
    let ws_write_event = ws_write.clone();
    let channel_message_listener = tokio::spawn(async move {
        while let Ok(event) = receiver.recv().await {
            match event {
                ChannelMessage::Notification(event) => {
                    info!("Sending notification to peer {peer}");
                    let response = match serde_json::to_string(&event) {
                        Ok(json) => json,
                        Err(err) => {
                            info!("Error serialize notification {err:?}");
                            return;
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
        let sender = sender.clone();
        // spawn new thread and process request
        tokio::spawn(async move {
            let response = handle_message(request.clone(), sender).await;
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
    channel_message_listener.abort();

    if let Err(err) = sender.send(ChannelMessage::Abort(AbortProcess::ClientDisconnected)) {
        info!("AbortProcess not sent {err}");
    }

    info!("Closing websocket connection");

    Ok(())
}

async fn handle_http_request(
    peer: String,
    req: hyper::Request<Incoming>,
) -> Result<HyperResponse<Full<Bytes>>, ServerError> {
    // TODO: cors check like trezord-go and node-bridge
    // let = req.headers().get("origin");

    if hyper_tungstenite::is_upgrade_request(&req) {
        let (response, websocket) = match hyper_tungstenite::upgrade(req, None) {
            Ok(r) => r,
            Err(e) => {
                info!("Failed to upgrade WebSocket: {e:?}");
                return Ok(HyperResponse::new(Full::<Bytes>::from("Upgrade failed")));
            }
        };
        tokio::spawn(async move {
            if let Err(err) = handle_ws_connection(peer.clone(), websocket).await {
                log::error!("WebSocket connection error for peer {}: {:?}", peer, err);

                match err {
                    ServerError::WebSocketError(ws_err) => {
                        log::debug!("WebSocket protocol error: {}", ws_err);
                    }
                    ServerError::IoError(io_err) => {
                        log::warn!("IO error in WebSocket connection: {}", io_err);
                    }
                    ServerError::HttpError(http_err) => {
                        log::warn!("HTTP error in WebSocket connection: {}", http_err);
                    }
                }
            }
        });
        Ok(response)
    } else {
        // TODO: serve index.html file
        Ok(HyperResponse::new(Full::<Bytes>::from("OK")))
    }
}

pub async fn start_server(address: &str) -> Result<(), ServerError> {
    let tcp_listener = TcpListener::bind(&address).await.expect("Failed to bind");
    info!("Version: {} Listening on: {}", utils::APP_VERSION, address);

    let mut http = hyper::server::conn::http1::Builder::new();
    http.keep_alive(true);

    loop {
        let (stream, _) = tcp_listener.accept().await?;
        let peer = stream.peer_addr().expect("Missing peer address");

        let service =
            hyper::service::service_fn(move |req| handle_http_request(peer.to_string(), req));

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
