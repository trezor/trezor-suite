use btleplug::api::{Central, CentralState, Manager as _, Peripheral as _};
use btleplug::platform::{Adapter, Manager, Peripheral, PeripheralId};
use std::error::Error;

pub async fn get_adapter(manager: &Manager, current: Option<Adapter>) -> Option<Adapter> {
    if current.is_some() {
        return current;
    }
    let adapters = manager.adapters().await;
    println!("No current adapter, get_adapter {:?}", adapters);
    if adapters.is_ok() {
        return adapters.unwrap().into_iter().nth(0);
    }

    None
}

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

pub async fn get_peripheral_by_address(
    adapter: &Adapter,
    address: String,
) -> Result<Peripheral, Box<dyn Error>> {
    let devices = adapter.peripherals().await?;
    let device = devices.into_iter().find(|x| x.id().to_string() == address);
    match device {
        Some(device) => Ok(device),
        None => Err("Peripheral not found")?,
    }
}

pub async fn get_peripheral_name(peripheral: &Peripheral) -> Result<String, Box<dyn Error>> {
    let properties = peripheral.properties().await?;
    let local_name: String = properties
        .unwrap()
        .local_name
        .unwrap_or(String::from("(unknown name)"));
    Ok(local_name)
}

pub async fn scan_filter(adapter: &Adapter, id: &PeripheralId) -> Option<Peripheral> {
    let device = adapter.peripheral(&id).await;
    if !device.is_ok() {
        return None;
    }

    let device = device.unwrap();
    let name = get_peripheral_name(&device)
        .await
        .unwrap_or("Unknown".to_string());
    if name.contains("Trezor") {
        return Some(device);
    }

    return None;
}

