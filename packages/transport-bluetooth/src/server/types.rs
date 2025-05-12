use crate::server::{adapter_manager::AdapterError, device::TrezorDevice};
use btleplug::api::CentralState;

#[derive(serde::Serialize, Clone, Debug)]
pub enum AbortProcess {
    ClientDisconnected(String), // websocket client disconnected
    Scan,                       // stop scan
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
    Enumerate,
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
        state: AdapterState,
        api_version: String,
        adapter_info: String,
        adapter_version: u8,
    },
    Peripherals(Vec<TrezorDevice>),
    Success(bool),
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

/// Enum converted and renamed from `btleplug::CentralState`
#[derive(serde::Serialize, Clone, Debug)]
#[serde(rename_all = "kebab-case")]
pub enum AdapterState {
    Unknown,
    Enabled,
    Disabled,
    PermissionDenied,
}

impl From<CentralState> for AdapterState {
    fn from(value: CentralState) -> Self {
        match value {
            CentralState::Unknown => Self::Unknown,
            CentralState::PoweredOn => Self::Enabled,
            CentralState::PoweredOff => Self::Disabled,
            #[allow(unreachable_patterns)]
            _ => Self::Unknown, // future proof in case btleplug adds other variants
        }
    }
}

#[derive(serde::Serialize, Clone, Debug)]
#[serde(tag = "event", content = "payload", rename_all = "snake_case")]
pub enum NotificationEvent {
    AdapterStateChanged {
        state: AdapterState,
    },
    DeviceDiscovered {
        id: String,
        devices: Vec<TrezorDevice>,
    },
    DeviceUpdated {
        id: String,
        devices: Vec<TrezorDevice>,
    },
    DeviceConnected {
        id: String,
        devices: Vec<TrezorDevice>,
    },
    DeviceDisconnected {
        id: String,
        devices: Vec<TrezorDevice>,
    },
    DeviceRemoved {
        id: String,
    },
}

#[derive(Debug, thiserror::Error)]
pub enum MethodError {
    #[error("UnexpectedError: {0}")]
    Unexpected(String),

    #[error("BtleplugError: {0}")]
    Btleplug(#[from] btleplug::Error),

    #[error("AdapterError: {0}")]
    Adapter(#[from] AdapterError),
}

pub type MethodResult = Result<WsResponsePayload, MethodError>;
