use crate::server::{
    adapter_manager::{AdapterError, AdapterManager},
    device::CHARACTERISTIC_RX,
    types::{MethodError, MethodResult, WriteParams, WsResponsePayload},
};
use btleplug::api::{CharPropFlags, Peripheral as _, WriteType};
use log::info;

pub async fn write(manager: AdapterManager, params: WriteParams) -> MethodResult {
    let WriteParams {
        id,
        data,
        with_response,
    } = params;
    info!("write {id}");

    manager.get_powered_adapter_or_die().await?;
    let peripheral = manager.get_peripheral_or_die(&id).await?;
    let is_connected = peripheral.is_connected().await.unwrap_or(false);
    if !is_connected {
        return Err(MethodError::Adapter(AdapterError::PeripheralNotConnected));
    }

    if peripheral.services().is_empty() {
        // services() always empty on linux macos
        // discover_services() slows down the process on windows
        peripheral.discover_services().await?;
    }

    // windows WithResponse takes too long. ~3000ms
    let (write_type, write_flag) = if with_response {
        (WriteType::WithResponse, CharPropFlags::WRITE)
    } else {
        (
            WriteType::WithoutResponse,
            CharPropFlags::WRITE_WITHOUT_RESPONSE,
        )
    };

    let characteristics = peripheral.characteristics();
    let Some(rx) = characteristics
        .iter()
        .find(|c| c.uuid == CHARACTERISTIC_RX && c.properties.contains(write_flag))
        .or_else(|| characteristics.iter().find(|c| c.uuid == CHARACTERISTIC_RX))
    else {
        return Err(MethodError::Adapter(
            AdapterError::PeripheralCharacteristicNotFound,
        ));
    };

    let mut vec = vec![0; data.len()];
    for (i, val) in data.into_iter().enumerate() {
        vec[i] = val;
    }

    info!("write bytes len: {} type: {write_type:?}", vec.len());

    peripheral.write(rx, &vec, write_type).await?;

    Ok(WsResponsePayload::Success(true))
}
