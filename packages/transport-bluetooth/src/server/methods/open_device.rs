use btleplug::api::{CharPropFlags, Peripheral as _};
use futures::StreamExt;
use log::info;

use crate::server::{
    ConnectionBroadcast,
    adapter_manager::AdapterManager,
    device::CHARACTERISTIC_TX,
    types::{AbortProcess, ChannelMessage, MethodError, MethodResult, NotificationEvent, WsResponsePayload},
};

pub async fn open_device(
    id: String,
    manager: AdapterManager,
    broadcast: ConnectionBroadcast,
) -> MethodResult {
    info!("open_device {:?}", id);
    
    manager.get_powered_adapter_or_die().await?;
    let device = manager.get_device_or_die(id.clone()).await?;
    let peripheral = manager.get_peripheral_or_die(&id).await?;
    // let peripheral = utils::get_peripheral_by_id(&adapter, "id".to_string()).await?;
    let is_connected = peripheral.is_connected().await.unwrap_or(false);
    if !is_connected {
        return Err(MethodError::Unexpected("DeviceNotConnected".to_string()));
    }

    // println!("peripheral connected  {:?}", peripheral.is_connected().await);
    // On windows it throws error code HRESULT(0x800000013) "The object has been closed." - TODO: investigate
    // #[cfg(target_os = "windows")]
    // {
    //     println!("open_device on windows {:?}", device);
    // }
    // // On macos we need to connect again, maybe it should be done for each method?
    // #[cfg(target_os = "macos")]
    // {
    //     if let Err(err) = peripheral.connect().await {
    //         eprintln!(
    //             "Error open_device connecting to peripheral, skipping: {}",
    //             err
    //         );
    //         // return Err(Box::new(err));
    //     }
    // }

    // try to terminate previous read (if any)
    let _ = broadcast.send(ChannelMessage::Abort(AbortProcess::Read(id.clone())));
    tokio::time::sleep(tokio::time::Duration::from_millis(5)).await;

    if peripheral.services().len() == 0 {
        peripheral.discover_services().await?;
    }
    let characteristics = peripheral.characteristics();


    let read = characteristics
        .into_iter()
        .find(|c| c.uuid == CHARACTERISTIC_TX && c.properties.contains(CharPropFlags::NOTIFY))
        .unwrap();
    peripheral.subscribe(&read).await?;

    // let bt_device = utils::get_bluetooth_device(&device).await?;
    let notification_sender = broadcast.get_sender();
    let mut notification_stream = peripheral.notifications().await?;
    let id_clone = id.clone();
    // Process while the BLE connection is not broken or stopped.
    let stream_task = tokio::spawn(async move {
        info!("Start device read notification_stream");
        while let Some(data) = notification_stream.next().await {
            info!("Received data from [{:?}]: {:?}", data.uuid, data.value);
            if let Err(err) = notification_sender.send(ChannelMessage::Notification(
                NotificationEvent::DeviceRead {
                    id: id_clone.clone(),
                    data: data.value,
                },
            )) {
                // TODO
                info!("Error in read notification_stream {:?}", err);
            }
        }
        info!("Terminating device read notification_stream....");
    });

    let current_id = id.clone();
    let mut receiver = broadcast.subscribe();
    tokio::spawn(async move {
        while let Ok(event) = receiver.recv().await {
            if let ChannelMessage::Abort(event) = event {
                match event {
                    AbortProcess::Read(id) | AbortProcess::DeviceDisconnected(id) => {
                        if current_id == id {
                            stream_task.abort();
                            let _ = peripheral.unsubscribe(&read).await;
                            info!("open_device stream terminated");
                            break;
                        }
                    }
                    // TODO: if event/connection is related to this device check if it should be closed?
                    _ => {} // ignore
                }
                break;
            }
        }
    });

    Ok(WsResponsePayload::Success(true))
}
