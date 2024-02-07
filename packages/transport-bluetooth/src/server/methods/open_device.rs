use btleplug::api::{CharPropFlags, Peripheral as _};
use futures::StreamExt;
use tokio::sync::broadcast::Sender;

use crate::server::adapter_manager::AdapterManager;
use crate::server::types::{ChannelMessage, MethodResult, NotificationEvent, WsResponsePayload};
use crate::server::utils;

pub async fn open_device(
    uuid: String,
    manager: AdapterManager,
    sender: Sender<ChannelMessage>,
) -> MethodResult {
    let adapter = manager.get_adapter().await?;
    if !(utils::is_adapter_powered(adapter.clone()).await) {
        return Err("Adapted disabled")?;
    }

    let device_1 = manager.get_device(uuid.clone()).await;
    if device_1.is_none() {
        Err("Device not found")?;
    }

    let adapter = adapter.unwrap();
    let device = utils::get_peripheral_by_address(&adapter, uuid.clone()).await?;
    // let device = utils::get_peripheral_by_address(&adapter, "uuid".to_string()).await?;
    let is_connected = device.is_connected().await.unwrap_or(false);
    if !is_connected {
        return Err("Device not connected")?;
    }

    // println!("device connected  {:?}", device.is_connected().await);

    // On windows it throws error code HRESULT(0x800000013) "The object has been closed." - TODO: investigate
    // #[cfg(target_os = "windows")]
    // {
    //     println!("open_device on windows {:?}", device);
    // }
    // // On macos we need to connect again, maybe it should be done for each method?
    // #[cfg(target_os = "macos")]
    // {
    //     if let Err(err) = device.connect().await {
    //         eprintln!(
    //             "Error open_device connecting to peripheral, skipping: {}",
    //             err
    //         );
    //         // return Err(Box::new(err));
    //     }
    // }

    device.discover_services().await?;
    // let device_address = device.address().to_string();
    let characteristics = device.characteristics();

    println!("open_device [{:?}]: {:?}", device, characteristics);

    let read = characteristics
        .into_iter()
        .find(|c| c.properties.contains(CharPropFlags::NOTIFY))
        .unwrap();
    device.subscribe(&read).await?;

    // let bt_device = utils::get_bluetooth_device(&device).await?;
    let notification_sender = sender.clone();
    let mut notification_stream = device.notifications().await?;
    let uuid_clone = uuid.clone();
    // Process while the BLE connection is not broken or stopped.
    let stream_task = tokio::spawn(async move {
        println!("Start device read notification_stream");
        while let Some(data) = notification_stream.next().await {
            println!("Received data from [{:?}]: {:?}", data.uuid, data.value);
            if let Err(err) = notification_sender.send(ChannelMessage::Notification(
                NotificationEvent::DeviceRead {
                    uuid: uuid_clone.clone(),
                    data: data.value,
                },
            )) {
                // TODO
                println!("Error in read notification_stream {:?}", err);
            }
        }
        println!("Terminating device read notification_stream....");
    });

    let mut receiver = sender.subscribe();
    tokio::spawn(async move {
        while let Ok(event) = receiver.recv().await {
            match event {
                ChannelMessage::Abort(_event) => {
                    stream_task.abort();
                    let _ = device.unsubscribe(&read).await;
                    println!("Terminating device read....");
                    break;
                }
                // TODO: DeviceDisconnect
                _ => {}
            }
        }
    });

    Ok(WsResponsePayload::Success(true))
}
