use log::info;
use tokio::sync::broadcast::Sender;
use tokio_tungstenite::tungstenite::Message;

use btleplug::platform::Adapter;

use crate::server::types::{
    ChannelMessage, ConnectionStateMutex, WsRequest, WsRequestMethod, WsResponse,
    WsResponseFailure, WsResponsePayload,
};

use crate::server::methods;

pub async fn handle_message(
    msg: Message,
    state: ConnectionStateMutex,
    adapter: Option<Adapter>,
    sender: Sender<ChannelMessage>,
) -> Option<Message> {
    if !msg.is_text() {
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
        WsRequestMethod::StartScan() => methods::start_scan(adapter, sender).await,
        WsRequestMethod::StopScan() => methods::stop_scan(adapter, sender).await,
        WsRequestMethod::GetInfo() => methods::get_info(adapter).await,
        WsRequestMethod::Enumerate() => methods::enumerate(adapter, sender).await,
        WsRequestMethod::ConnectDevice(uuid) => {
            methods::connect_device(uuid, adapter, sender).await
        }
        WsRequestMethod::DisconnectDevice(uuid) => {
            methods::disconnect_device(uuid, adapter, sender).await
        }
        WsRequestMethod::OpenDevice(uuid) => {
            methods::open_device(uuid, state.clone(), adapter, sender).await
        }
        WsRequestMethod::CloseDevice(uuid) => {
            methods::close_device(uuid, state.clone(), adapter, sender).await
        }
        WsRequestMethod::Read(uuid) => methods::read(uuid, state.clone(), adapter, sender).await,
        WsRequestMethod::Write(uuid, data) => methods::write(uuid, data, adapter, sender).await,
        WsRequestMethod::Forget(uuid) => methods::forget_device(uuid, adapter, sender).await,
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
            let json = serde_json::to_string(&WsResponse {
                id: request.id.clone(),
                method: request.method,
                payload: WsResponsePayload::Error(WsResponseFailure::Unexpected(err.to_string())),
            });
            return Some(Message::Text(json.unwrap()));
        }
    }
}
