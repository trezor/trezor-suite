use tokio::sync::broadcast::Sender;

use btleplug::api::Peripheral as _;
use btleplug::platform::Adapter;

use crate::server::types::{ChannelMessage, MethodResult, WsResponseFailure, WsResponsePayload};

use crate::server::utils;

pub async fn disconnect_device(
    uuid: String,
    adapter: Option<Adapter>,
    _sender: Sender<ChannelMessage>,
) -> MethodResult {
    println!("Disconnecting {:?}", uuid);
    if !(utils::is_adapter_powered(adapter.clone()).await) {
        return Ok(WsResponsePayload::Error(WsResponseFailure::AdapterDisabled));
    }

    let adapter = adapter.unwrap();
    let device = utils::get_peripheral_by_address(&adapter, uuid).await?;
    let is_connected = device.is_connected().await.unwrap_or(false);
    if is_connected {
        device.disconnect().await?;
    }

    Ok(WsResponsePayload::Success(true))
}
