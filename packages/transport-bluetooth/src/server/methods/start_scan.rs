use tokio::time::{sleep, Duration};

use crate::server::{
    adapter_manager::{AdapterError, AdapterManager},
    types::{MethodResult, WsResponsePayload},
    ConnectionBroadcast,
};

pub async fn start_scan(manager: AdapterManager, broadcast: ConnectionBroadcast) -> MethodResult {
    let mut scan = manager.lock_scan().await?;

    // The wait for the turn can take SCAN_REQUEST_WAIT. Requests are not
    // cancelled on disconnect, so without this check a scan would be started for a
    // client that left, and the last-listener cleanup would stop it right after.
    if !manager.has_listener(&broadcast).await {
        return Err(AdapterError::ClientDisconnected.into());
    }

    if !scan.running() {
        // loads the adapter and fails when it is disabled
        manager.get_powered_adapter_or_die().await?;
        manager.clear_serviceless_devices().await;
    }
    let started = scan.start().await.map_err(AdapterError::from)?;
    drop(scan);

    if started {
        // wait for first discovery events and enumerate
        sleep(Duration::from_millis(200)).await;
    }

    let devices = manager.get_devices().await;
    Ok(WsResponsePayload::Peripherals { devices })
}
