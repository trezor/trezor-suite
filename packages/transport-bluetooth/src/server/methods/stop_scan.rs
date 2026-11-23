use crate::server::{
    adapter_manager::AdapterManager,
    types::{MethodResult, WsResponsePayload},
};

pub async fn stop_scan(manager: AdapterManager) -> MethodResult {
    let mut scan = manager.lock_scan().await?;
    // A connection that runs keeps the scan until it ends, this stop answers right away.
    let success = scan.stop().await;
    drop(scan);

    manager.clear_serviceless_devices().await;

    Ok(WsResponsePayload::Success { success })
}
