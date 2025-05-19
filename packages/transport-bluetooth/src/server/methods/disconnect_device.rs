use btleplug::api::Peripheral as _;
use log::info;

use crate::server::adapter_manager::AdapterManager;
use crate::server::types::{AbortProcess, ChannelMessage, MethodResult, WsResponsePayload};
use crate::server::ConnectionBroadcast;

pub async fn disconnect_device(
    manager: AdapterManager,
    broadcast: ConnectionBroadcast,
    id: String,
) -> MethodResult {
    info!("Disconnecting {:?}", id);
    // notify other threads: connect_device pairing, open_device read
    broadcast.send(ChannelMessage::Abort(AbortProcess::DeviceDisconnected(
        id.clone(),
    )));

    manager.get_powered_adapter_or_die().await?;
    let peripheral = manager.get_peripheral_or_die(&id).await?;
    // let is_connected = peripheral.is_connected().await.unwrap_or(false);
    // if is_connected {
    let diss = peripheral.disconnect().await;
    println!("Disconnect result {:?}", diss);
    // }

    Ok(WsResponsePayload::Success(true))
}
