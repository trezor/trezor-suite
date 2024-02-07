use btleplug::api::{Central, CentralState, Manager as _, Peripheral as _};
use btleplug::platform::{Adapter, Manager, Peripheral};
use std::error::Error;
use tokio::sync::broadcast::Sender;

use crate::server::types::{BluetoothDevice, ChannelMessage, NotificationEvent};

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

#[derive(Debug, Clone)]
struct EmptyVec;

impl std::fmt::Display for EmptyVec {
    fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
        write!(f, "invalid first item to double")
    }
}

impl std::error::Error for EmptyVec {}

pub async fn get_peripheral_by_address(
    adapter: &Adapter,
    address: String,
) -> Result<Peripheral, Box<dyn Error>> {
    let devices = adapter.peripherals().await?;
    let device = devices.into_iter().find(|x| x.id().to_string() == address);
    match device {
        Some(device) => Ok(device),
        None => Err(Box::new(EmptyVec {})),
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

pub async fn get_bluetooth_device(device: &Peripheral) -> Result<BluetoothDevice, Box<dyn Error>> {
    let name = get_peripheral_name(&device).await.unwrap();
    let connected = device.is_connected().await.unwrap_or(false);

    Ok(BluetoothDevice {
        name,
        connected,
        uuid: device.id().to_string(),
        address: device.id().to_string(), // TODO: address
    })
}

pub async fn enumerate(adapter: &Adapter) -> Vec<BluetoothDevice> {
    let mut devices = vec![];
    let peripherals = adapter.peripherals().await;
    if !peripherals.is_ok() {
        return devices;
    }

    for device in peripherals.unwrap() {
        let name = get_peripheral_name(&device).await.unwrap();
        if name.contains("Trezor") {
            let bt = get_bluetooth_device(&device).await.unwrap();
            devices.push(bt);
        }
    }

    return devices;
}

pub fn send_notification(sender: &Sender<ChannelMessage>, payload: NotificationEvent) {
    if let Err(err) = sender.send(ChannelMessage::Notification(payload)) {
        eprintln!("send_notification error {}", err);
    }
}
