use tokio::sync::broadcast::Sender;

use crate::server::adapter_manager::AdapterManager;
use crate::server::types::{ChannelMessage, MethodResult, State, WsResponsePayload};

pub async fn set_state(
    state: State,
    _manager: AdapterManager,
    _sender: Sender<ChannelMessage>,
) -> MethodResult {
    // TODO: check if device is connected and opened

    Ok(WsResponsePayload::Read(vec![]))
}
