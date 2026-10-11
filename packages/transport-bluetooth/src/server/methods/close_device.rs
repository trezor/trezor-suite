use log::info;

use crate::server::{
    adapter_manager::AdapterManager,
    types::{CloseDeviceParams, MethodResult, WsResponsePayload},
    ConnectionBroadcast,
};

pub async fn close_device(
    manager: AdapterManager,
    broadcast: ConnectionBroadcast,
    params: CloseDeviceParams,
) -> MethodResult {
    let id = params.id;
    info!("close_device {id}");

    manager
        .close_notification_streams(
            Some(broadcast.get_peer()),
            Some(&id),
            params.characteristic.as_ref(),
        )
        .await;

    Ok(WsResponsePayload::Success { success: true })
}
