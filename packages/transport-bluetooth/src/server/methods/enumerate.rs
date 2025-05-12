use log::info;

use crate::server::{
    adapter_manager::AdapterManager,
    types::{MethodResult, WsResponsePayload},
};

pub async fn enumerate(manager: AdapterManager) -> MethodResult {
    info!("enumerate");

    let devices = manager.get_devices().await;

    Ok(WsResponsePayload::Peripherals(devices))
}
