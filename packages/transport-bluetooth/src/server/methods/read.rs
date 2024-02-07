use tokio::sync::broadcast::Sender;

use crate::server::adapter_manager::AdapterManager;
use crate::server::types::{ChannelMessage, MethodResult, WsResponsePayload};

pub async fn read(
    _uuid: String,
    _manager: AdapterManager,
    _sender: Sender<ChannelMessage>,
) -> MethodResult {
    // TODO: check if device is connected and opened

    Ok(WsResponsePayload::Read(vec![]))
}
