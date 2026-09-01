use btleplug::api::{CharPropFlags, Peripheral as _};
use futures::StreamExt;
use log::info;

use crate::server::{
    adapter_manager::{AdapterError, AdapterManager},
    types::{
        ChannelMessage, MethodError, MethodResult, NotificationCharacteristic, NotificationEvent,
        OpenDeviceParams, WsResponsePayload,
    },
    utils, ConnectionBroadcast,
};

pub async fn open_device(
    manager: AdapterManager,
    broadcast: ConnectionBroadcast,
    params: OpenDeviceParams,
) -> MethodResult {
    let id = params.id;
    let characteristic = params
        .characteristic
        .unwrap_or(NotificationCharacteristic::Read);
    info!("open_device {id} characteristic {characteristic:?}");

    manager.get_powered_adapter_or_die().await?;
    let peripheral = manager.get_peripheral_or_die(&id).await?;
    let is_connected = peripheral.is_connected().await.unwrap_or(false);
    if !is_connected {
        return Err(MethodError::Adapter(AdapterError::PeripheralNotConnected));
    }

    // Terminate a previous stream of the same characteristic (if any).
    manager
        .close_notification_streams(Some(broadcast.get_peer()), Some(&id), Some(&characteristic))
        .await;

    utils::wait_for_characteristics(&peripheral).await?;

    let characteristic_uuid = characteristic.to_uuid();
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
    let stream_task = tokio::spawn(async move {
        info!("{device_id} start {current_ch:?} stream");
        while let Some(data) = notification_stream.next().await {
            if data.uuid != characteristic_uuid {
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
        info!("{device_id} {current_ch:?} stream ended");
    });

    // The registry aborts the task when this stream, its device or this
    // websocket connection is closed. The previous per-connection watcher
    // leaked the task and its BLE subscription whenever any other client was
    // still connected (https://github.com/trezor/trezor-suite/issues/31948).
    manager.register_notification_stream(
        broadcast.get_peer().to_string(),
        id,
        characteristic,
        stream_task,
    );

    Ok(WsResponsePayload::Success { success: true })
}
