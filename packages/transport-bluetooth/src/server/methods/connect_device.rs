use crate::server::{
    adapter_manager::{AdapterManager, MIN_CONNECT_TIMEOUT_MS},
    platform::{BluetoothDevice, ConnectDeviceContext, PlatformDevice},
    types::{ConnectDeviceParams, MethodResult, WsResponsePayload},
    ConnectionBroadcast,
};

const DEFAULT_CONNECT_TIMEOUT_MS: u32 = 30_000;
const MAX_CONNECT_TIMEOUT_MS: u32 = 120_000;

pub async fn connect_device(
    manager: AdapterManager,
    broadcast: ConnectionBroadcast,
    mut params: ConnectDeviceParams,
) -> MethodResult {
    // zero means "not set"; the timeout is client supplied so bound it on both sides
    params.timeout = match params.timeout {
        0 => DEFAULT_CONNECT_TIMEOUT_MS,
        timeout => timeout.clamp(MIN_CONNECT_TIMEOUT_MS, MAX_CONNECT_TIMEOUT_MS),
    };

    let _radio = manager
        .lock_connection_for_request(&params.id, &mut params.timeout)
        .await?;

    manager.get_powered_adapter_or_die().await?;

    let context = ConnectDeviceContext {
        manager: manager.clone(),
        broadcast,
        params,
    };

    BluetoothDevice::connect(context).await?;

    Ok(WsResponsePayload::Success { success: true })
}
