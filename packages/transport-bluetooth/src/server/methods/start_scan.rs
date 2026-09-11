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
    device::SERVICE_UUID,
    types::{
        AbortProcess, AdapterState, ChannelMessage, MethodResult, NotificationEvent,
        WsResponsePayload,
    },
    ConnectionBroadcast,
};

fn trezor_scan_filter() -> ScanFilter {
    // Unfiltered discovery retains every nearby BLE advertiser inside btleplug
    // for the lifetime of the adapter and grows without bound
    // (https://github.com/trezor/trezor-suite/issues/31948).
    //
    // macos: CoreBluetooth matches the filter inside the system daemon, against
    // advertisement, scan response and the hashed overflow area, so only Trezor
    // peripherals are ever surfaced. Some macs fail to update advertised
    // services in peripheral properties (the reason the previous filter was
    // removed in #21093) — the serviceless retry in AdapterManager still
    // handles those once the peripheral is delivered.
    //
    // linux: never pass service uuids to discovery — a uuid filter crashes
    // bluetoothd on bluez 5.87, and paired devices may not advertise services
    // at all. windows: ScanFilter does not work reliably
    // (https://github.com/deviceplug/btleplug/issues/249).
    if cfg!(target_os = "macos") {
        ScanFilter {
            services: vec![SERVICE_UUID],
        }
    } else {
        ScanFilter::default()
    }
}

async fn start_scanning(adapter: &Adapter) -> Result<(), AdapterError> {
    // stop previous process just to be sure
    stop_scanning(adapter).await;

    if let Err(err) = adapter.start_scan(trezor_scan_filter()).await {
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

    if manager.is_scanning().await {
        info!("AdapterManager is already scanning");
        let devices = manager.get_devices().await;
        return Ok(WsResponsePayload::Peripherals { devices });
    } else {
        manager.set_scanning(true).await;
    }

    // let the_task = broadcast.get_abortable_task("get_abortable_task".to_string());
    // start or restart scanning process
    // restart (stop/start) ensures that the event stream is really running in
    // workaround for https://github.com/deviceplug/btleplug/issues/255
    // windows: calling adapter.stop_scan breaks current broadcast.subscribe stream
    if let Err(err) = start_scanning(&adapter).await {
        return Err(err.into());
    }

    // listen for Abort and AdapterStateChanged messages from the other threads
    let mut receiver = broadcast.subscribe();
    let manager_ref = manager.clone();
    tokio::spawn(async move {
        loop {
            let event = match receiver.recv().await {
                Ok(event) => event,
                Err(RecvError::Lagged(skipped)) => {
                    // Keep watching, exiting here would strand the scan state.
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
    Ok(WsResponsePayload::Peripherals { devices })
}
