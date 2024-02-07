use log::info;
use tokio::sync::broadcast::Sender;
use hyper_tungstenite::tungstenite::Message;

use crate::server::types::{
    ChannelMessage, WsError, WsRequest, WsRequestMethod, WsResponse,
};

use crate::server::adapter_manager::AdapterManager;
use crate::server::methods;

pub async fn handle_message(
    message: Message,
    manager: AdapterManager,
    sender: Sender<ChannelMessage>,
) -> Option<Message> {
    let msg: Option<String> = match message {
        Message::Text(msg) => {
            Some(msg.to_string().into())
        },
        Message::Binary(msg) => {
            let msg_str = msg.escape_ascii().to_string();
            if msg_str == "PING" {
                return Some("PONG".to_string().into());
            }
            None
        },
        Message::Ping(msg) => {
            None
        },
        Message::Close(msg) => {
            if let Some(msg) = &msg {
                info!("Received close message with code {} and message: {}", msg.code, msg.reason);
            } else {
                info!("Received close message");
            }
            None
        },
        _msg => {
            // info!("Skipping message: {:?}", msg);
            None
        }
    };

    if msg.is_none() {
        return None;
    }

    if msg.clone().unwrap().to_string() == "PING" {
        return Some(Message::text("PONG".to_string()));
    }

    info!("handle_message Received message from: {:?}", msg.clone());

    let json = serde_json::from_str::<WsRequest>(&msg.unwrap().to_string());
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
        WsRequestMethod::ConnectDevice(id) => methods::connect_device(id, manager).await,
        WsRequestMethod::DisconnectDevice(id) => {
            methods::disconnect_device(id, manager, sender).await
        }
        WsRequestMethod::OpenDevice(id) => methods::open_device(id, manager, sender).await,
        WsRequestMethod::CloseDevice(id) => methods::close_device(id, manager, sender).await,
        WsRequestMethod::Read(id) => methods::read(id, manager, sender).await,
        WsRequestMethod::Write(id, data) => methods::write(id, data, manager, sender).await,
        WsRequestMethod::ForgetDevice(id) => methods::forget_device(id, manager, sender).await,
        WsRequestMethod::SetState(state) => methods::set_state(state, manager, sender).await,
    };

    match payload {
        Ok(payload) => {
            info!("Process response ok {:?}", payload);
            // let json = serde_json::to_string(&payload);
            let json = serde_json::to_string(&WsResponse {
                id: request.id.to_string(),
                method: request.method,
                payload: payload,
            });
            if json.is_err() {
                return None;
            }
            return Some(Message::text(json.unwrap()));
        }
        Err(err) => {
            info!("Process response error {}", err);
            let json = serde_json::to_string(&WsError {
                id: request.id.to_string(),
                method: request.method,
                error: err.to_string(),
            });

            return Some(Message::text(json.unwrap()));
        }
    }
}
