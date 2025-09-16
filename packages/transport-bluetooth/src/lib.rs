use btleplug::api::{Central, ScanFilter};
use btleplug::platform::Adapter;
use napi::bindgen_prelude::*;
use napi::threadsafe_function::{ThreadsafeFunction, ThreadsafeFunctionCallMode};
use napi_derive::napi;

use crate::server::{
    adapter_manager::AdapterManager,
    connection_broadcast::ConnectionBroadcast,
    methods::{
        connect_device as connect_device_method, disconnect_device as disconnect_device_method,
    },
    types::{ChannelMessage, ConnectDeviceParams, DisconnectDeviceParams, NotificationEvent},
};

mod server;

async fn init_adapter(target_id: String) -> Result<(AdapterManager, ConnectionBroadcast, Adapter)> {
    let manager = match AdapterManager::new().await {
        Ok(manager) => manager,
        Err(e) => Err(error(e.to_string()))?,
    };

    let broadcast = match ConnectionBroadcast::new(target_id.clone()) {
        Ok(broadcast) => broadcast,
        Err(e) => Err(error(e.to_string()))?,
    };

    manager.add_listener(broadcast.clone()).await;

    let adapter = match manager.get_adapter().await {
        Ok(Some(adapter)) => adapter,
        Ok(None) => Err(error("AdapterNotFound".to_string()))?,
        Err(e) => Err(error(e.to_string()))?,
    };

    Ok((manager, broadcast, adapter))
}

fn start_event_emitter(
    broadcast: ConnectionBroadcast,
    callback: ThreadsafeFunction<String>,
) -> tokio::task::JoinHandle<()> {
    let mut receiver = broadcast.subscribe();

    tokio::spawn(async move {
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
    })
}

// start scan to collect peripherals on new AdapterManager instance
// requested device should be already discovered by the background process
async fn wait_for_device(
    adapter: Adapter,
    broadcast: ConnectionBroadcast,
    target_id: String,
) -> Result<()> {
    let mut receiver = broadcast.subscribe();
    let mut event_listener = tokio::spawn(async move {
        while let Ok(ChannelMessage::Notification(NotificationEvent::DeviceDiscovered {
            id, ..
        })) = receiver.recv().await
        {
            if id == target_id {
                break;
            }
        }
    });

    let _ = adapter.start_scan(ScanFilter::default()).await;

    let timeout = tokio::time::sleep(tokio::time::Duration::from_secs(2));
    tokio::pin!(timeout);
    loop {
        tokio::select! {
            _ = &mut event_listener => {
                break;
            }
            _ = &mut timeout => {
                break;
            }
        }
    }

    let _ = adapter.stop_scan().await;

    Ok(())
}

fn error(msg: String) -> napi::Error {
    napi::Error::new(napi::Status::GenericFailure, msg.to_string())
}

#[napi]
pub async fn connect_device(
    id: String,
    timeout: u32,
    callback: ThreadsafeFunction<String>,
) -> Result<()> {
    let (manager, broadcast, adapter) = init_adapter(id.clone()).await?;
    let _ = start_event_emitter(broadcast.clone(), callback);
    let _ = wait_for_device(adapter, broadcast.clone(), id.clone()).await;

    match connect_device_method(
        manager.clone(),
        broadcast.clone(),
        ConnectDeviceParams {
            id: id.clone(),
            timeout,
        },
    )
    .await
    {
        Ok(_) => Ok::<(), napi::Error>(()),
        Err(e) => Err(error(e.to_string()))?,
    }?;

    match disconnect_device_method(
        manager.clone(),
        broadcast.clone(),
        DisconnectDeviceParams { id: id.clone() },
    )
    .await
    {
        Ok(_) => Ok(()),
        Err(e) => Err(error(e.to_string()))?,
    }
}
