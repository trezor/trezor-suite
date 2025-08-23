use crate::server::{
    adapter_manager::{AdapterError, AdapterManager},
    types::{MethodError, MethodResult, WsResponsePayload},
};
use btleplug::api::Peripheral;
use log::info;

/// this method is just a placeholder to keep @trezor/transport interface
/// read logic is done in `open_device.rs`
pub async fn read(manager: AdapterManager, id: String) -> MethodResult {
    info!("read: {id}");

    manager.get_powered_adapter_or_die().await?;
    let peripheral = manager.get_peripheral_or_die(&id).await?;
    let is_connected = peripheral.is_connected().await.unwrap_or(false);
    if !is_connected {
        return Err(MethodError::Adapter(AdapterError::PeripheralNotConnected));
    }

    Ok(WsResponsePayload::Read(vec![]))
}
