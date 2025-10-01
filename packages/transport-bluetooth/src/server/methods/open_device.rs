use btleplug::api::{CharPropFlags, Peripheral as _};
use futures::StreamExt;
use log::info;
use tokio::time::{sleep, Duration};

use crate::server::{
    adapter_manager::{AdapterError, AdapterManager},
    device::{CHARACTERISTIC_BATTERY_LEVEL, CHARACTERISTIC_PUSH_NOTIFICATION, CHARACTERISTIC_TX},
    types::{
        AbortProcess, ChannelMessage, MethodError, MethodResult, NotificationCharacteristic,
        NotificationEvent, OpenDeviceParams, WsResponsePayload,
    },
    utils, ConnectionBroadcast,
};

pub async fn open_device(
    manager: AdapterManager,
    broadcast: ConnectionBroadcast,
    params: OpenDeviceParams,
) -> MethodResult {
    let id = params.id;
    let characteristic = params.characteristic;
    info!("open_device {id} characteristic {characteristic:?}");

    manager.get_powered_adapter_or_die().await?;
    let peripheral = manager.get_peripheral_or_die(&id).await?;
    let is_connected = peripheral.is_connected().await.unwrap_or(false);
    if !is_connected {
        return Err(MethodError::Adapter(AdapterError::PeripheralNotConnected));
    }

    let characteristic = characteristic.unwrap_or(NotificationCharacteristic::Read);
    let characteristic_uuid = match characteristic {
        NotificationCharacteristic::Read => CHARACTERISTIC_TX,
        NotificationCharacteristic::TrezorPushNotification => CHARACTERISTIC_PUSH_NOTIFICATION,
        NotificationCharacteristic::BatteryLevel => CHARACTERISTIC_BATTERY_LEVEL,
    };

    // try to terminate/abort previous read (if any)
    broadcast.send(ChannelMessage::Abort(AbortProcess::NotificationStream(
        id.clone(),
        Some(characteristic.clone()),
    )));
    sleep(Duration::from_millis(5)).await;

    utils::wait_for_characteristics(&peripheral).await?;

    let Some(tx) = peripheral
        .characteristics()
        .into_iter()
        .find(|c| c.uuid == characteristic_uuid && c.properties.contains(CharPropFlags::NOTIFY))
    else {
        return Err(MethodError::Adapter(
            AdapterError::PeripheralCharacteristicNotFound,
        ));
    };

    peripheral.subscribe(&tx).await?;

    let notification_sender = broadcast.get_sender();
    let mut notification_stream = peripheral.notifications().await?;
    let device_id = id.clone();
    let current_ch = characteristic.clone();
    let current_uuid = characteristic_uuid.clone();
    let stream_task = tokio::spawn(async move {
        info!("{device_id} start {current_ch:?} stream");
        while let Some(data) = notification_stream.next().await {
            if data.uuid != current_uuid {
                continue;
            }
            info!("{device_id} {current_ch:?} data");

            let msg = ChannelMessage::Notification(NotificationEvent::DeviceRead {
                id: device_id.clone(),
                characteristic: current_ch.clone(),
                data: data.value,
            });

            if let Err(err) = notification_sender.send(msg) {
                info!("{device_id} error in {current_ch:?} stream {err}");
            }
        }
    });

    let manager_ref = manager.clone();
    let current_id = id.clone();
    let current_ch = characteristic.clone();
    let mut receiver = broadcast.subscribe();
    tokio::spawn(async move {
        while let Ok(event) = receiver.recv().await {
            // TODO: if websocket client connection is related to this device
            // AbortProcess::ClientDisconnected
            if let ChannelMessage::Abort(AbortProcess::ClientDisconnected(_client)) = event {
                if manager_ref.is_listeners_empty().await {
                    stream_task.abort();
                    let _ = peripheral.unsubscribe(&tx).await;
                    info!("All clients disconnected, {id} {current_ch:?} stream terminated");
                }
                break;
            }

            // check if id should be disconnected
            let maybe_id = match event {
                ChannelMessage::Abort(AbortProcess::NotificationStream(id, maybe_ch)) => {
                    let matches_ch = maybe_ch.map_or(true, |ch| ch == current_ch);
                    matches_ch.then_some(id)
                }
                ChannelMessage::Abort(AbortProcess::DeviceDisconnected(id)) => Some(id),
                _ => None,
            };

            // check current_id == maybe_id
            if let Some(id) = maybe_id.filter(|id| id == &current_id) {
                stream_task.abort();
                let _ = peripheral.unsubscribe(&tx).await;
                info!("{id} {current_ch:?} stream terminated");
                break;
            }
        }
    });

    Ok(WsResponsePayload::Success { success: true })
}
