#[derive(serde::Serialize, Clone, Debug)]
pub enum AbortProcess {
    ClientDisconnected, // websocket client disconnected
}

#[derive(serde::Serialize, Clone, Debug)]
pub enum ChannelMessage {
    Abort(AbortProcess),
    Notification(NotificationEvent),
}

#[derive(serde::Deserialize, serde::Serialize, Debug, Clone)]
#[serde(tag = "method", content = "params", rename_all = "snake_case")]
pub enum WsRequestMethod {
    GetInfo,
    StartScan,
    StopScan,
}

#[derive(serde::Deserialize, Debug)]
pub struct WsRequest {
    pub id: String,
    #[serde(flatten)]
    pub method: WsRequestMethod,
}

#[derive(serde::Serialize, Clone, Debug)]
#[serde(untagged)]
pub enum WsResponsePayload {
    Info {
        api_version: String,
        adapter_info: String,
        adapter_version: u8,
    },
}

#[derive(serde::Serialize, Clone, Debug)]
pub struct WsResponse {
    pub id: String,
    pub payload: WsResponsePayload,
}

#[derive(serde::Serialize, Clone, Debug)]
pub struct WsError {
    pub id: String,
    pub error: String,
}

#[derive(serde::Serialize, Clone, Debug)]
#[serde(tag = "event", content = "payload", rename_all = "snake_case")]
pub enum NotificationEvent {}

pub type MethodResult = Result<WsResponsePayload, Box<dyn std::error::Error>>;
