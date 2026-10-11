use btleplug::api::Central;
use log::info;

use crate::server::{
    adapter_manager::AdapterManager,
    types::{AbortProcess, ChannelMessage, MethodResult, WsResponsePayload},
};

pub async fn stop_scan(manager: AdapterManager) -> MethodResult {
    // Notify the watcher of every connection. The scan may have been started
    // by another client whose start_scan loop listens on its own channel only,
    // and would keep running (and spawn a duplicate on the next start_scan).
    manager
        .send_to_listeners(ChannelMessage::Abort(AbortProcess::Scan))
        .await;

    // Reset the flag right away — it must not stay set when the adapter call
    // below fails.
    manager.set_scanning(false).await;

    let adapter = manager.get_powered_adapter_or_die().await?;
    let success = match adapter.stop_scan().await {
        Ok(_) => true,
        Err(err) => {
            info!("stop_scan/adapter.stop_scan error: {err}");
            false
        }
    };

    manager.clear_serviceless_devices().await;

    Ok(WsResponsePayload::Success { success })
}
