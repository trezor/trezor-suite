use log::info;
use tokio::sync::broadcast::Sender;

use btleplug::api::{Central, ScanFilter};
use btleplug::platform::Adapter;
use uuid::Uuid;

use crate::server::types::{
    AbortProcess, ChannelMessage, MethodResult, WsResponseFailure,
    WsResponsePayload,
    NotificationEvent
};

use crate::server::utils;


async fn scan(adapter: Adapter) {
    // https://github.com/deviceplug/btleplug/issues/255
    if let Err(err) = adapter.stop_scan().await {
        info!("Clear previous scan error {}", err);
    }
    // if let Err(err) = adapter.start_scan(ScanFilter::default()).await {
    //     info!("Start scan error {}", err);
    // }
    // - ScanFilter doesn't work on linux?
    // - ScanFilter incorrectly work on windows https://github.com/deviceplug/btleplug/issues/249 (for me it returned different device)
    if let Err(err) = adapter.start_scan(ScanFilter {
        services: vec![Uuid::from_u128(0x6e400001_b5a3_f393_e0a9_e50e24dcca9e)]
    }).await {
        info!("Start scan error {}", err);
    }
}

pub async fn start_scan(adapter: Option<Adapter>, sender: Sender<ChannelMessage>) -> MethodResult {
    if !(utils::is_adapter_powered(adapter.clone()).await) {
        return Ok(WsResponsePayload::Error(WsResponseFailure::AdapterDisabled));
    }

    let adapter = adapter.unwrap();

    scan(adapter.clone()).await;

    let mut receiver = sender.subscribe();
    tokio::spawn(async move {
        while let Ok(event) = receiver.recv().await {
            match event {
                ChannelMessage::Abort(event) => {
                    if matches!(event, AbortProcess::Scan) || matches!(event, AbortProcess::Disconnect) {
                        info!("Terminating scan....");
                        break;
                    }
                }
                ChannelMessage::Notification(event) => {
                    match event {
                        NotificationEvent::AdapterStateChanged { powered } => {
                            if powered {
                                info!("Restart scan...");
                                scan(adapter.clone()).await;
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

    Ok(WsResponsePayload::Success(true))
}
