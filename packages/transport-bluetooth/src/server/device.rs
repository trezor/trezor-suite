use crate::server::{platform, utils};
use btleplug::{
    api::{Peripheral as _, PeripheralProperties},
    platform::Peripheral,
};
use log::{info, warn};
use std::{
    error::Error,
    sync::{Arc, Mutex},
};
use uuid::{uuid, Uuid};

#[derive(serde::Serialize, Clone, Debug)]
#[serde(tag = "type", rename_all = "kebab-case")]
pub enum DeviceConnectionStatus {
    Disconnected,
    Connected,
}

#[derive(serde::Serialize, Clone, Debug)]
struct TrezorDeviceProps {
    /// name changes dynamically. example: switching from/to bootloader or windows advertisement packet delay/order
    name: String,
    /// address changes during pairing process (linux)
    /// address is unknown on mac, id is used instead
    #[serde(rename = "macAddress")]
    address: String,
    /// advertisement data. may be updated dynamically
    data: Vec<u8>,
    paired: bool,
    connected: bool,
    #[serde(rename = "connectionStatus")]
    connection_status: DeviceConnectionStatus,
    /// when it was discovered for the first time.
    /// linux reports paired devices even if device is not sending advertisements.
    /// used for sorting device list in AdapterManager
    #[serde(skip_serializing)]
    discovery_timestamp: u64,
    /// when it was updated.
    #[serde(rename = "lastUpdatedTimestamp")]
    timestamp: u64,
    /// when the last update event was emitted. used for event overflow throttling
    #[serde(skip_serializing)]
    event_timestamp: u64,
    /// signal strength, 0: weak, -100: strong
    rssi: i16,
}

#[derive(Clone, Debug)]
pub struct TrezorDevice {
    /// id is static during one adapter session
    /// id changes on second connection after pairing (linux)
    id: String,
    props: Arc<Mutex<TrezorDeviceProps>>,
}

impl serde::Serialize for TrezorDevice {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        #[derive(serde::Serialize)]
        struct TrezorDeviceView<'a> {
            id: &'a str,
            #[serde(flatten)]
            props: &'a TrezorDeviceProps,
        }

        match self.props.lock() {
            Ok(props) => TrezorDeviceView {
                id: &self.id,
                props: &props,
            }
            .serialize(serializer),
            Err(error) => {
                warn!("TrezorDevice serialization error: {}, {error}", self.id);
                #[derive(serde::Serialize)]
                struct ErrorView<'a> {
                    id: &'a str,
                    name: &'static str,
                    data: &'a Vec<u8>,
                }
                ErrorView {
                    id: &self.id,
                    name: "Lock error",
                    data: &vec![],
                }
                .serialize(serializer)
            }
        }
    }
}

const MANUFACTURER_DATA: u16 = 65535;
pub const SERVICE_UUID: Uuid = uuid!("8c000001-a59b-4d58-a9ad-073df69fa1b1");
pub const CHARACTERISTIC_RX: Uuid = uuid!("8c000002-a59b-4d58-a9ad-073df69fa1b1");
pub const CHARACTERISTIC_TX: Uuid = uuid!("8c000003-a59b-4d58-a9ad-073df69fa1b1");

impl TrezorDevice {
    pub async fn new(peripheral: Peripheral) -> Result<Self, Box<dyn Error>> {
        let PeripheralProperties {
            local_name,
            manufacturer_data,
            rssi,
            ..
        } = &peripheral
            .properties()
            .await?
            .expect("PeripheralProperties missing");

        let id = &peripheral.id();
        let name = local_name.clone().unwrap_or("".to_string());
        let data = manufacturer_data
            .get(&MANUFACTURER_DATA)
            .unwrap_or(&vec![])
            .clone();

        let connected = &peripheral.is_connected().await.unwrap_or(false);
        let connection_status = match connected {
            true => DeviceConnectionStatus::Connected,
            false => DeviceConnectionStatus::Disconnected,
        };
        let discovery_timestamp = utils::get_timestamp();
        let paired = platform::is_device_paired(&peripheral)
            .await
            .unwrap_or(false);
        let address = platform::get_device_address(peripheral);

        info!(
            "create TrezorDevice {}, {}, {:?}",
            id, address, manufacturer_data
        );

        let props = TrezorDeviceProps {
            name,
            address,
            data: data.to_vec(),
            paired,
            connected: *connected,
            connection_status,
            discovery_timestamp,
            timestamp: discovery_timestamp,
            event_timestamp: 0,
            rssi: rssi.unwrap_or(0),
        };

        Ok(Self {
            id: id.to_string(),
            props: Arc::new(Mutex::new(props)),
        })
    }

    pub fn get_id(&self) -> String {
        self.id.clone()
    }

    pub fn get_address(&self) -> String {
        match self.props.lock() {
            Ok(p) => p.address.to_string(),
            Err(_) => "".to_string(),
        }
    }

    pub fn set_connection_status(&self, status: DeviceConnectionStatus) {
        if let Ok(mut props) = self.props.lock() {
            props.connection_status = status;
        }
    }

    pub fn get_connection_status(&self) -> DeviceConnectionStatus {
        match self.props.lock() {
            Ok(p) => p.connection_status.clone(),
            Err(_) => DeviceConnectionStatus::Disconnected,
        }
    }

    pub fn is_paired(&self) -> bool {
        match self.props.lock() {
            Ok(p) => p.paired,
            Err(_) => false,
        }
    }

    pub fn get_discovery_timestamp(&self) -> u64 {
        match self.props.lock() {
            Ok(p) => p.discovery_timestamp,
            Err(_) => 0,
        }
    }
}
