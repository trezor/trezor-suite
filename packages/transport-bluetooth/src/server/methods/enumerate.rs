use log::info;
use tokio::sync::broadcast::Sender;

use btleplug::platform::Adapter;

use crate::server::types::{ChannelMessage, MethodResult, WsResponsePayload};

pub async fn enumerate(_adapter: Option<Adapter>, _sender: Sender<ChannelMessage>) -> MethodResult {
    info!("enumerate not implemented!");
    Ok(WsResponsePayload::Data("[]".to_string()))
}
