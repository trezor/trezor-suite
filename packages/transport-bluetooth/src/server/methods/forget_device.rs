use log::info;

use crate::server::{
    adapter_manager::AdapterManager,
    platform::{BluetoothDevice, PlatformDevice},
    types::{ForgetDeviceParams, MethodError, MethodResult, WsResponsePayload},
    ConnectionBroadcast,
};

pub async fn forget_device(
    _manager: AdapterManager,
    _sender: ConnectionBroadcast,
    params: ForgetDeviceParams,
) -> MethodResult {
    let id = params.id;
    info!("forget_device {id}");

    match BluetoothDevice::forget(id).await {
        Ok(()) => Ok(WsResponsePayload::Success { success: true }),
        Err(err) => Err(MethodError::PlatformError(err)),
    }
}
