use log::info;
use tokio::sync::broadcast::Sender;

use btleplug::platform::Adapter;

use crate::server::types::{ChannelMessage, MethodResult, WsResponsePayload};

pub async fn forget_device(
    uuid: String,
    _adapter: Option<Adapter>,
    _sender: Sender<ChannelMessage>,
) -> MethodResult {
    info!("forget_device not implemented! {}", uuid);
    Ok(WsResponsePayload::Success(false))
}
