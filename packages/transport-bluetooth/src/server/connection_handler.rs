use futures::{SinkExt, StreamExt};
use log::info;
use std::sync::Arc;
use tokio::net::TcpListener;
use tokio::sync::broadcast;
use tokio::sync::Mutex;
use hyper::{body::{Bytes, Incoming}, Response as HyperResponse};
use hyper_tungstenite::{tungstenite::{Message}, HyperWebsocket};
use hyper_util::rt::TokioIo;
use http_body_util::Full;

use crate::server::adapter_manager::AdapterManager;
use crate::server::handle_message;
use crate::server::types::{AbortProcess, ChannelMessage};
use crate::server::utils;


type Error = Box<dyn std::error::Error + Send + Sync + 'static>;

async fn handle_ws_connection(peer: String, websocket: HyperWebsocket, manager: AdapterManager) -> Result<(), Error> {
    info!("New WebSocket connection: {peer}");
    let mut websocket = websocket.await?;
    let (ws_write, mut ws_read) = websocket.split();
    let (sender, mut receiver) = broadcast::channel::<ChannelMessage>(32);

    manager.watch_adapter(sender.clone()).await;

    // create websocket stream mutex to be shared between two threads
    let ws_write = Arc::new(Mutex::new(ws_write));

    // start thread and listen for ChannelMessages emitted by current connection processes
    let ws_write_event = ws_write.clone();
    let channel_message_listener = tokio::spawn(async move {
        while let Ok(event) = receiver.recv().await {
            match event {
                ChannelMessage::Notification(event) => {
                    info!("Sending notification {peer} {:?}", event);
                    let response = serde_json::to_string(&event).unwrap();
                    let mut ws = ws_write_event.lock().await;
                    if let Err(err) = ws.send(response.into()).await {
                        info!("Error sending notification {:?}", err);
                    };
                    drop(ws);
                }
                _ => {
                    info!("ChannelMessage listener {:?}", event);
                }
            }
        }
    });

    // in current thread keep listening for incoming websocket messages
    let ws_write_response = ws_write.clone();
    while let Some(msg) = ws_read.next().await {
        // TODO: panic thrown here when computer suspended?
        let request = msg.unwrap_or(Message::text("Unknown request"));
        let response = handle_message(request.clone(), manager.clone(), sender.clone()).await;

        match response {
            Some(response) => {
                let mut ws = ws_write_response.lock().await;
                if let Err(err) = ws.send(response).await {
                    info!("Error writing response {:?}", err);
                };
                drop(ws);
            }
            None => {
                info!("No response for the request {:?}", request);
            }
        }
    }

    // peer disconnected
    manager.stop_watching(&sender).await;
    channel_message_listener.abort();

    if let Err(err) = sender.send(ChannelMessage::Abort(AbortProcess::Disconnect)) {
        info!("---> Closing connection error {}", err);
    }

    info!("---> Closing connection...");

    Ok(())
}

async fn handle_http_request(peer: String, mut req: hyper::Request<Incoming>, manager: AdapterManager) -> Result<HyperResponse<Full<Bytes>>, Error> {
    // TODO: cors check like trezord-go and node-bridge
    // let = req.headers().get("origin");

    if hyper_tungstenite::is_upgrade_request(&req) {
        let (response, websocket) = hyper_tungstenite::upgrade(req, None).unwrap();
        tokio::spawn(async move {
            handle_ws_connection(peer, websocket, manager).await
        });
        Ok(response)
    } else {
        // TODO: serve index.html file
        Ok(HyperResponse::new(Full::<Bytes>::from("OK")))
    }
}

pub async fn start(address: &str) -> Result<(), Error> {
    let tcp_listener = TcpListener::bind(&address).await.expect("Failed to bind");
    info!("Version: {} Listening on: {}", utils::APP_VERSION, address);

    let manager = AdapterManager::new()
        .await
        .expect("Failed to initialize AdapterManager");

    let mut http = hyper::server::conn::http1::Builder::new();
    http.keep_alive(true);

    loop {
        let (stream, _) = tcp_listener.accept().await?;
        let peer = stream
            .peer_addr()
            .expect("connected streams should have a peer address");

        let manager = manager.clone();
        let service = hyper::service::service_fn(move |req| {
            handle_http_request(peer.to_string(), req, manager.clone())
        });

        let connection = http
            .serve_connection(TokioIo::new(stream), service)
            .with_upgrades();

        tokio::spawn(async move {
            if let Err(err) = connection.await {
                println!("Error serving HTTP connection: {err:?}");
            }
        });
    }
}
