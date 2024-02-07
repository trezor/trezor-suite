use btleplug::api::{CharPropFlags, Peripheral as _, WriteType};
use tokio::sync::broadcast::Sender;

use crate::server::adapter_manager::AdapterManager;
use crate::server::device::CHARACTERISTIC_RX;
use crate::server::types::{ChannelMessage, MethodResult, WsResponsePayload};
use crate::server::utils;

pub async fn write(
    uuid: String,
    data: Vec<u8>,
    manager: AdapterManager,
    _sender: Sender<ChannelMessage>,
) -> MethodResult {
    let adapter = manager.get_adapter().await?;
    if !(utils::is_adapter_powered(adapter.clone()).await) {
        return Err("Adapted disabled")?;
    }

    let adapter = adapter.unwrap();
    let device = utils::get_peripheral_by_address(&adapter, uuid).await?;
    let is_connected = device.is_connected().await.unwrap_or(false);
    if !is_connected {
        return Err("Device not connected")?;
    }

    device.discover_services().await?;

    let characteristics = device.characteristics();
    let cmd_char = characteristics
        .iter()
        .find(|c| c.uuid == CHARACTERISTIC_RX && c.properties.contains(CharPropFlags::WRITE))
        .unwrap();

    let mut vec = vec![0; 244];
    let mut i = 0;
    for val in data {
        vec[i] = val;
        i += 1;
    }

    println!("sending {} - {}, {:?}", vec.len(), cmd_char, vec);

    let resp = device
        .write(&cmd_char, &vec, WriteType::WithoutResponse)
        .await
        .expect("Cannot write...");

    println!("sending complete {:?}", resp);

    Ok(WsResponsePayload::Success(true))
}
