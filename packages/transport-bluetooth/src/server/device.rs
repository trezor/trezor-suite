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
            if let DeviceConnectionStatus::PairingError { error: _ } = &props.connection_status {
                // not not override status (like disconnected) if device pairing failed
            } else {
                props.connection_status = new_status;
            }

            if let DeviceConnectionStatus::Connected = &props.connection_status {
                props.connected = true;
            }
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

    // pub async fn update_properties2(
    //     &mut self,
    //     peripheral: Peripheral,
    // ) -> Result<bool, Box<dyn Error>> {
    //     if let Ok(properties) = peripheral.properties().await {
    //         let props = properties.unwrap();
    //         let mut emit_event = false;
    //         let timestamp = self.update_timestamp();

    //         let mut rssi = self.rssi.lock().unwrap();
    //         *rssi = props.rssi.unwrap_or(0);

    //         // linux + windows: manufacturer_data may be received later
    //         if let Some(new_data) = props.manufacturer_data.get(&MANUFACTURER_DATA) {
    //             let mut data = self.data.lock().unwrap();
    //             if new_data.len() > 0 && data.len() != new_data.len() {
    //                 *data = new_data.clone();
    //                 emit_event = true;
    //             }
    //         }

    //         // local_name may be changed
    //         // bootloader, default label, device label change
    //         let name = props.local_name.unwrap_or("".to_string());
    //         let mut n = self.name.lock().unwrap();
    //         if name != n.to_string() {
    //             *n = name;
    //             emit_event = true;
    //         }

    //         let mut ev_timestamp = self.event_timestamp.lock().unwrap();
    //         if timestamp - *ev_timestamp > 1 {
    //             *ev_timestamp = timestamp;
    //             emit_event = true;
    //         }

    //         return Ok(emit_event);
    //     }

    //     Ok(false)
    // }

    pub async fn update_properties(
        &mut self,
        peripheral: Peripheral,
    ) -> Result<bool, Box<dyn Error>> {
        // TODO AdapterErrror
        let mut is_updated = false;

        let PeripheralProperties {
            local_name,
            manufacturer_data,
            rssi,
            ..
        } = &peripheral
            .properties()
            .await?
            .expect("PeripheralProperties missing");

        let is_connected = peripheral.is_connected().await.unwrap_or(false);

        let mut props = match self.props.lock() {
            Ok(p) => p,
            Err(_) => {
                return Err("foo".to_string().into());
            }
        };

        // linux + windows: manufacturer_data may be received after discovery
        if let Some(new_data) = manufacturer_data.get(&MANUFACTURER_DATA) {
            if new_data.len() > 0 && props.data.len() != new_data.len() {
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
                props.paired = true; // TODO: only on macos? others take it from is_paired()
                props.address = platform::get_device_address(peripheral);
            } else {
                props.connection_status = DeviceConnectionStatus::Disconnected;
                // cannot use set_connection_status because props are locked here
                // self.set_connection_status(DeviceConnectionStatus::Disconnected);
            }
        }

        // throttle events
        let timestamp = utils::get_timestamp();
        if timestamp - props.event_timestamp > 1 {
            is_updated = true;
        }

        if is_updated {
            props.event_timestamp = timestamp;
        }
        props.timestamp = timestamp;

        Ok(is_updated)
    }

    // update connection/paired state
    // pub async fn update_connection(&self, peripheral: Option<Peripheral>) {
    //     let mut is_connected = false;

    //     if peripheral.is_some() {
    //         let peripheral = peripheral.unwrap();
    //         is_connected = peripheral.is_connected().await.unwrap_or(false);
    //         if is_connected {
    //             let mut props = self.props.lock().unwrap();
    //             props.paired = true; // TODO: only on macos? others take it from is_paired()

    //             // address is updated after the pairing process (linux)
    //             // let mut address = self.address.lock().unwrap();
    //             props.address = platform::get_device_address(peripheral);
    //         } else {
    //             self.set_connection_status(DeviceConnectionStatus::Disconnected);
    //         }
    //     }

    //     let mut props = self.props.lock().unwrap();
    //     props.connected = is_connected;
    // }
}
