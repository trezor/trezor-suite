use crate::server::adapter_manager::AdapterManager;
use crate::server::types::{ChannelMessage, MethodResult, WsResponsePayload};

pub async fn read(_id: String) -> MethodResult {
    // TODO: check if device is connected and opened

    Ok(WsResponsePayload::Read(vec![]))
}
