use crate::server::{
    adapter_manager::AdapterError,
    device::{
        TrezorDevice, CHARACTERISTIC_BATTERY_LEVEL, CHARACTERISTIC_PUSH_NOTIFICATION,
        CHARACTERISTIC_TX,
    },
};
use btleplug::api::CentralState;
use uuid::Uuid;

#[derive(serde::Serialize, Clone, Debug)]
pub enum AbortProcess {
    ClientDisconnected(String), // websocket client disconnected
    DeviceDisconnected(String), // device disconnected
    Scan,                       // stop scan
}

#[derive(serde::Serialize, Clone, Debug)]
pub enum ChannelMessage {
    Abort(AbortProcess),
    Notification(NotificationEvent),
}

// partial TrezorDevice
#[derive(serde::Deserialize, serde::Serialize, Debug, Clone)]
pub struct KnownDevice {
    pub id: String,
    #[serde(rename = "macAddress")]
    pub mac_address: String,
}

#[derive(serde::Deserialize, serde::Serialize, Debug, Clone)]
pub struct SetStateParams {
    pub devices: Vec<KnownDevice>,
}

#[derive(serde::Deserialize, serde::Serialize, Debug, Clone)]
pub struct ConnectDeviceParams {
    pub id: String,
    pub timeout: u32,
}

#[derive(serde::Deserialize, serde::Serialize, Debug, Clone)]
pub struct DisconnectDeviceParams {
    pub id: String,
}

#[derive(serde::Deserialize, serde::Serialize, Debug, Clone)]
pub struct ForgetDeviceParams {
    pub id: String,
}

#[derive(serde::Deserialize, serde::Serialize, Debug, Clone, PartialEq, Eq)]
#[serde(rename_all = "kebab-case")]
pub enum NotificationCharacteristic {
    Read,
    TrezorPushNotification,
    BatteryLevel,
}

impl NotificationCharacteristic {
    pub fn to_uuid(&self) -> Uuid {
        match self {
            NotificationCharacteristic::Read => CHARACTERISTIC_TX,
            NotificationCharacteristic::TrezorPushNotification => CHARACTERISTIC_PUSH_NOTIFICATION,
            NotificationCharacteristic::BatteryLevel => CHARACTERISTIC_BATTERY_LEVEL,
        }
    }
}

#[derive(serde::Deserialize, serde::Serialize, Debug, Clone)]
pub struct OpenDeviceParams {
    pub id: String,
    pub characteristic: Option<NotificationCharacteristic>,
}

#[derive(serde::Deserialize, serde::Serialize, Debug, Clone)]
pub struct CloseDeviceParams {
    pub id: String,
    pub characteristic: Option<NotificationCharacteristic>,
}

#[derive(serde::Deserialize, serde::Serialize, Debug, Clone)]
pub struct WriteParams {
    pub id: String,
    pub data: Vec<u8>,
    #[serde(rename = "withResponse")]
    pub with_response: bool,
}

#[derive(serde::Deserialize, serde::Serialize, Debug, Clone)]
pub struct ReadParams {
    pub id: String,
}

#[derive(serde::Deserialize, serde::Serialize, Debug, Clone)]
#[serde(tag = "method", content = "params", rename_all = "snake_case")]
pub enum WsRequestMethod {
    GetInfo,
    Enumerate,
    StartScan,
    StopScan,
    SetState(SetStateParams),
    ConnectDevice(ConnectDeviceParams),
    DisconnectDevice(DisconnectDeviceParams),
    ForgetDevice(ForgetDeviceParams),
    OpenDevice(OpenDeviceParams),
    CloseDevice(CloseDeviceParams),
    Write(WriteParams),
    Read(ReadParams),
}

impl WsRequestMethod {
    pub fn as_string(&self) -> String {
        match self {
            WsRequestMethod::GetInfo => "GetInfo".to_string(),
            WsRequestMethod::Enumerate => "Enumerate".to_string(),
            WsRequestMethod::StartScan => "StartScan".to_string(),
            WsRequestMethod::StopScan => "StopScan".to_string(),
            WsRequestMethod::SetState(_) => "SetState".to_string(),
            WsRequestMethod::ConnectDevice(params) => format!("ConnectDevice({})", params.id),
            WsRequestMethod::DisconnectDevice(params) => {
                format!("DisconnectDevice({})", params.id)
            }
            WsRequestMethod::ForgetDevice(params) => format!("ForgetDevice({})", params.id),
            WsRequestMethod::OpenDevice(params) => format!("OpenDevice({})", params.id),
            WsRequestMethod::CloseDevice(params) => format!("CloseDevice({})", params.id),
            WsRequestMethod::Write(params) => format!("Write({})", params.id),
            WsRequestMethod::Read(params) => format!("Read({})", params.id),
        }
    }
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
        build: String,
        adapter_info: String,
    },
    Peripherals {
        devices: Vec<TrezorDevice>,
    },
    Success {
        success: bool,
    },
    Read {
        data: Vec<u8>,
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
    DeviceConnectionStatus {
        device: TrezorDevice,
    },
    #[allow(dead_code)]
    OpenBluetoothSettings {
        id: String,
    }, // see linux.rs/pair_with_timeout()
    DeviceRead {
        id: String,
        characteristic: NotificationCharacteristic,
        data: Vec<u8>,
    },
}

#[derive(Debug, thiserror::Error)]
pub enum MethodError {
    #[error("BtleplugError: {0}")]
    Btleplug(#[from] btleplug::Error),

    #[error("AdapterError: {0}")]
    Adapter(#[from] AdapterError),

    #[error(transparent)]
    PlatformError(#[from] Box<dyn std::error::Error + Send + Sync>),
}

pub type MethodResult = Result<WsResponsePayload, MethodError>;
