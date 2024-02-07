use btleplug::api::{Central, CentralState, Peripheral as _};
use btleplug::platform::{Adapter, Peripheral, PeripheralId};
use std::error::Error;
use crate::server::device::SERVICE_UUID;

pub const APP_VERSION: &str = env!("CARGO_PKG_VERSION");

pub async fn is_adapter_powered(adapter: Option<Adapter>) -> bool {
    match adapter {
        Some(adapter) => {
            let state = adapter
                .adapter_state()
                .await
                .unwrap_or(CentralState::PoweredOff);
            return state == CentralState::PoweredOn;
        }
        None => false,
    }
}

pub async fn get_peripheral_by_id(
    adapter: &Adapter,
    id: String,
) -> Result<Peripheral, Box<dyn Error>> {
    let devices = adapter.peripherals().await?;
    let device = devices.into_iter().find(|x| x.id().to_string() == id);
    match device {
        Some(device) => Ok(device),
        None => Err("Peripheral not found")?,
    }
}

#[cfg(target_os = "windows")]
pub async fn is_paired(peripheral: &Peripheral) -> Result<bool, Box<dyn Error>> {
    use windows::Devices::Bluetooth::BluetoothLEDevice;

    let address = btleplug::api::BDAddr::from_str_delim(&peripheral.id().to_string()).unwrap();
    let device = BluetoothLEDevice::FromBluetoothAddressAsync(address.into())?.await?;
    let device_info = device.DeviceInformation()?;
    let pairing = device_info.Pairing()?;
    let paired = pairing.IsPaired()?;

    Ok(paired)
}

#[cfg(target_os = "linux")]
pub async fn is_paired(peripheral: &Peripheral) -> Result<bool, Box<dyn Error>> {
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
pub async fn is_paired(peripheral: &Peripheral) -> Result<bool, Box<dyn Error>> {
    Ok(false)
}

pub fn get_address(peripheral: Peripheral) -> String {
    let mut address: String = peripheral.address().to_string();
    #[cfg(target_os = "macos")]
    {
        // address is unknown, use id
        address = peripheral.id().to_string();
    }
    address
}

pub async fn scan_filter(adapter: &Adapter, id: &PeripheralId) -> Option<Peripheral> {
    let peripheral = adapter.peripheral(&id).await;
    if !peripheral.is_ok() {
        return None;
    }

    let peripheral = peripheral.unwrap();
    let props = match peripheral.properties().await {
        Ok(props) => props,
        Err(_) => None,
    };

    match props {
        Some(props) => {
            let service = props.services.iter().find(|c| *c == &SERVICE_UUID);
            if service.is_some() {
                return Some(peripheral);
            }

            // linux: unpaired device returns no services, try by name
            let name = props.local_name.unwrap_or("".to_string());
            if name.contains("Trezor") {
                return Some(peripheral);
            }
        },
        None => {},
    }

    return None;
}

pub fn get_timestamp() -> u64 {
    use std::time::{SystemTime, UNIX_EPOCH};

    return SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .expect("Time went backwards")
        .as_secs();
}
