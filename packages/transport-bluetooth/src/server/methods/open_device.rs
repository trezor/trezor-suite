use btleplug::api::{CharPropFlags, Peripheral as _};
use futures::StreamExt;
use log::info;
use tokio::time::{sleep, Duration};

use crate::server::{
    adapter_manager::{AdapterError, AdapterManager},
    device::CHARACTERISTIC_TX,
    types::{
        AbortProcess, ChannelMessage, MethodError, MethodResult, NotificationEvent,
        OpenDeviceParams, WsResponsePayload,
    },
    ConnectionBroadcast,
};

pub async fn open_device(
    manager: AdapterManager,
    broadcast: ConnectionBroadcast,
    params: OpenDeviceParams,
) -> MethodResult {
    let id = params.id;
    info!("open_device {id}");

    manager.get_powered_adapter_or_die().await?;
    let peripheral = manager.get_peripheral_or_die(&id).await?;
    let is_connected = peripheral.is_connected().await.unwrap_or(false);
    if !is_connected {
        return Err(MethodError::Adapter(AdapterError::PeripheralNotConnected));
    }

    // try to terminate/abort previous read (if any)
    broadcast.send(ChannelMessage::Abort(AbortProcess::Read(id.clone())));
    sleep(Duration::from_millis(5)).await;

    if peripheral.services().is_empty() {
        // services() always empty on linux macos
        // discover_services() slows down the process on windows
        peripheral.discover_services().await?;
    }

    let characteristics = peripheral.characteristics();
    let Some(tx) = characteristics
        .into_iter()
        .find(|c| c.uuid == CHARACTERISTIC_TX && c.properties.contains(CharPropFlags::NOTIFY))
    else {
        return Err(MethodError::Adapter(
            AdapterError::PeripheralCharacteristicNotFound,
        ));
    };

    peripheral.subscribe(&tx).await?;

    let notification_sender = broadcast.get_sender();
    let mut notification_stream = peripheral.notifications().await?;
    let device_id = id.clone();
    let stream_task = tokio::spawn(async move {
        info!("{device_id} start notification_stream");
        while let Some(data) = notification_stream.next().await {
            info!("{device_id} recv data");
            if let Err(err) = notification_sender.send(ChannelMessage::Notification(
                NotificationEvent::DeviceRead {
                    id: device_id.clone(),
                    data: data.value,
                },
            )) {
                info!("{device_id} error in notification_stream {err}");
            }
        }
        info!("{device_id} notification_stream terminated");
    });

    let current_id = id.clone();
    let mut receiver = broadcast.subscribe();
    tokio::spawn(async move {
        while let Ok(event) = receiver.recv().await {
            // TODO: if websocket client connection is related to this device
            // AbortProcess::ClientDisconnected
            if let ChannelMessage::Abort(
                AbortProcess::Read(id) | AbortProcess::DeviceDisconnected(id),
            ) = event
            {
                if current_id == id {
                    stream_task.abort();
                    let _ = peripheral.unsubscribe(&tx).await;
                    info!("{id} abort stream terminated");
                    break;
                }
            }
        }
    });

    Ok(WsResponsePayload::Success { success: true })
}
