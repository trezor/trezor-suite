use crate::server::{
    adapter_manager::AdapterManager,
    platform::{BluetoothDevice, ConnectDeviceContext, PlatformDevice},
    types::{ConnectDeviceParams, MethodError, MethodResult, WsResponsePayload},
    ConnectionBroadcast,
};

pub async fn connect_device(
    manager: AdapterManager,
    broadcast: ConnectionBroadcast,
    params: ConnectDeviceParams,
) -> MethodResult {
    manager.get_powered_adapter_or_die().await?;

    let context = ConnectDeviceContext {
        manager: manager.clone(),
        broadcast,
        params,
    };

    BluetoothDevice::connect(context).await?;

    Ok(WsResponsePayload::Success(true))
}
