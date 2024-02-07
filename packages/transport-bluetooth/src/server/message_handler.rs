use log::info;
use tokio::sync::broadcast::Sender;
use tokio_tungstenite::tungstenite::Message;

use crate::server::types::{
    ChannelMessage, WsError, WsRequest, WsRequestMethod, WsResponse,
};

use crate::server::adapter_manager::AdapterManager;
use crate::server::methods;

pub async fn handle_message(
    msg: Message,
    manager: AdapterManager,
    sender: Sender<ChannelMessage>,
) -> Option<Message> {
    if !msg.is_text() {
        // ping is sent by the browser WebSocket when host is suspended
        if msg.to_string() == "PING" {
            return Some(Message::Text("PONG".to_string()));
        }
        return None;
    }

    info!("handle_message Received message from: {}", msg.to_string());

    // if let Err(request) = serde_json::from_str::<WsRequest>(&msg.to_string()) {
    let json = serde_json::from_str::<WsRequest>(&msg.to_string());
    if json.is_err() {
        info!("Serde json error: {:?}", json);
        return None;
    }
    let request = json.unwrap();

    info!("Method: {:?}", request);

    let payload = match request.method.clone() {
        WsRequestMethod::StartScan() => methods::start_scan(manager, sender).await,
        WsRequestMethod::StopScan() => methods::stop_scan(manager, sender).await,
        WsRequestMethod::GetInfo() => methods::get_info(manager).await,
        WsRequestMethod::Enumerate() => methods::enumerate(manager, sender).await,
        WsRequestMethod::ConnectDevice(uuid) => methods::connect_device(uuid, manager).await,
        WsRequestMethod::DisconnectDevice(uuid) => {
            methods::disconnect_device(uuid, manager, sender).await
        }
        WsRequestMethod::OpenDevice(uuid) => methods::open_device(uuid, manager, sender).await,
        WsRequestMethod::CloseDevice(uuid) => methods::close_device(uuid, manager, sender).await,
        WsRequestMethod::Read(uuid) => methods::read(uuid, manager, sender).await,
        WsRequestMethod::Write(uuid, data) => methods::write(uuid, data, manager, sender).await,
        WsRequestMethod::ForgetDevice(uuid) => methods::forget_device(uuid, manager, sender).await,
    };

    match payload {
        Ok(payload) => {
            info!("Process response ok {:?}", payload);
            // let json = serde_json::to_string(&payload);
            let json = serde_json::to_string(&WsResponse {
                id: request.id.clone(),
                method: request.method,
                payload: payload,
            });
            if json.is_err() {
                return None;
            }
            return Some(Message::Text(json.unwrap()));
        }
        Err(err) => {
            info!("Process response error {}", err);
            let json = serde_json::to_string(&WsError {
                id: request.id.clone(),
                method: request.method,
                error: err.to_string(),
            });

            return Some(Message::Text(json.unwrap()));
        }
    }
}
