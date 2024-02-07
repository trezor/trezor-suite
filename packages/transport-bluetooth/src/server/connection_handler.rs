use btleplug::platform::Manager;
use dashmap::DashMap;
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

use crate::server::handle_message;
use crate::server::events_stream::start_events_stream;
use crate::server::platform::get_adapter_info;
use crate::server::types::{
    AbortProcess, ChannelMessage, ConnectionState, NotificationEvent, SharedChannelMessage,
};
use crate::server::utils;

async fn handle_connection(
    stream: TcpStream,
    broadcast: broadcast::Sender<SharedChannelMessage>,
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

    // https://doc.rust-lang.org/book/ch16-03-shared-state.html
    let state = Arc::new(Mutex::new(ConnectionState {
        subscriptions: vec![],
        advertisements: DashMap::new(),
    }));

    if let Err(err) = get_adapter_info().await {
        info!("get_adapter_info error {:?}", err);
    }

    let manager = Manager::new().await.expect("BLEManager error");
    // - windows and mac (?) create new stateless instance of the Adapter every time manager.adapters() is called
    // - linux keep reference(s) for once initialized adapters
    // - linux throws error if adapter is disabled
    let adapter_mutex = Arc::new(Mutex::new(utils::get_adapter(&manager, None).await));

    // system specific behavior. if CentralState is poweredOff
    // - windows and macos returns the Adapter object
    // - linux (bluez) returns nothing
    // once Adapter is found and assigned it correctly reports it's state change (on/off)
    // start thread and wait until Adapter is enabled.
    // send AdapterStateChanged notification once enabled
    let adp_sender = sender.clone();
    let adp_manager = manager.clone();
    let adp_adapter = adapter_mutex.clone();
    let adp_state = state.clone();
    let adapter_watcher = tokio::spawn(async move {
        loop {
            let adapter = adp_adapter.lock().await;
            if adapter.is_some() {
                info!("Adapter found. Breaking the loop.");
                let _ = start_events_stream(adapter.as_ref().unwrap(), adp_state, adp_sender.clone()).await;
                break;
            }
            // unlock?
            drop(adapter);

            info!("Waiting for Adapter");
            tokio::time::sleep(tokio::time::Duration::from_secs(2)).await;
            let adapter = utils::get_adapter(&adp_manager, None).await;
            if adapter.is_some() {
                let mut val = adp_adapter.lock().await;
                *val = adapter;

                info!("Adapter found. Breaking the loop.");
                if let Err(_) = adp_sender.send(ChannelMessage::Notification(
                    NotificationEvent::AdapterStateChanged { powered: true },
                )) {}
                break;
            }
        }
    });

    // create websocket stream mutex to be shared between two threads
    let ws_write = Arc::new(Mutex::new(ws_write));

    // start thread and listen for ChannelMessages emitted by current connection processes
    let write_event = ws_write.clone();
    let send_to_all = broadcast.clone();
    let channel_message_listener = tokio::spawn(async move {
        while let Ok(event) = receiver.recv().await {
            match event {
                ChannelMessage::Response(event) => {
                    let response = serde_json::to_string(&event).unwrap();
                    let mut write_remote = write_event.clone().lock_owned().await;
                    if let Err(_) = write_remote.send(Message::Text(response)).await {}
                }
                ChannelMessage::Notification(event) => {
                    info!("Sending notification {:?}", event);
                    let response = serde_json::to_string(&event).unwrap();
                    let mut write_remote = write_event.clone().lock_owned().await;
                    if let Err(_) = write_remote.send(Message::Text(response)).await {}
                    match event {
                        NotificationEvent::DeviceConnected { uuid, devices } => {
                            if let Err(_) = send_to_all.send(SharedChannelMessage::Notification(
                                peer,
                                NotificationEvent::DeviceConnected { uuid, devices },
                            )) {}
                        }
                        _ => {}
                    }
                }
                _ => {}
            }
        }
    });

    // start thread and listen for SharedChannelMessage emitted by other connection processes
    let write_event = ws_write.clone();
    let mut listener = broadcast.subscribe();
    let broadcast_message_listener = tokio::spawn(async move {
        while let Ok(event) = listener.recv().await {
            match event {
                SharedChannelMessage::Notification(addr, event) => {
                    if peer != addr {
                        info!("Sending shared notification {:?}", event);
                        let response = serde_json::to_string(&event).unwrap();
                        let mut write_remote = write_event.clone().lock_owned().await;
                        if let Err(_) = write_remote.send(Message::Text(response)).await {}
                    }
                }
            }
        }
    });

    // in current thread keep listening for incoming websocket messages
    let write_response = ws_write.clone();
    while let Some(msg) = ws_read.next().await {
        // TODO: panic here computer sleep?
        let request = msg.unwrap_or(Message::Text("Unknown request".to_string()));
        let adapter = adapter_mutex.lock().await;

        let response = handle_message(
            request.clone(),
            Arc::clone(&state),
            adapter.clone(),
            sender.clone(),
        )
        .await;
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
    adapter_watcher.abort();
    channel_message_listener.abort();
    broadcast_message_listener.abort();

    if let Err(err) = sender.send(ChannelMessage::Abort(AbortProcess::Disconnect)) {
        info!("---> Closing connection error {}", err);
    }

    info!("---> Closing connection...");

    Ok(())
}

pub async fn start(address: &str) -> Result<()> {
    let tcp_listener = TcpListener::bind(&address).await.expect("Failed to bind");
    info!("Version: {} Listening on: {}", utils::APP_VERSION, address);
    let (broadcast, _) = broadcast::channel::<SharedChannelMessage>(32);

    while let Ok((stream, _)) = tcp_listener.accept().await {
        tokio::spawn(handle_connection(stream, broadcast.clone()));
    }

    Ok(())
}
