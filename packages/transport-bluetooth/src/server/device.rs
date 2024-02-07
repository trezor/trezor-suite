use btleplug::api::{Peripheral as _, PeripheralProperties};
use btleplug::platform::Peripheral;
use serde::ser::SerializeStruct;
use std::sync::{Arc, Mutex};
use std::time::{SystemTime, UNIX_EPOCH};
use uuid::{uuid, Uuid};
use std::error::Error;

#[derive(Clone, Debug)]
pub struct TrezorDevice {
    paired: Arc<Mutex<bool>>, // TODO: optional boolean or none
    name: String,
    data: Arc<Mutex<Vec<u8>>>,
    id: String, // id changes on second connection (linux)
    address: Arc<Mutex<String>>, // address changes after pairing (linux)
    connected: Arc<Mutex<bool>>,
    lastUpdatedTimestamp: Arc<Mutex<u64>>,
    rssi: Arc<Mutex<i16>>, // signal strength, 0: weak, -100: strong
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
        s.serialize_field("address", &self.address.lock().unwrap().to_string())?;
        s.serialize_field("lastUpdatedTimestamp", &self.lastUpdatedTimestamp.lock().unwrap().clone())?;
        s.serialize_field("rssi", &self.rssi.lock().unwrap().clone())?;
        s.end()
    }
}

fn get_timestamp() -> u64 {
    return SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .expect("Time went backwards")
        .as_secs();
}

#[cfg(target_os = "windows")]
async fn is_paired(peripheral: &Peripheral) -> Result<bool, Box<dyn Error>> {
    use windows::Devices::Bluetooth::BluetoothLEDevice;

    let address = btleplug::api::BDAddr::from_str_delim(&peripheral.id().to_string()).unwrap();
    let device = BluetoothLEDevice::FromBluetoothAddressAsync(address.into())?.await?;
    let device_info = device.DeviceInformation()?;
    let pairing = device_info.Pairing()?;
    let paired = pairing.IsPaired()?;

    Ok(paired)
}

#[cfg(target_os = "linux")]
async fn is_paired(peripheral: &Peripheral) -> Result<bool, Box<dyn Error>> {
    use dbus::arg::{RefArg, Variant};
    use std::collections::HashMap;
    use tokio::time::Duration;

    let conn = dbus::blocking::Connection::new_system()?;
    let device_path = format!("/org/bluez/{}", peripheral.id().to_string());
    let device_proxy = conn.with_proxy("org.bluez", device_path, Duration::from_secs(10));
    let (props,): (HashMap<String, Variant<Box<dyn RefArg>>>,) = device_proxy.method_call(
        "org.freedesktop.DBus.Properties",
        "GetAll",
        ("org.bluez.Device1",),
    )?;

    if let Some(variant) = props.get("Paired") {
        if let Some(is_paired) = variant.0.as_any().downcast_ref::<bool>().cloned() {
            return Ok(is_paired);
        }
    }

    Ok(false)
}

#[cfg(target_os = "macos")]
async fn is_paired(peripheral: &Peripheral) -> Result<bool, Box<dyn Error>> {
    Ok(false)
}

fn get_address(peripheral: Peripheral) -> String {
    let mut address: String = peripheral.address().to_string();
    #[cfg(target_os = "macos")]
    {
        // address is unknown, use id
        address = peripheral.id().to_string();
    } 
    address
}

const MANUFACTURER_DATA: u16 = 65535;
pub const SERVICE_UUID: Uuid = uuid!("8c000001-a59b-4d58-a9ad-073df69fa1b1");
pub const CHARACTERISTIC_RX: Uuid = uuid!("8c000002-a59b-4d58-a9ad-073df69fa1b1");
// pub const CHARACTERISTIC_TX: Uuid = uuid!("8c000003-a59b-4d58-a9ad-073df69fa1b1");

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
        println!(
            "TrezorDevice initial data {:?}, {:?}",
            data, manufacturer_data
        );

        let timestamp = get_timestamp();
        let rssi = rssi.unwrap_or(0);
        let paired = is_paired(&peripheral).await.unwrap_or(false);
        let address = get_address(peripheral);

        Ok(Self {
            name: name.to_string(),
            data: Arc::new(Mutex::new(data.to_vec())),
            id: id.to_string(),
            address: Arc::new(Mutex::new(address)),
            connected: Arc::new(Mutex::new(*connected)),
            lastUpdatedTimestamp: Arc::new(Mutex::new(timestamp)),
            rssi: Arc::new(Mutex::new(rssi)),
            paired: Arc::new(Mutex::new(paired)),
        })
    }

    pub async fn update_properties(
        &mut self,
        peripheral: Peripheral,
    ) -> Result<bool, Box<dyn Error>> {
        if let Ok(properties) = peripheral.properties().await {
            let props = properties.unwrap();
            let mut timestamp = self.lastUpdatedTimestamp.lock().unwrap();
            *timestamp = get_timestamp();

            let mut rssi = self.rssi.lock().unwrap();
            *rssi = props.rssi.unwrap_or(0);

            if let Some(new_data) = props.manufacturer_data.get(&MANUFACTURER_DATA) {
                let mut data = self.data.lock().unwrap();
                if data.len() != new_data.len() {
                    *data = new_data.clone();
                    return Ok(true);
                }
            }
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
                *address = get_address(peripheral);
            }
        }

        let mut connected = self.connected.lock().unwrap();
        *connected = is_connected;
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
        return self.lastUpdatedTimestamp.lock().unwrap().clone();
    }
}
