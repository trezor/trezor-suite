use btleplug::{
    api::{Central, ScanFilter},
    platform::Adapter,
};
use log::info;
use tokio::time::{sleep, Duration};

use crate::server::{
    adapter_manager::{AdapterError, AdapterManager},
    device::SERVICE_UUID,
    types::{
        AbortProcess, AdapterState, ChannelMessage, MethodResult, NotificationEvent,
        WsResponsePayload,
    },
    ConnectionBroadcast,
};

async fn start_scanning(adapter: &Adapter) -> Result<(), AdapterError> {
    // stop previous process just to be sure
    stop_scanning(adapter).await;

    // workaround for windows
    #[allow(unused_mut)]
    let mut filter = ScanFilter {
        services: vec![SERVICE_UUID],
    };
    #[cfg(target_os = "windows")]
    {
        // TODO: windows use default ScanFilter
        // ScanFilter doesn't work correctly on windows https://github.com/deviceplug/btleplug/issues/249
        // TODO: i believe i have a fix for that in btleplug
        filter = ScanFilter::default();
    }

    if let Err(err) = adapter.start_scan(filter).await {
        info!("Start scan error {err}");
        return Err(err.into());
    }

    Ok(())
}

async fn stop_scanning(adapter: &Adapter) {
    if let Err(err) = adapter.stop_scan().await {
        info!("start_scan/adapter.stop_scan: {err}");
    }
}

pub async fn start_scan(manager: AdapterManager, broadcast: ConnectionBroadcast) -> MethodResult {
    let adapter = manager.get_powered_adapter_or_die().await?;

    // start or restart scanning process
    // restart (stop/start) ensures that the event stream is really running in 
    // workaround for https://github.com/deviceplug/btleplug/issues/255
    if let Err(err) = start_scanning(&adapter).await {
        return Err(err.into());
    }

    if manager.is_scanning().await {
        info!("AdapterManager is already scanning");
        let devices = manager.get_devices().await;
        return Ok(WsResponsePayload::Peripherals(devices));
    } else {
        manager.set_scanning(true).await;
    }

    // listen for Abort and AdapterStateChanged messages from the other threads
    let mut receiver = broadcast.subscribe();
    let manager_ref = manager.clone();
    tokio::spawn(async move {
        while let Ok(event) = receiver.recv().await {
            match event {
                ChannelMessage::Abort(AbortProcess::Scan) => {
                    stop_scanning(&adapter).await;
                    manager_ref.set_scanning(false).await;
                    info!("Abort start_scan loop");
                    break;
                }
                ChannelMessage::Notification(NotificationEvent::AdapterStateChanged { state }) => {
                    match state {
                        AdapterState::Enabled => {
                            if manager_ref.is_scanning().await {
                                // TODO: server or client should decide when to restart scanning?
                                // start_scanning(&adapter);
                            }
                        }
                        _ => {
                            stop_scanning(&adapter).await;
                            manager_ref.set_scanning(false).await;
                        }
                    }
                }
                _ => {}
            }
        }
        info!("start_scan loop done");
    });

    // wait for first discovery events and enumerate
    sleep(Duration::from_millis(200)).await;

    let devices = manager.get_devices().await;
    Ok(WsResponsePayload::Peripherals(devices))
}
