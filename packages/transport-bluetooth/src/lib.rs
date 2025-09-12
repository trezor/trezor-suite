use napi::bindgen_prelude::*;
use napi::threadsafe_function::{ThreadsafeFunction, ThreadsafeFunctionCallMode};
use napi_derive::napi;

use crate::server::{
    adapter_manager::AdapterManager,
    connection_broadcast::ConnectionBroadcast,
    methods::connect_device as connect_device_method,
    types::{ChannelMessage, ConnectDeviceParams},
};

use btleplug::api::Central;
use btleplug::api::ScanFilter;

mod server;

fn error(msg: String) -> napi::Error {
    napi::Error::new(napi::Status::GenericFailure, msg.to_string())
}

#[napi]
pub async fn connect_device(
    id: String,
    timeout: u32,
    callback: ThreadsafeFunction<String>,
) -> Result<()> {
    let manager = match AdapterManager::new().await {
        Ok(manager) => manager,
        Err(e) => Err(error(e.to_string()))?,
    };
    let broadcast = match ConnectionBroadcast::new(id.clone()) {
        Ok(broadcast) => broadcast,
        Err(e) => Err(error(e.to_string()))?,
    };

    // spawn thread and listen for Notification messages
    let mut receiver = broadcast.subscribe();
    manager.add_listener(broadcast.clone()).await;
    let channel_message_listener = tokio::spawn(async move {
        while let Ok(ChannelMessage::Notification(event)) = receiver.recv().await {
            let json = match serde_json::to_string(&event) {
                Ok(json) => json,
                Err(err) => {
                    println!("Error serialize notification {err:?}");
                    return;
                }
            };
            callback.call(Ok(json), ThreadsafeFunctionCallMode::NonBlocking);
        }
    });

    let adapter = match manager.get_adapter().await {
        Ok(Some(adapter)) => adapter,
        Ok(None) => Err(error("AdapterNotFound".to_string()))?,
        Err(e) => Err(error(e.to_string()))?,
    };

    // start scan to collect peripherals on new AdapterManager instance
    // requested device should be already discovered by the background process
    let _ = adapter.start_scan(ScanFilter::default()).await;
    tokio::time::sleep(tokio::time::Duration::from_millis(1000)).await;
    let _ = adapter.stop_scan().await;

    match connect_device_method(manager, broadcast, ConnectDeviceParams { id, timeout }).await {
        Ok(_) => Ok(()),
        Err(e) => Err(error(e.to_string()))?,
    }
}
