use tokio::sync::broadcast::Sender;

use btleplug::api::{CharPropFlags, Peripheral as _};
use btleplug::platform::Adapter;

use futures::StreamExt;

use crate::server::types::{
    ChannelMessage, ConnectionStateMutex, MethodResult, NotificationEvent, WsResponseFailure,
    WsResponsePayload,
};

use crate::server::utils;

pub async fn open_device(
    uuid: String,
    _state: ConnectionStateMutex,
    adapter: Option<Adapter>,
    sender: Sender<ChannelMessage>,
) -> MethodResult {
    if !(utils::is_adapter_powered(adapter.clone()).await) {
        return Ok(WsResponsePayload::Error(WsResponseFailure::AdapterDisabled));
    }

    let adapter = adapter.unwrap();
    let device = utils::get_peripheral_by_address(&adapter, uuid).await?;

    // On macos we need to connect again, maybe it should be done for each method?
    if let Err(err) = device.connect().await {
        eprintln!(
            "Error open_device connecting to peripheral, skipping: {}",
            err
        );
        // return Err(Box::new(err));
    }

    device.discover_services().await?;
    // let device_address = device.address().to_string();
    let characteristics = device.characteristics();

    println!("open_device [{:?}]: {:?}", device, characteristics);

    let read = characteristics
        .into_iter()
        .find(|c| c.properties.contains(CharPropFlags::NOTIFY))
        .unwrap();
    device.subscribe(&read).await?;

    let bt_device = utils::get_bluetooth_device(&device).await?;
    let notification_sender = sender.clone();
    let mut notification_stream = device.notifications().await?;
    // Process while the BLE connection is not broken or stopped.
    let stream_task = tokio::spawn(async move {
        while let Some(data) = notification_stream.next().await {
            println!("Received data from [{:?}]: {:?}", data.uuid, data.value);
            if let Err(_) = notification_sender.send(ChannelMessage::Notification(
                NotificationEvent::DeviceRead {
                    device: bt_device.clone(),
                    data: data.value,
                },
            )) {
                // TODO
            }
        }
        println!("Terminating device read notification_stream....");
    });

    let mut receiver = sender.subscribe();
    tokio::spawn(async move {
        while let Ok(event) = receiver.recv().await {
            match event {
                ChannelMessage::Abort(_event) => {
                    let _ = device.unsubscribe(&read).await;
                    stream_task.abort();
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
