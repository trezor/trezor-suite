use crate::server::{
    adapter_manager::AdapterManager,
    types::{AbortProcess, ChannelMessage, CloseDeviceParams, MethodResult, WsResponsePayload},
    ConnectionBroadcast,
};

use log::info;

pub async fn close_device(
    _manager: AdapterManager,
    broadcast: ConnectionBroadcast,
    params: CloseDeviceParams,
) -> MethodResult {
    let id = params.id;
    info!("close_device {id}");

    broadcast.send(ChannelMessage::Abort(AbortProcess::Read(id)));

    Ok(WsResponsePayload::Success { success: true })
}
