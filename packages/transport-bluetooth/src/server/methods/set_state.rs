use crate::server::adapter_manager::AdapterManager;
use crate::server::types::{MethodResult, State, WsResponsePayload};

pub async fn set_state(_state: State, _manager: AdapterManager) -> MethodResult {
    Ok(WsResponsePayload::Read(vec![]))
}
