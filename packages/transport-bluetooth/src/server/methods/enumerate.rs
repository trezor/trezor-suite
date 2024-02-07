use log::info;
use tokio::sync::broadcast::Sender;

use crate::server::adapter_manager::AdapterManager;
use crate::server::types::{ChannelMessage, MethodResult, WsResponsePayload};

pub async fn enumerate(_manager: AdapterManager, _sender: Sender<ChannelMessage>) -> MethodResult {
    info!("enumerate not implemented!");
    Ok(WsResponsePayload::Data("[]".to_string()))
}
