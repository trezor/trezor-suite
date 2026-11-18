use btleplug::{
    api::{Central, ScanFilter},
    platform::Adapter,
};
use log::info;
use tokio::{
    sync::broadcast::error::RecvError,
    time::{sleep, Duration},
};

use crate::server::{
    adapter_manager::{AdapterError, AdapterManager},
    types::{
        AbortProcess, AdapterState, ChannelMessage, MethodResult, NotificationEvent,
        WsResponsePayload,
    },
    ConnectionBroadcast,
};

async fn stop_scanning(adapter: &Adapter, manager: &AdapterManager) {
    if let Err(err) = adapter.stop_scan().await {
        info!("start_scan/adapter.stop_scan: {err}");
    }

    manager.clear_serviceless_devices().await;
}

pub async fn start_scan(manager: AdapterManager, broadcast: ConnectionBroadcast) -> MethodResult {
    let radio = manager.lock_discovery_for_request("start_scan").await?;
    if !manager.has_listener(&broadcast).await {
        return Err(AdapterError::ClientDisconnected.into());
    }
    let mut receiver = broadcast.subscribe();
    let adapter = manager.get_powered_adapter_or_die().await?;

    if manager.is_scanning().await {
        info!("AdapterManager is already scanning");
        drop(radio);
        let devices = manager.get_devices().await;
        return Ok(WsResponsePayload::Peripherals { devices });
    }

    // start or restart scanning process
    // restart (stop/start) ensures that the event stream is really running in
    // workaround for https://github.com/deviceplug/btleplug/issues/255
    // windows: calling adapter.stop_scan breaks current broadcast.subscribe stream
    stop_scanning(&adapter, &manager).await;
    if let Err(err) = adapter.start_scan(ScanFilter::default()).await {
        info!("Start scan error {err}");
        stop_scanning(&adapter, &manager).await;
        return Err(err.into());
    }
    manager.set_scanning(true).await;

    // listen for Abort and AdapterStateChanged messages from the other threads
    let manager_ref = manager.clone();
    tokio::spawn(async move {
        loop {
            let event = match receiver.recv().await {
                Ok(event) => event,
                Err(RecvError::Lagged(skipped)) => {
                    info!("start_scan loop lagged, {skipped} events skipped");
                    continue;
                }
                Err(RecvError::Closed) => break,
            };

            match event {
                ChannelMessage::Abort(AbortProcess::Scan) => {
                    // Scanning itself was already stopped by the stop_scan method.
                    info!("Abort start_scan loop");
                    break;
                }
                ChannelMessage::Abort(AbortProcess::ClientDisconnected(_client)) => {
                    // Last-client cleanup is owned by AdapterManager::remove_listener.
                    break;
                }
                ChannelMessage::Notification(NotificationEvent::AdapterStateChanged { state })
                    if !matches!(state, AdapterState::Enabled) =>
                {
                    let _radio = manager_ref.lock_discovery("adapter_state_changed").await;
                    if !matches!(manager_ref.get_adapter_state().await, AdapterState::Enabled)
                        && manager_ref.take_scanning().await
                    {
                        stop_scanning(&adapter, &manager_ref).await;
                        break;
                    }
                }
                _ => {}
            }
        }
        info!("start_scan loop done");
    });
    drop(radio);

    // wait for first discovery events and enumerate
    sleep(Duration::from_millis(200)).await;

    let devices = manager.get_devices().await;
    Ok(WsResponsePayload::Peripherals { devices })
}
