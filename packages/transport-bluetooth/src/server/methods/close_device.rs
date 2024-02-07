use btleplug::platform::Adapter;
use tokio::sync::broadcast::Sender;

use crate::server::types::{
    AbortProcess, ChannelMessage, ConnectionStateMutex, MethodResult, WsResponsePayload,
};

pub async fn close_device(
    _uuid: String,
    _state: ConnectionStateMutex,
    _adapter: Option<Adapter>,
    sender: Sender<ChannelMessage>,
) -> MethodResult {
    let _ = sender.send(ChannelMessage::Abort(AbortProcess::Read));

    Ok(WsResponsePayload::Success(true))
}
