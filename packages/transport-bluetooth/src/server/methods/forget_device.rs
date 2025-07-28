use log::info;

use crate::server::{
    adapter_manager::AdapterManager,
    platform::{BluetoothDevice, PlatformDevice},
    types::{MethodError, MethodResult, WsResponsePayload},
    ConnectionBroadcast,
};

pub async fn forget_device(
    _manager: AdapterManager,
    _sender: ConnectionBroadcast,
    id: String,
) -> MethodResult {
    info!("forget_device");

    match BluetoothDevice::forget(id).await {
        Ok(()) => Ok(WsResponsePayload::Success(true)),
        Err(err) => Err(MethodError::PlatformError(err)),
    }
}
