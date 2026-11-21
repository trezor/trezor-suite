use btleplug::api::Central;
use log::info;

use crate::server::{
    adapter_manager::AdapterManager,
    types::{AbortProcess, ChannelMessage, MethodResult, WsResponsePayload},
};

pub async fn stop_scan(manager: AdapterManager) -> MethodResult {
    let _radio = manager.lock_discovery_for_stop().await?;
    // Notify the watcher of every connection. The scan may have been started
    // by another client whose start_scan loop listens on its own channel only,
    // and would keep running (and spawn a duplicate on the next start_scan).
    manager
        .send_to_listeners(ChannelMessage::Abort(AbortProcess::Scan))
        .await;

    // Reset the flag right away — it must not stay set when the adapter call
    // below fails.
    let was_scanning = manager.take_scanning().await;

    // the flag is authoritative, without a scan there is nothing to stop
    let success = if was_scanning {
        let adapter = manager.get_powered_adapter_or_die().await?;
        let result = adapter.stop_scan().await;
        if let Err(err) = &result {
            info!("stop_scan/adapter.stop_scan error: {err}");
        }
        result.is_ok()
    } else {
        true
    };

    manager.clear_serviceless_devices().await;

    Ok(WsResponsePayload::Success { success })
}
