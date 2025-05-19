use crate::server::adapter_manager::AdapterManager;
use crate::server::types::{AbortProcess, ChannelMessage, MethodResult, WsResponsePayload};
use crate::server::ConnectionBroadcast;

pub async fn close_device(
    id: String,
    _manager: AdapterManager,
    broadcast: ConnectionBroadcast,
) -> MethodResult {
    broadcast.send(ChannelMessage::Abort(AbortProcess::Read(id)));

    Ok(WsResponsePayload::Success(true))
}
