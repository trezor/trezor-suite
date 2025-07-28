use btleplug::api::Peripheral as _;
use log::info;

use crate::server::{
    adapter_manager::AdapterManager,
    device::DeviceConnectionStatus,
    types::{AbortProcess, ChannelMessage, MethodResult, WsResponsePayload},
    ConnectionBroadcast,
};

pub async fn disconnect_device(
    manager: AdapterManager,
    broadcast: ConnectionBroadcast,
    id: String,
) -> MethodResult {
    info!("disconnect_device {:?}", id);
    // notify other threads: connect_device pairing, open_device read
    broadcast.send(ChannelMessage::Abort(AbortProcess::DeviceDisconnected(
        id.clone(),
    )));

    let device = manager.get_device_or_die(id.clone()).await?;
    if !matches!(
        device.get_connection_status(),
        DeviceConnectionStatus::Connected
    ) {
        // NotificationEvent::DeviceDisconnected is not emitted if DeviceConnectionStatus != Connected
        // set status manually
        let _ = device.disconnect().await;
    }

    manager.get_powered_adapter_or_die().await?;
    let peripheral = manager.get_peripheral_or_die(&id).await?;

    match peripheral.disconnect().await {
        Ok(_) => Ok(WsResponsePayload::Success(true)),
        Err(err) => {
            info!("disconnect_device error: {err:?}");
            Err(err.into())
        }
    }
}
