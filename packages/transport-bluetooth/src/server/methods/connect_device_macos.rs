use btleplug::api::{BDAddr, CharPropFlags, Peripheral};
use log::info;
use tokio::time::{sleep, Duration};

use crate::server::adapter_manager::AdapterManager;
use crate::server::device::{DeviceConnectionStatus, TrezorDevice};
use crate::server::types::{AbortProcess, ChannelMessage, MethodError, NotificationEvent};
use crate::server::ConnectionBroadcast;

async fn dispatch_status(
    manager: AdapterManager,
    device: TrezorDevice,
    phase: DeviceConnectionStatus,
) {
    device.set_connection_status(phase);
    manager
        .dispatch_notification(NotificationEvent::DeviceConnectionStatus(device))
        .await
}

pub async fn connect_device_macos(
    manager: AdapterManager,
    broadcast: ConnectionBroadcast,
    device: TrezorDevice,
    timeout: u32,
) -> Result<(), Box<dyn std::error::Error>> {
    let peripheral = manager.get_peripheral_or_die(&device.get_id()).await?;
    let is_connected = peripheral.is_connected().await.unwrap_or(false);
    if is_connected {
        return Ok(());
    }

    dispatch_status(
        manager.clone(),
        device.clone(),
        DeviceConnectionStatus::Connecting,
    )
    .await;

    // let br = ConnectionBroadcast::new("connect".to_string())?;

    // let current_id = device.get_id();
    // let mut receiver = broadcast.subscribe();
    // let peripheral_ref = peripheral.clone();
    // let br_ref = br.clone();
    // let cancel_task = tokio::spawn(async move {
    //     info!("connect_device/cancel_task start");
    //     while let Ok(ref event1) = receiver.recv().await {
    //         if let ChannelMessage::Abort(event) = event1 {
    //             #[allow(clippy::single_match)] // see TODO below
    //             match event {
    //                 AbortProcess::DeviceDisconnected(id) => {
    //                     info!("connect_device/cancel_task run");
    //                     peripheral_ref.disconnect().await;
    //                     br_ref.send(event1.clone());
    //                     break;
    //                 }
    //                 // TODO: if ws connection is related to this device
    //                 _ => {} // ignore
    //             };
    //         }
    //     }
    //     info!("connect_device/cancel_task done");
    // });

    // let peripheral_ref = peripheral.clone();
    // let br_ref = br.clone();
    // let timeout_task = tokio::spawn(async move {
    //     info!("connect_device/timeout_task start {timeout}");
    //     let tm = Duration::from_millis(timeout.into());
    //     sleep(tm).await;
    //     println!("connect_device/timeout_task run");
    //     // disconnect_device(device_path_clone, timeout).await;
    //     peripheral_ref.disconnect().await;
    //     info!("connect_device/timeout_task done");
    //     br_ref.send(ChannelMessage::Abort(AbortProcess::DeviceDisconnected("a".into())));
    // });

    let (abort_sender, cancel_task, timeout_task) =
        broadcast.get_abortable_task(device.get_id(), timeout);

    let peripheral_ref = peripheral.clone();
    let br_ref = abort_sender.clone();
    let connection_task = tokio::spawn(async move {
        info!("connect_device/connection_task start");
        // macos this could be pending forever if device is paired but not in range anymore
        // device disconnection doesnt help, btleplug logs:
        // btleplug::corebluetooth::peripheral > Event receiver died, breaking of of corebluetooth device loop
        if let Err(err) = peripheral_ref.connect().await {
            // dispatch_status(
            //     manager.clone(),
            //     bt_device.clone(),
            //     DeviceConnectionStatus::Disconnected,
            // )
            // .await;
        }
        info!("connect_device/connection_task done");
        br_ref.send(AbortProcess::DeviceDisconnected("b".into()));
    });

    let msg = abort_sender.subscribe().recv().await;
    println!("ConnectionBroadcast {msg:?}");

    connection_task.abort();
    timeout_task.abort();
    cancel_task.abort();

    // let tt = || { timeout_task.abort(); };

    let response = tokio::select! {
        response = connection_task => {
            // if let Some(t) = cancel_task.take() {
            //     t.abort();
            // }
            // if let Some(t) = timeout_task.take() {
            //     t.abort();
            // }
            println!("connection_task ended with {response:?}");
        },
        // response = async { timeout_task.take().unwrap().await } => {
        response = timeout_task => {
            // if let Some(t) = cancel_task.take() {
            //     t.abort();
            // }
            // connection_task.take().abort();
            // cancel_task.abort();
            println!("timeout_task ended with {response:?}");
            // if let Some(err) = response.unwrap() {
            //     dispatch_status(manager.clone(), device.clone(), DeviceConnectionStatus::PairingError{ error: err.to_string() }).await;
            //     return Err(err)?;
            //     // return Err(err.to_string());
            // }
            if response.is_ok() {
                return Err("Timeout".to_string().into());
            }
        },
        // response = async { cancel_task.take().unwrap().await } => {
        response = cancel_task => {
            println!("cancel_task ended with {response:?}");
            if response.is_ok() {
                return Err("Cancel".to_string().into());
            }
            // if let Some(t) = timeout_task.take() {
            //     t.abort();
            // }
            // timeout_task.abort();
            // cancel_task.abort();
            // props_task.take().unwrap().abort();
            // if let Some(err) = response.unwrap() {
            //     dispatch_status(manager.clone(), device.clone(), DeviceConnectionStatus::PairingError{ error: err.to_string() }).await;
            //     return Err(err)?;
            // }

        },

    };

    // tt();

    // timeout_task.abort();

    println!("connect_device_macos {response:?}");

    // if let Err(err) = peripheral.connect().await {
    //     // dispatch_status(
    //     //     manager.clone(),
    //     //     bt_device.clone(),
    //     //     DeviceConnectionStatus::Disconnected,
    //     // )
    //     // .await;
    // }

    // timeout_task.abort();
    // cancel_task.abort();

    if let Err(err) = peripheral.discover_services().await {
        println!("Err discovering services first time {:?}", err);
        return Err(err.into());
    }

    let notif_device_clone = device.clone();
    let notif_manager = manager.clone();
    // let pairing_prompt = tokio::spawn(async move {
    //     sleep(Duration::from_millis(1000)).await;

    //     dispatch_status(
    //         notif_manager.clone(),
    //         notif_device_clone,
    //         DeviceConnectionStatus::Pairing { pin: None },
    //     )
    //     .await;
    // });

    let (abort_sender, cancel_task, timeout_task) =
        broadcast.get_abortable_task(device.get_id(), timeout);

    let subscription_device = peripheral.clone();
    let start = tokio::time::Instant::now();
    let br_ref = abort_sender.clone();
    let subscription_task = tokio::spawn(async move {
        let mut tries = 0;
        loop {
            let is_connected = subscription_device.is_connected().await.unwrap_or(false);
            if !is_connected {
                info!("Disconnected, breaking the loop {}", is_connected);

                br_ref.send(AbortProcess::DeviceDisconnected("b".into()));

                break;
            }

            let characteristic = subscription_device
                .characteristics()
                .into_iter()
                .find(|c| c.properties.contains(CharPropFlags::NOTIFY));
            if characteristic.is_some() {
                let characteristic = characteristic.unwrap();
                if let Err(err) = subscription_device.subscribe(&characteristic).await {
                    br_ref.send(AbortProcess::DeviceDisconnected("b".into()));
                    println!("subscription_device with error {err}");
                    break;
                } else {
                    println!("Unsubscribing....");
                    // try to unsubscribe
                    if let Err(err) = subscription_device.unsubscribe(&characteristic).await {
                        println!("Err unsubscribing {:?}", err);
                    }
                    println!("Subscribed, breaking the loop");
                    br_ref.send(AbortProcess::DeviceDisconnected("b".into()));

                    break;
                }
            }
        }
    });

    let msg = abort_sender.subscribe().recv().await;
    println!("subscription_task {msg:?}");

    subscription_task.abort();
    timeout_task.abort();
    cancel_task.abort();

    let peripheral_ref = peripheral.clone();
    let response = tokio::select! {
        response = subscription_task => {
            println!("subscription_task ended with {response:?}");
        },
        response = timeout_task => {
            println!("timeout_task ended with {response:?}");
            if response.is_ok() {
                return Err("Timeout".to_string().into());
            }
        },
        response = cancel_task => {
            println!("cancel_task ended with {response:?}");
            if response.is_ok() {
                // try to unsubscribe
                let characteristic = peripheral_ref
                .characteristics()
                .into_iter()
                .find(|c| c.properties.contains(CharPropFlags::NOTIFY));
                if let Err(err) = peripheral_ref.unsubscribe(&characteristic.unwrap()).await {
                    println!("Err unsubscribing {:?}", err);
                }
                peripheral_ref.disconnect().await;
                return Err("Cancel".to_string().into());
            }
        },

    };

    Ok(())
}
