use tokio::sync::broadcast::Sender;

use crate::server::adapter_manager::AdapterManager;
use crate::server::types::{AbortProcess, ChannelMessage, MethodResult, WsResponsePayload};

pub async fn close_device(
    _uuid: String,
    _manager: AdapterManager,
    sender: Sender<ChannelMessage>,
) -> MethodResult {
    let _ = sender.send(ChannelMessage::Abort(AbortProcess::Read));

    Ok(WsResponsePayload::Success(true))
}
