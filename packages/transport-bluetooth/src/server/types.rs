use crate::server::device::TrezorDevice;
use btleplug::api::CentralState;

#[derive(serde::Serialize, Clone, Debug)]
pub enum AbortProcess {
    ClientDisconnected, // websocket client disconnected
    Pairing, // stop pairing process
    Read, // device closed
    Scan, // stop scan
}

#[derive(serde::Serialize, Clone, Debug)]
pub enum ChannelMessage {
    Abort(AbortProcess),
    Notification(NotificationEvent),
}

#[derive(serde::Deserialize, serde::Serialize, Debug, Clone)]
pub struct KnownDevice {
    pub id: String,
}

#[derive(serde::Deserialize, serde::Serialize, Debug, Clone)]
pub struct State {
    pub devices: Vec<KnownDevice>,
}

#[derive(serde::Deserialize, serde::Serialize, Debug, Clone)]
#[serde(tag = "method", content = "params", rename_all = "snake_case")]
pub enum WsRequestMethod {
    StartScan(),
    StopScan(),
    GetInfo(),
    Enumerate(),
    ConnectDevice(String),
    DisconnectDevice(String),
    OpenDevice(String),
    CloseDevice(String),
    Write(String, Vec<u8>),
    Read(String),
    ForgetDevice(String),
    SetState(State),
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
    Data(String),
    Read(Vec<u8>),
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

// rename btleplug CentralState
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
        timestamp: u64,
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
    DeviceConnectionStatus(TrezorDevice),
    DeviceDisconnected {
        id: String,
        devices: Vec<TrezorDevice>,
    },
    DeviceRemoved {
        id: String,
    },
    DeviceRead {
        id: String,
        data: Vec<u8>,
    },
    DeviceSettingsUi,
}

pub type MethodResult = Result<WsResponsePayload, Box<dyn std::error::Error>>;
