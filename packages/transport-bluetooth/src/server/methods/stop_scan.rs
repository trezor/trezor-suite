use btleplug::api::Central;
use log::info;
use tokio::sync::broadcast::Sender;

use crate::server::adapter_manager::AdapterManager;
use crate::server::types::{AbortProcess, ChannelMessage, MethodResult, WsResponsePayload};
use crate::server::utils;

pub async fn stop_scan(manager: AdapterManager, sender: Sender<ChannelMessage>) -> MethodResult {
    let _ = sender.send(ChannelMessage::Abort(AbortProcess::Scan));

    let adapter = manager.get_adapter().await?;
    if !(utils::is_adapter_powered(adapter.clone()).await) {
        return Err("Adapted disabled")?;
    }

    let adapter = adapter.unwrap();
    if let Err(err) = adapter.stop_scan().await {
        info!("Stop scan error {}", err);
    }

    Ok(WsResponsePayload::Success(true))
}
