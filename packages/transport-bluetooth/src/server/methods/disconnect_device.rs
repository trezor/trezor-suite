use btleplug::api::Peripheral as _;
use tokio::sync::broadcast::Sender;

use crate::server::adapter_manager::AdapterManager;
use crate::server::types::{ChannelMessage, MethodResult, WsResponsePayload};
use crate::server::utils;

pub async fn disconnect_device(
    uuid: String,
    manager: AdapterManager,
    _sender: Sender<ChannelMessage>,
) -> MethodResult {
    println!("Disconnecting {:?}", uuid);
    let adapter = manager.get_adapter().await?;
    if !(utils::is_adapter_powered(adapter.clone()).await) {
        return Err("Adapted disabled")?;
    }

    let adapter = adapter.unwrap();
    let device = utils::get_peripheral_by_address(&adapter, uuid).await?;
    let is_connected = device.is_connected().await.unwrap_or(false);
    if is_connected {
        device.disconnect().await?;
    }

    Ok(WsResponsePayload::Success(true))
}
