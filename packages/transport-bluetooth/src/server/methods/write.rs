use btleplug::api::{CharPropFlags, Peripheral as _, WriteType};
use log::info;

use crate::server::adapter_manager::AdapterManager;
use crate::server::device::CHARACTERISTIC_RX;
use crate::server::types::{MethodError, MethodResult, WsResponsePayload};

pub async fn write(id: String, data: Vec<u8>, manager: AdapterManager) -> MethodResult {
    manager.get_powered_adapter_or_die().await?;
    let peripheral = manager.get_peripheral_or_die(&id).await?;
    let is_connected = peripheral.is_connected().await.unwrap_or(false);
    if !is_connected {
        return Err(MethodError::Unexpected("WTF?".to_string()));
    }

    peripheral.discover_services().await?;

    let characteristics = peripheral.characteristics();
    let cmd_char = characteristics
        .iter()
        .find(|c| c.uuid == CHARACTERISTIC_RX && c.properties.contains(CharPropFlags::WRITE))
        .unwrap();

    let mut vec = vec![0; 244];
    // let mut i = 0;
    // for val in data {
    //     vec[i] = val;
    //     i += 1;
    // }

    for (i, val) in data.into_iter().enumerate() {
        vec[i] = val;
    }

    info!("write: {} bytes {:?}", vec.len(), vec);

    peripheral
        .write(cmd_char, &vec, WriteType::WithoutResponse)
        .await?;

    Ok(WsResponsePayload::Success(true))
}
