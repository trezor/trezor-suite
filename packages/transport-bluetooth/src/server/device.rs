use crate::server::{
    platform::{BluetoothDevice, PlatformDevice},
    utils,
};
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
    Pairing { pin: Option<String> },
    Paired,
    PairingError { error: String },
    Connecting,
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
    discovery_timestamp: u128,
    /// when it was updated.
    #[serde(rename = "lastUpdatedTimestamp")]
    timestamp: u128,
    /// when the last update event was emitted. used for event overflow throttling
    #[serde(skip_serializing)]
    event_timestamp: u128,
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

#[derive(Debug, thiserror::Error)]
pub enum DeviceError {
    #[error("Properties missing")]
    PropertiesMissing,

    #[error("BtleplugError: {0}")]
    Btleplug(#[from] btleplug::Error),
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

const MANUFACTURER_DATA: u16 = 3881; // trezor-firmware CONFIG_BT_COMPANY_ID=0x0F29
pub const SERVICE_UUID: Uuid = uuid!("8c000001-a59b-4d58-a9ad-073df69fa1b1"); // trezor-firmware BT_UUID_TRZ_VAL
pub const CHARACTERISTIC_RX: Uuid = uuid!("8c000002-a59b-4d58-a9ad-073df69fa1b1"); // trezor-firmware BT_UUID_TRZ_TX_VAL
pub const CHARACTERISTIC_TX: Uuid = uuid!("8c000003-a59b-4d58-a9ad-073df69fa1b1"); // trezor-firmware BT_UUID_TRZ_RX_VAL

impl TrezorDevice {
    pub async fn new(peripheral: Peripheral, is_known: bool) -> Result<Self, Box<dyn Error>> {
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
        let paired = match is_known {
            false => BluetoothDevice::is_paired(&peripheral)
                .await
                .unwrap_or(false),
            true => true,
        };
        let address = BluetoothDevice::get_address(peripheral);

        info!(
            "create TrezorDevice known: {is_known}, id: {id}, address: {address}, manufacturer_data: {manufacturer_data:?}"
        );

        let props = TrezorDeviceProps {
            name,
            address: address.clone(),
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

    pub fn set_connection_status(&self, new_status: DeviceConnectionStatus) {
        if let Ok(mut props) = self.props.lock() {
            props.connection_status =
                self.update_connection_status(&props.connection_status, new_status);
            if let DeviceConnectionStatus::Connected = &props.connection_status {
                props.connected = true;
            } else if let DeviceConnectionStatus::Disconnected = &props.connection_status {
                props.connected = false;
            }
        }
    }

    fn update_connection_status(
        &self,
        current_status: &DeviceConnectionStatus,
        new_status: DeviceConnectionStatus,
    ) -> DeviceConnectionStatus {
        // do not override status if device pairing failed
        if let DeviceConnectionStatus::PairingError { error: _ } = &current_status {
            current_status.clone()
        } else {
            new_status
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

    pub fn set_is_paired(&self, value: bool) {
        if let Ok(mut props) = self.props.lock() {
            props.paired = value;
        }
    }

    pub fn get_discovery_timestamp(&self) -> u128 {
        match self.props.lock() {
            Ok(p) => p.discovery_timestamp,
            Err(_) => 0,
        }
    }

    pub async fn update_properties(&mut self, peripheral: Peripheral) -> Result<bool, DeviceError> {
        let mut is_updated = false;

        let PeripheralProperties {
            local_name,
            manufacturer_data,
            rssi,
            ..
        } = &peripheral
            .properties()
            .await?
            .ok_or(DeviceError::PropertiesMissing)?;

        let is_connected = peripheral.is_connected().await.unwrap_or(false);

        let mut props = match self.props.lock() {
            Ok(p) => p,
            Err(_) => {
                return Err(DeviceError::PropertiesMissing);
            }
        };

        // manufacturer_data are dynamically changed
        // linux + windows: manufacturer_data are received after discovery
        // linux: manufacturer_data are not visible if device is not in pairing mode even if it's already paired
        // linux uses random mac address to send SCAN_REQ which is not recognized by Trezor while sending SCAN_RES (empty data)
        if let Some(new_data) = manufacturer_data.get(&MANUFACTURER_DATA) {
            if !new_data.is_empty() && &props.data != new_data {
                props.data = new_data.clone();
                is_updated = true;
            }
        }

        // local_name may be changed
        // examples: bootloader, default label, device label change
        let name = local_name.clone().unwrap_or("".to_string());
        if props.name != name {
            props.name = name;
            is_updated = true;
        }

        props.rssi = rssi.unwrap_or(0);
        if is_connected != props.connected {
            is_updated = true;
            props.connected = is_connected;

            if is_connected {
                #[cfg(target_os = "linux")]
                {
                    props.address = BluetoothDevice::get_address(peripheral);
                }
            } else {
                props.connection_status = self.update_connection_status(
                    &props.connection_status,
                    DeviceConnectionStatus::Disconnected,
                );
            }
        }

        // throttle update events
        let timestamp = utils::get_timestamp();
        if timestamp - props.event_timestamp > 500 {
            is_updated = true;
        }

        if is_updated {
            props.event_timestamp = timestamp;
        }
        props.timestamp = timestamp;

        Ok(is_updated)
    }

    // update connection/paired state
    pub async fn disconnect(&self) -> Result<(), DeviceError> {
        let mut props = match self.props.lock() {
            Ok(p) => p,
            Err(_) => {
                return Err(DeviceError::PropertiesMissing);
            }
        };

        props.connected = false;
        props.connection_status = self.update_connection_status(
            &props.connection_status,
            DeviceConnectionStatus::Disconnected,
        );

        Ok(())
    }
}
