use std::{net::SocketAddr, sync::Arc};
use btleplug::platform::PeripheralId;
use dashmap::DashMap;
use tokio::sync::Mutex;

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

#[derive(serde::Serialize, Clone, Debug)]
pub enum SharedChannelMessage {
    // Abort(SocketAddr, AbortProcess),
    Notification(SocketAddr, NotificationEvent),
}

pub struct ConnectionState {
    pub subscriptions: Vec<u8>, // array of message ids
    pub advertisements: DashMap<PeripheralId, u128>,
}

pub type ConnectionStateMutex = Arc<Mutex<ConnectionState>>;

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
    Forget(String),
}

#[derive(serde::Deserialize, Debug)]
pub struct WsRequest {
    pub id: u8,
    pub method: WsRequestMethod,
    // args: WsRequestMethod,
}

#[derive(serde::Serialize, Clone, Debug)]
#[serde(untagged)]
pub enum WsResponsePayload {
    Info {
        powered: bool,
        api_version: String,
        adapter_info: String,
    },
    Success(bool),
    Data(String),
    Read(Vec<u8>),
    Error(WsResponseFailure),
}

#[derive(serde::Serialize, Clone, Debug)]
pub enum WsResponseFailure {
    AdapterDisabled,
    Unexpected(String),
}

#[derive(serde::Serialize, Clone, Debug)]
pub struct WsResponse {
    pub id: u8,
    pub method: WsRequestMethod,
    pub payload: WsResponsePayload,
}

#[derive(serde::Serialize, Clone, Debug)]
pub struct BluetoothDevice {
    pub name: String,
    pub connected: bool,
    pub uuid: String,
    pub address: String,
}

#[derive(serde::Serialize, Clone, Debug)]
#[serde(tag = "event", content = "payload")]
pub enum NotificationEvent {
    AdapterStateChanged {
        powered: bool,
    },
    DeviceDiscovered {
        uuid: String,
        devices: Vec<BluetoothDevice>,
    },
    DeviceConnected {
        uuid: String,
        devices: Vec<BluetoothDevice>,
    },
    DeviceConnecting {
        device: BluetoothDevice,
        phase: String,
    },
    DeviceDisconnected {
        uuid: String,
        devices: Vec<BluetoothDevice>,
    },
    DeviceRead {
        device: BluetoothDevice,
        data: Vec<u8>,
    },
}

pub type MethodResult = Result<WsResponsePayload, Box<dyn std::error::Error>>;
