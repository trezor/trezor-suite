use crate::server::utils;
use btleplug::api::{Peripheral as _, PeripheralProperties};
use btleplug::platform::Peripheral;
use log::info;
use serde::ser::SerializeStruct;
use std::error::Error;
use std::sync::{Arc, Mutex};
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

#[derive(Clone, Debug)]
pub struct TrezorDevice {
    paired: Arc<Mutex<bool>>, // TODO: Option<boolean>
    name: Arc<Mutex<String>>,
    data: Arc<Mutex<Vec<u8>>>,
    id: String,                  // id changes on second connection (linux)
    address: Arc<Mutex<String>>, // address changes after pairing (linux)
    connected: Arc<Mutex<bool>>,
    discovery_timestamp: u64,
    timestamp: Arc<Mutex<u64>>, // lastUpdatedTimestamp
    event_timestamp: Arc<Mutex<u64>>, // lastUpdatedTimestamp
    rssi: Arc<Mutex<i16>>,      // signal strength, 0: weak, -100: strong
    connection_status: Arc<Mutex<DeviceConnectionStatus>>,
}

impl serde::Serialize for TrezorDevice {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        let mut s = serializer.serialize_struct("TrezorDevice", 3)?;
        s.serialize_field("connected", &self.connected.lock().unwrap().clone())?;
        s.serialize_field("paired", &self.paired.lock().unwrap().clone())?;
        s.serialize_field("name", &self.name.lock().unwrap().to_string())?;
        s.serialize_field("data", &self.data.lock().unwrap().to_vec())?;
        s.serialize_field("id", &self.id.to_string())?;
        s.serialize_field("macAddress", &self.address.lock().unwrap().to_string())?;
        s.serialize_field(
            "lastUpdatedTimestamp",
            &self.timestamp.lock().unwrap().clone(),
        )?;
        s.serialize_field("rssi", &self.rssi.lock().unwrap().clone())?;
        s.serialize_field(
            "connectionStatus",
            &self.connection_status.lock().unwrap().clone(),
        )?;
        s.end()
    }
}

const MANUFACTURER_DATA: u16 = 65535; // TODO: should be ffff?
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
        } = &peripheral.properties().await?.unwrap();
        let connected = &peripheral.is_connected().await.unwrap_or(false);

        let name = local_name.clone().unwrap_or("".to_string());
        let id = &peripheral.id();
        let data = manufacturer_data
            .get(&MANUFACTURER_DATA)
            .unwrap_or(&vec![])
            .clone();
        info!("create TrezorDevice {:?}, {:?}", data, manufacturer_data);

        let rssi = rssi.unwrap_or(0);
        let discovery_timestamp = utils::get_timestamp();
        let timestamp = Arc::new(Mutex::new(discovery_timestamp));
        let paired = utils::is_paired(&peripheral).await.unwrap_or(false);
        let address = utils::get_address(peripheral);
        let mut connection_status = DeviceConnectionStatus::Disconnected;
        if *connected {
            connection_status = DeviceConnectionStatus::Connected;
        }

        Ok(Self {
            name: Arc::new(Mutex::new(name)),
            data: Arc::new(Mutex::new(data.to_vec())),
            id: id.to_string(),
            address: Arc::new(Mutex::new(address)),
            connected: Arc::new(Mutex::new(*connected)),
            connection_status: Arc::new(Mutex::new(connection_status)),
            discovery_timestamp,
            timestamp,
            event_timestamp: Arc::new(Mutex::new(0)),
            rssi: Arc::new(Mutex::new(rssi)),
            paired: Arc::new(Mutex::new(paired)),
        })
    }

    fn update_timestamp(&mut self) -> u64 {
        let mut timestamp = self.timestamp.lock().unwrap();
        let curr = utils::get_timestamp();
        *timestamp = curr;

        return curr;
    }

    pub async fn update_properties(
        &mut self,
        peripheral: Peripheral,
    ) -> Result<bool, Box<dyn Error>> {
        if let Ok(properties) = peripheral.properties().await {
            let props = properties.unwrap();
            let mut emit_event = false;
            let timestamp = self.update_timestamp();

            let mut rssi = self.rssi.lock().unwrap();
            *rssi = props.rssi.unwrap_or(0);

            // linux + windows: manufacturer_data may be received later
            if let Some(new_data) = props.manufacturer_data.get(&MANUFACTURER_DATA) {
                let mut data = self.data.lock().unwrap();
                if new_data.len() > 0 && data.len() != new_data.len() {
                    *data = new_data.clone();
                    emit_event = true;
                }
            }

            // local_name may be changed
            // bootloader, default label, device label change
            let name = props.local_name.unwrap_or("".to_string());
            let mut n = self.name.lock().unwrap();
            if name != n.to_string() {
                *n = name;
                emit_event = true;
            }

            
            let mut ev_timestamp = self.event_timestamp.lock().unwrap();
            if timestamp - *ev_timestamp > 1 {
                *ev_timestamp = timestamp;
                emit_event = true;
            }

            return Ok(emit_event);
        }

        Ok(false)
    }

    // update connection/paired state
    pub async fn update_connection(&self, peripheral: Option<Peripheral>) {
        let mut is_connected = false;
        if peripheral.is_some() {
            let peripheral = peripheral.unwrap();
            is_connected = peripheral.is_connected().await.unwrap_or(false);
            if is_connected {
                let mut paired = self.paired.lock().unwrap();
                *paired = true; // TODO: only on macos? others take it from is_paired()

                // address is updated after the pairing process (linux)
                let mut address = self.address.lock().unwrap();
                *address = utils::get_address(peripheral);
            } else {
                self.set_connection_status(DeviceConnectionStatus::Disconnected);
            }
        }

        let mut connected = self.connected.lock().unwrap();
        *connected = is_connected;
    }

    pub fn set_connection_status(&self, new_status: DeviceConnectionStatus) {
        match new_status {
            DeviceConnectionStatus::Connected => {
                let mut connected = self.connected.lock().unwrap();
                *connected = true;
            }
            _ => {}
        }

        let mut status = self.connection_status.lock().unwrap();
        match status.clone() {
            DeviceConnectionStatus::PairingError { error: _ } => {
                // not not override status (like disconnected) if device pairing failed
            }
            _ => {
                *status = new_status;
            }
        }
    }

    pub fn get_connection_status(&self) -> DeviceConnectionStatus {
        return self.connection_status.lock().unwrap().clone();
    }

    pub fn get_address(&self) -> String {
        return self.address.lock().unwrap().clone();
    }

    pub fn get_id(&self) -> String {
        return self.id.clone();
    }

    pub fn is_paired(&self) -> bool {
        return self.paired.lock().unwrap().clone();
    }

    // used sorting device list in adapter_manager
    pub fn get_timestamp(&self) -> u64 {
        return self.discovery_timestamp;
    }
}
