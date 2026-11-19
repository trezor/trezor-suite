use crate::server::{
    adapter_manager::AdapterManager,
    types::{AbortProcess, ChannelMessage, MethodResult, WsResponsePayload},
};

pub async fn stop_scan(manager: AdapterManager) -> MethodResult {
    // the queue only: the flag changes in order with the other discovery calls
    let queue = manager
        .lock_discovery_for_request("stop_scan", std::future::ready(false))
        .await?;
    // Notify the watcher of every connection. The scan may have been started
    // by another client whose start_scan loop listens on its own channel only,
    // and would keep running (and spawn a duplicate on the next start_scan).
    manager
        .send_to_listeners(ChannelMessage::Abort(AbortProcess::Scan))
        .await;

    // Reset the flag right away. The adapter stop can wait for a connection,
    // and the flag must not stay set when the adapter call fails.
    manager.set_scanning(false).await;
    drop(queue);

    // Also without the flag: a stop that failed before must stay retryable.
    let success = manager.stop_adapter_scan("stop_scan").await;

    manager.clear_serviceless_devices().await;

    Ok(WsResponsePayload::Success { success })
}
