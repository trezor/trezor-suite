use log::info;
use tokio::sync::broadcast::Sender;

use btleplug::api::{Central, CentralEvent, CentralState};
use btleplug::platform::{Adapter, Peripheral, PeripheralId};
use futures::StreamExt;

use crate::server::types::{
    AbortProcess, ChannelMessage, ConnectionStateMutex, MethodResult, NotificationEvent,
    WsResponsePayload,
};
use crate::server::utils;


async fn scan_filter(adapter: &Adapter, id: &PeripheralId) -> Option<Peripheral> {
    let device = adapter.peripheral(&id).await;
    if !device.is_ok() {
        return None;
    }

    let device = device.unwrap();
    let name = utils::get_peripheral_name(&device).await.unwrap();
    if name.contains("Trezor") {
        // info!("Scan filter {:?}", device);
        return Some(device);
    }

    return None;
}

pub async fn start_events_stream(adapter: &Adapter, state: ConnectionStateMutex,sender: Sender<ChannelMessage>) -> MethodResult {
    // platform specific, on linux this will start scanning
    let mut events = adapter.events().await?;

    // subscribe to broadcast channel
    let mut receiver = sender.subscribe();

    // start thread and listen for btleplug CentralEvent
    // and watch broadcast messages to stop the thread

    let adapter = adapter.clone();
    let stream_task = tokio::spawn(async move {
        while let Some(event) = events.next().await {
            match event {
                CentralEvent::StateUpdate(state) => {
                    info!("StateUpdate: {:?}", state);
                    let mut powered = false;
                    if state == CentralState::PoweredOn {
                        powered = true;
                    }
                    utils::send_notification(
                        &sender,
                        NotificationEvent::AdapterStateChanged { powered },
                    );
                }
                CentralEvent::DeviceDiscovered(id) => {
                    let evt = scan_filter(&adapter, &id).await;
                    if evt.is_some() {
                        info!("DeviceDiscovered: {:?} : {:?}", id, evt);
                        let state = utils::enumerate(&adapter).await;
                        utils::send_notification(
                            &sender,
                            NotificationEvent::DeviceDiscovered {
                                uuid: id.to_string(),
                                devices: state,
                            },
                        );
                    }
                }
                // CentralEvent::DeviceUpdated(id) => {
                //     let evt = scan_filter(&adapter, &id).await;
                //     if evt.is_some() {
                //         let s = state.lock().await;
                //         let curr = s.advertisements.get(&id);

                //         match std::time::SystemTime::now().duration_since(std::time::SystemTime::UNIX_EPOCH) {
                //             Ok(ts) => {
                //                 // s.advertisements.insert(id, ts.as_millis());
                //                 info!("DeviceUpdated timestamp: {:?}", ts.as_millis());
                //             },
                //             Err(err) => {
                //                 info!("DeviceUpdated timestamp error: {:?}", err);
                //             },
                //         }

                //         // s.advertisements.insert(id, std::time::SystemTime::now().as_secs());
                //         info!("DeviceUpdated: {:?} : {:?}", curr, s.advertisements);
                //     }
                // }
                // CentralEvent::ServiceDataAdvertisement{id, service_data} => {
                //     let evt = scan_filter(&adapter, &id).await;
                //     if evt.is_some() {
                //         info!("ServiceDataAdvertisement: {:?} : {:?} {:?}", id, evt, service_data);
                //         let s = state.lock().await;

                //         match std::time::SystemTime::now().duration_since(std::time::SystemTime::UNIX_EPOCH) {
                //             Ok(ts) => {
                //                 // s.advertisements.insert(id, ts.as_millis());
                //                 info!("ServiceDataAdvertisement timestamp: {:?}", ts.as_millis());
                //             },
                //             Err(err) => {
                //                 info!("ServiceDataAdvertisement timestamp error: {:?}", err);
                //             },
                //         }
                //         // s.advertisements.insert(id, std::time::Instant::now());
                //     }
                // }

                // CentralEvent::DeviceConnected fires up too early, connected doesn't mean that pairing process is completed.
                // this event is emitted after successfully connection/subscription process by connect_device method.
                // CentralEvent::DeviceConnected(id) => {}

                CentralEvent::DeviceDisconnected(id) => {
                    let evt = scan_filter(&adapter, &id).await;
                    info!("DeviceDisconnected: {:?} : {:?}", id, evt);
                    if evt.is_some() {
                        let state = utils::enumerate(&adapter).await;
                        utils::send_notification(
                            &sender,
                            NotificationEvent::DeviceDisconnected {
                                uuid: id.to_string(),
                                devices: state,
                            },
                        );
                    }
                }
                _ => {}
            }
        }

        info!("Terminating scan stream_task....");
    });

    tokio::spawn(async move {
        while let Ok(event) = receiver.recv().await {
            match event {
                ChannelMessage::Abort(event) => {
                    if matches!(event, AbortProcess::Disconnect) {
                        info!("Terminating event stream....");
                        stream_task.abort();
                    }
                }
                _ => {}
            }
        }
    });

    Ok(WsResponsePayload::Success(true))
}
