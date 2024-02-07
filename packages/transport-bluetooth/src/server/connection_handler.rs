use futures::{SinkExt, StreamExt};
use log::info;
use std::sync::Arc;
use tokio::net::{TcpListener, TcpStream};
use tokio::sync::broadcast;
use tokio::sync::Mutex;
use tokio_tungstenite::tungstenite::Result;
use tokio_tungstenite::{
    accept_async,
    tungstenite::{Message, Result as TResult},
};

use crate::server::adapter_manager::AdapterManager;
use crate::server::handle_message;
use crate::server::types::{AbortProcess, ChannelMessage};
use crate::server::utils;

async fn handle_connection(
    stream: TcpStream,
    manager: AdapterManager,
) -> TResult<()> {
    let peer = stream
        .peer_addr()
        .expect("connected streams should have a peer address");
    let ws_stream = accept_async(stream)
        .await
        .expect("Error during the websocket handshake occurred");
    info!("New WebSocket connection: {}", peer);
    let (ws_write, mut ws_read) = ws_stream.split();
    let (sender, mut receiver) = broadcast::channel::<ChannelMessage>(32);

    manager.watch_adapter(sender.clone()).await;

    // create websocket stream mutex to be shared between two threads
    let ws_write = Arc::new(Mutex::new(ws_write));

    // start thread and listen for ChannelMessages emitted by current connection processes
    let write_event = ws_write.clone();
    let channel_message_listener = tokio::spawn(async move {
        while let Ok(event) = receiver.recv().await {
            match event {
                ChannelMessage::Response(event) => {
                    let response = serde_json::to_string(&event).unwrap();
                    let mut write_remote = write_event.clone().lock_owned().await;
                    if let Err(_) = write_remote.send(Message::Text(response)).await {}
                }
                ChannelMessage::Notification(event) => {
                    info!("Sending notification {peer:?} {:?}", event);
                    let response = serde_json::to_string(&event).unwrap();
                    let mut write_remote = write_event.clone().lock_owned().await;
                    if let Err(_) = write_remote.send(Message::Text(response)).await {}
                }
                _ => {}
            }
        }
    });

    // in current thread keep listening for incoming websocket messages
    let write_response = ws_write.clone();
    while let Some(msg) = ws_read.next().await {
        // TODO: panic here computer sleep?
        let request = msg.unwrap_or(Message::Text("Unknown request".to_string()));
        let response = handle_message(request.clone(), manager.clone(), sender.clone()).await;

        match response {
            Some(response) => {
                let mut write_remote = write_response.clone().lock_owned().await;
                write_remote.send(response).await?;
                drop(write_remote);
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

pub async fn start(address: &str) -> Result<()> {
    let tcp_listener = TcpListener::bind(&address).await.expect("Failed to bind");
    info!("Version: {} Listening on: {}", utils::APP_VERSION, address);

    let manager = AdapterManager::new()
        .await
        .expect("Failed to initialize Manager");

    while let Ok((stream, _)) = tcp_listener.accept().await {
        tokio::spawn(handle_connection(
            stream,
            manager.clone(),
        ));
    }

    Ok(())
}
