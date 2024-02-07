use log::info;
use tokio::sync::broadcast::Sender;

use btleplug::api::Central;
use btleplug::platform::Adapter;

use crate::server::types::{
    AbortProcess, ChannelMessage, MethodResult, WsResponseFailure, WsResponsePayload,
};
use crate::server::utils;

pub async fn stop_scan(adapter: Option<Adapter>, sender: Sender<ChannelMessage>) -> MethodResult {
    let _ = sender.send(ChannelMessage::Abort(AbortProcess::Scan));

    if !(utils::is_adapter_powered(adapter.clone()).await) {
        return Ok(WsResponsePayload::Error(WsResponseFailure::AdapterDisabled));
    }

    let adapter = adapter.unwrap();
    if let Err(err) = adapter.stop_scan().await {
        info!("Stop scan error {}", err);
    }

    Ok(WsResponsePayload::Success(true))
}
