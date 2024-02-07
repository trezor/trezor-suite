use crate::server::utils;
use btleplug::api::{Peripheral as _, PeripheralProperties};
use btleplug::platform::Peripheral;
use log::info;
use serde::ser::SerializeStruct;
use std::error::Error;
use std::sync::{Arc, Mutex};
use std::time::{SystemTime, UNIX_EPOCH};
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
    ConnectionError { error: String },
}

#[derive(Clone, Debug)]
pub struct TrezorDevice {
    paired: Arc<Mutex<bool>>, // TODO: Option<boolean>
    name: String,
    data: Arc<Mutex<Vec<u8>>>,
    id: String,                  // id changes on second connection (linux)
    address: Arc<Mutex<String>>, // address changes after pairing (linux)
    connected: Arc<Mutex<bool>>,
    discovery_timestamp: u64,
    timestamp: Arc<Mutex<u64>>, // lastUpdatedTimestamp
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
        s.serialize_field("name", &self.name.to_string())?;
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

        let name = local_name.as_ref().unwrap();
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
            name: name.to_string(),
            data: Arc::new(Mutex::new(data.to_vec())),
            id: id.to_string(),
            address: Arc::new(Mutex::new(address)),
            connected: Arc::new(Mutex::new(*connected)),
            connection_status: Arc::new(Mutex::new(connection_status)),
            discovery_timestamp,
            timestamp,
            rssi: Arc::new(Mutex::new(rssi)),
            paired: Arc::new(Mutex::new(paired)),
        })
    }

    pub fn update_timestamp(&mut self, peripheral: Peripheral) {
        let mut timestamp = self.timestamp.lock().unwrap();
        *timestamp = utils::get_timestamp();
    }

    pub async fn update_properties(
        &mut self,
        peripheral: Peripheral,
    ) -> Result<bool, Box<dyn Error>> {
        if let Ok(properties) = peripheral.properties().await {
            let props = properties.unwrap();
            self.update_timestamp(peripheral);

            let mut rssi = self.rssi.lock().unwrap();
            *rssi = props.rssi.unwrap_or(0);

            if let Some(new_data) = props.manufacturer_data.get(&MANUFACTURER_DATA) {
                let mut data = self.data.lock().unwrap();
                if new_data.len() > 0 && data.len() != new_data.len() {
                    *data = new_data.clone();
                }
            }

            return Ok(true);
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
        *status = new_status;
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

    pub fn get_timestamp(&self) -> u64 {
        return self.discovery_timestamp;
    }
}
