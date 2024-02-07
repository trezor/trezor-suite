use log::info;
use tokio::sync::broadcast::Sender;

use crate::server::adapter_manager::AdapterManager;
use crate::server::types::{ChannelMessage, MethodResult, WsResponsePayload};

pub async fn enumerate(manager: AdapterManager, _sender: Sender<ChannelMessage>) -> MethodResult {
    let known_devices = manager.enumerate().await;

    Ok(WsResponsePayload::Peripherals(known_devices))
}
