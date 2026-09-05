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

    // Reset the flag right away — it must not stay set when the adapter call
    // below fails, nor when the scan was started by another client (the abort
    // message above never reaches watchers of other connections).
    manager.set_scanning(false).await;

    let adapter = manager.get_powered_adapter_or_die().await?;
    if let Err(err) = adapter.stop_scan().await {
        info!("stop_scan/adapter.stop_scan error: {err}");

        return Ok(WsResponsePayload::Success { success: false });
    }

    Ok(WsResponsePayload::Success { success: true })
}
