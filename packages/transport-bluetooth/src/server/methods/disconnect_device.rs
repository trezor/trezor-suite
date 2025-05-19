use btleplug::api::Peripheral as _;
use log::info;

use crate::server::{
    adapter_manager::AdapterManager,
    types::{AbortProcess, ChannelMessage, MethodResult, WsResponsePayload},
    ConnectionBroadcast,
    device::DeviceConnectionStatus,
};

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

    let device = manager.get_device_or_die(id.clone()).await?;
    if let DeviceConnectionStatus::Connected = device.get_connection_status() {
        //
    } else {
        // NotificationEvent::DeviceDisconnected is not emitted if connecting or paring
        // disconnect manually
        device.disconnect().await;
    }

    manager.get_powered_adapter_or_die().await?;
    let peripheral = manager.get_peripheral_or_die(&id).await?;
    let result = peripheral.disconnect().await;
    println!("Disconnect result {:?}", result);

    Ok(WsResponsePayload::Success(true))
}
