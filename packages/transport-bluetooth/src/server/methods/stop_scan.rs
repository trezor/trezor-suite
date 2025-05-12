use btleplug::api::Central;
use log::info;

use crate::server::{
    adapter_manager::AdapterManager,
    types::{AbortProcess, ChannelMessage, MethodResult, WsResponsePayload},
    ConnectionBroadcast,
};

pub async fn stop_scan(manager: AdapterManager, broadcast: ConnectionBroadcast) -> MethodResult {
    // notify other threads
    broadcast.send(ChannelMessage::Abort(AbortProcess::Scan));

    let adapter = manager.get_powered_adapter_or_die().await?;
    if let Err(err) = adapter.stop_scan().await {
        info!("stop_scan/adapter.stop_scan error: {err}");

        return Ok(WsResponsePayload::Success(false));
    }

    Ok(WsResponsePayload::Success(true))
}
