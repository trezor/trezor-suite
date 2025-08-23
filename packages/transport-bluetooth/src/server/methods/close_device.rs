use crate::server::{
    adapter_manager::AdapterManager,
    types::{AbortProcess, ChannelMessage, MethodResult, WsResponsePayload},
    ConnectionBroadcast,
};

use log::info;

pub async fn close_device(
    _manager: AdapterManager,
    broadcast: ConnectionBroadcast,
    id: String,
) -> MethodResult {
    info!("close_device {id}");

    broadcast.send(ChannelMessage::Abort(AbortProcess::Read(id)));

    Ok(WsResponsePayload::Success(true))
}
