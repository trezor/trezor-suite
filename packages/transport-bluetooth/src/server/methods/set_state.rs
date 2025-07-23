use crate::server::{
    adapter_manager::AdapterManager,
    types::{MethodResult, SetStateParams, WsResponsePayload},
};
use log::info;

pub async fn set_state(manager: AdapterManager, params: SetStateParams) -> MethodResult {
    info!("set_state {:?}", params);

    manager.set_known_peripherals(params.devices).await;

    Ok(WsResponsePayload::Success(true))
}
