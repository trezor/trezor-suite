use crate::server::device::TrezorDevice;

#[derive(serde::Serialize, Clone, Debug)]
pub enum AbortProcess {
    Scan,
    Read,
    Disconnect,
}

#[derive(serde::Serialize, Clone, Debug)]
pub enum ChannelMessage {
    Abort(AbortProcess),
    Response(WsResponse),
    Notification(NotificationEvent),
}

#[derive(serde::Deserialize, serde::Serialize, Debug, Clone)]
#[serde(tag = "name", content = "args", rename_all = "snake_case")]
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
}

#[derive(serde::Deserialize, Debug)]
pub struct WsRequest {
    pub id: String,
    pub method: WsRequestMethod,
}

#[derive(serde::Serialize, Clone, Debug)]
#[serde(untagged)]
pub enum WsResponsePayload {
    Info {
        powered: bool,
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
    pub method: WsRequestMethod,
    pub payload: WsResponsePayload,
}

#[derive(serde::Serialize, Clone, Debug)]
pub struct WsError {
    pub id: String,
    pub method: WsRequestMethod,
    pub error: String,
}

#[derive(serde::Serialize, Clone, Debug)]
#[serde(tag = "event", content = "payload", rename_all = "snake_case")]
pub enum NotificationEvent {
    AdapterStateChanged {
        powered: bool,
    },
    ScanningUpdate {
        devices: Vec<TrezorDevice>,
    },
    DeviceDiscovered {
        uuid: String,
        timestamp: u64,
        devices: Vec<TrezorDevice>,
    },
    DeviceUpdated {
        uuid: String,
        devices: Vec<TrezorDevice>,
    },
    DeviceConnected {
        uuid: String,
        devices: Vec<TrezorDevice>,
    },
    DevicePairing {
        uuid: String,
        paired: bool,
        pin: String,
    },
    DeviceConnectionStatus {
        uuid: String,
        phase: String,
    },
    DeviceDisconnected {
        uuid: String,
        devices: Vec<TrezorDevice>,
    },
    DeviceRead {
        uuid: String,
        data: Vec<u8>,
    },
}

pub type MethodResult = Result<WsResponsePayload, Box<dyn std::error::Error>>;
