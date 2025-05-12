use crate::server::{
    adapter_manager::AdapterManager,
    connection_broadcast::ConnectionBroadcast,
    methods,
    types::{WsError, WsRequest, WsRequestMethod, WsResponse},
};
use hyper_tungstenite::tungstenite::Message;
use log::info;

pub async fn handle_message(
    message: Message,
    broadcast: ConnectionBroadcast,
    manager: AdapterManager,
) -> Option<Message> {
    let msg: String = match message {
        Message::Text(msg) => Some(msg.to_string()),
        Message::Binary(msg) => {
            let msg_str = msg.escape_ascii().to_string();
            if msg_str == "PING" {
                Some(msg_str.to_string())
            } else {
                None
            }
        }
        Message::Close(msg) => {
            if let Some(msg) = &msg {
                info!("Message::Close code {}, {}", msg.code, msg.reason);
            } else {
                info!("Message::Close without message");
            }
            None
        }
        msg => {
            info!("unknown Message {msg:?}");
            None
        }
    }?;

    if msg == "PING" {
        return Some(Message::text("PONG"));
    }

    info!("WsRequest: {:?}", msg);
    let request = match serde_json::from_str::<WsRequest>(&msg) {
        Ok(req) => req,
        Err(err) => {
            let json_error = serde_json::json!({
                "id": "-1", // TODO: try to read "id" from malformed json? this could not be exact WsRequest but it can have "id"
                "error": format!("WsRequest serialization error: {err:?}"),
            });
            return Some(Message::text(json_error.to_string()));
        }
    };
    info!("Method: {request:?}");

    let payload = match request.method.clone() {
        WsRequestMethod::GetInfo => methods::get_info(manager).await,
        WsRequestMethod::Enumerate => methods::enumerate(manager).await,
        WsRequestMethod::StartScan => methods::start_scan(manager, broadcast).await,
        WsRequestMethod::StopScan => methods::stop_scan(manager, broadcast).await,
    };

    match payload {
        Ok(payload) => {
            info!("WsResponse {payload:?}");

            let response = WsResponse {
                id: request.id.to_string(),
                payload,
            };

            match serde_json::to_string(&response) {
                Ok(json) => Some(Message::text(json)),
                Err(err) => {
                    let err_json = serde_json::json!({
                        "id": request.id,
                        "error": format!("WsResponse serialization error: {err:?}"),
                    });
                    Some(Message::text(err_json.to_string()))
                }
            }
        }
        Err(error) => {
            info!("WsError {error:?}");

            let ws_error = WsError {
                id: request.id.to_string(),
                error: error.to_string(),
            };
            // This unwrap is relatively safe as WsError is a simple structure
            let json = serde_json::to_string(&ws_error).unwrap_or_else(|_| {
                format!(
                    "{{\"id\":\"{}\",\"error\":\"Failed to serialize error\"}}",
                    request.id
                )
            });

            Some(Message::text(json))
        }
    }
}
