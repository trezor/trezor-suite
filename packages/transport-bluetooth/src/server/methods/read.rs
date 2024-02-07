use tokio::sync::broadcast::Sender;

use btleplug::platform::Adapter;

use crate::server::types::{ChannelMessage, ConnectionStateMutex, MethodResult, WsResponsePayload};

pub async fn read(
    _uuid: String,
    _state: ConnectionStateMutex,
    _adapter: Option<Adapter>,
    _sender: Sender<ChannelMessage>,
) -> MethodResult {
    // TODO: check if device is connected and opened

    Ok(WsResponsePayload::Read(vec![]))
}
