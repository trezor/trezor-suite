use log::info;
use tokio::sync::broadcast::Sender;

use btleplug::api::{Central, ScanFilter};
use btleplug::platform::Adapter;

use crate::server::adapter_manager::AdapterManager;
use crate::server::device::SERVICE_UUID;
use crate::server::types::{
    AbortProcess, ChannelMessage, MethodResult, NotificationEvent, WsResponsePayload,
};
use crate::server::utils;

async fn scan(adapter: &Adapter) {
    // https://github.com/deviceplug/btleplug/issues/255
    if let Err(err) = adapter.stop_scan().await {
        info!("Clear previous scan error {}", err);
    }

    #[cfg(target_os = "windows")]
    {
        // TODO: windows scan filter default, others use below
        if let Err(err) = adapter.start_scan(ScanFilter::default()).await {
            info!("Start scan error {}", err);
        }
    }

    #[cfg(any(target_os = "linux", target_os = "macos"))]
    {
        // - ScanFilter incorrectly work on windows https://github.com/deviceplug/btleplug/issues/249 (for me it returned different device)
        if let Err(err) = adapter
            .start_scan(ScanFilter {
                // services: vec![Uuid::from_u128(0x6e400001_b5a3_f393_e0a9_e50e24dcca9e)]
                // services: vec![Uuid::from_u128(0x8c000001_a59b_4d58_a9ad_073df69fa1b1)]
                services: vec![SERVICE_UUID],
            })
            .await
        {
            info!("Start scan error {}", err);
        }
    }
}

pub async fn start_scan(manager: AdapterManager, sender: Sender<ChannelMessage>) -> MethodResult {
    let adapter = manager.get_adapter().await?;
    if !(utils::is_adapter_powered(adapter.clone()).await) {
        return Err("Adapted disabled")?;
    }

    let adapter = adapter.unwrap();
    let known_devices = manager.enumerate().await;
    println!("known {:?}", known_devices);

    scan(&adapter).await;

    let mut receiver = sender.subscribe();
    tokio::spawn(async move {
        while let Ok(event) = receiver.recv().await {
            match event {
                ChannelMessage::Abort(event) => {
                    if matches!(event, AbortProcess::Scan)
                        || matches!(event, AbortProcess::Disconnect)
                    {
                        info!("Terminating scan....");
                        break;
                    }
                }
                ChannelMessage::Notification(event) => {
                    match event {
                        NotificationEvent::AdapterStateChanged { powered } => {
                            if powered {
                                info!("Restart scan...");
                                scan(&adapter).await;
                            } else {
                                // https://github.com/deviceplug/btleplug/issues/255
                                if let Err(err) = adapter.stop_scan().await {
                                    info!("Clear running scan {}", err);
                                }
                            }
                        }
                        _ => {}
                    }
                }
                _ => {}
            }
        }
    });

    Ok(WsResponsePayload::Peripherals(known_devices))
}
