use log::info;
use tokio::time::{sleep, Duration};

use crate::server::adapter_manager::AdapterManager;
use crate::server::device::{DeviceConnectionStatus, TrezorDevice};
use crate::server::types::{
    ChannelMessage, MethodError, MethodResult, NotificationEvent, WsResponsePayload, ConnectDeviceParams
};
use crate::server::device::CHARACTERISTIC_TX;
use crate::server::ConnectionBroadcast;
use btleplug::api::{CharPropFlags, Peripheral as _};

const PAIRING_TIMEOUT: Duration = Duration::from_secs(30);

async fn dispatch_status(
    manager: AdapterManager,
    device: TrezorDevice,
    phase: DeviceConnectionStatus,
) {
    device.set_connection_status(phase.clone());
    manager
        .dispatch_notification(NotificationEvent::DeviceConnectionStatus(device))
        .await
}

#[cfg(target_os = "linux")]
async fn connect_device_target(
    manager: AdapterManager,
    broadcast: ConnectionBroadcast,
    device: TrezorDevice,
    timeout: u32,
) -> Result<(), MethodError> {
    use crate::server::methods::connect_device_linux;

    match connect_device_linux(manager.clone(), broadcast, device.clone(), timeout).await {
        Ok(_) => Ok(()),
        Err(err) => Err(MethodError::Unexpected(err.to_string())),
    }
}

#[cfg(target_os = "macos")]
async fn connect_device_target(
    manager: AdapterManager,
    broadcast: ConnectionBroadcast,
    device: TrezorDevice,
    timeout: u32,
) -> Result<(), MethodError> {
    // macos BT api is quite limited
    // - missing api for custom pairing
    // - missing pairing information (is paired or not)
    // as a fallback we just run try_to_subscribe
    // where basing on the timeout or specific we can predict
    // Ok(())

    // use crate::server::methods::connect_device_macos;

    // match connect_device_macos(manager.clone(), broadcast, device.clone(), timeout).await {
    //     Ok(_) => Ok(()),
    //     Err(err) => Err(MethodError::Unexpected(err.to_string())),
    // }

    Ok(())
}

#[cfg(target_os = "windows")]
async fn connect_device_target(
    manager: AdapterManager,
    broadcast: ConnectionBroadcast,
    device: TrezorDevice,
    timeout: u32,
) -> Result<(), MethodError> {
    use crate::server::methods::connect_device_windows;

    if let Err(err) =
        connect_device_windows(manager.clone(), broadcast, device.clone(), timeout).await
    {
        return Err(MethodError::Unexpected(err.to_string()));
    };

    Ok(())
}

pub async fn connect_device(
    manager: AdapterManager,
    broadcast: ConnectionBroadcast,
    params: ConnectDeviceParams,
) -> MethodResult {
    manager.get_powered_adapter_or_die().await?;
    let device = manager.get_device_or_die(params.id).await?;

    connect_device_target(manager.clone(), broadcast.clone(), device.clone(), params.timeout).await?;

    try_to_subscribe(manager, broadcast, device).await
}

async fn try_to_subscribe(
    manager: AdapterManager,
    broadcast: ConnectionBroadcast,
    device: TrezorDevice,
) -> MethodResult {
    // TODO: catch and update_state on adapter device
    let peripheral = manager.get_peripheral_or_die(&device.get_id()).await?;
    let properties = peripheral.properties().await?;
    let is_connected = peripheral.is_connected().await.unwrap_or(false);
    // let bt_device = utils::get_bluetooth_device(&peripheral).await?;
    let mut bt_device = device.clone();

    println!(
        "Connecting before {:?}, {:?}, {:?}, {:?}",
        is_connected,
        peripheral.characteristics(),
        peripheral.services(),
        properties
    );

    // linux:
    // - if device is paired it will be visible in Adapter.periperials() even before scanning
    // - if device is paired device should already have discovered services (more than 1) right after connection
    // macos:
    // - paired device ...
    // windows:
    // - paired device ...

    dispatch_status(
        manager.clone(),
        bt_device.clone(),
        DeviceConnectionStatus::Connecting,
    )
    .await;

    if !is_connected {
        // let current_id = device.get_id();
        // let mut receiver = sender.subscribe();
        // let peripheral_ref = peripheral.clone();
        // let cancel_task = tokio::spawn(async move {
        //     while let Ok(event) = receiver.recv().await {
        //         if let ChannelMessage::Abort(event) = event {
        //             #[allow(clippy::single_match)] // see TODO below
        //             match event {
        //                 AbortProcess::DeviceDisconnected(id) => {
        //                     peripheral_ref.disconnect().await;
        //                 }
        //                 // TODO: if ws connection is related to this device
        //                 _ => {} // ignore
        //             };
        //         }
        //     }
        // });

        // Connect if we aren't already connected.
        // if let Err(err) = peripheral.connect_with_timeout(Duration::from_millis(2000)).await {
        if let Err(err) = peripheral.connect().await {
            dispatch_status(
                manager.clone(),
                bt_device.clone(),
                DeviceConnectionStatus::Disconnected,
            )
            .await;

            // Linux:
            // Error connecting to peripheral: Service discovery timed out
            // if let Err(err) = device
            //     .connect_with_timeout(std::time::Duration::from_secs(5))
            //     .await
            // {
            // TODO: linux, le-connection-abort-by-local https://github.com/hbldh/bleak/issues/993
            // le-connection-abort-by-local means that device was never paired (e) and is not in pairing mode

            // TODO: windows ... (i dont remember the error itself, medium not ready?)
            eprintln!("Error connecting to peripheral: {}", err);
            return Err(err.into());
        }
    }

    let properties = peripheral.properties().await?;
    println!(
        "Connecting after - before discovering service {:?}, {:?}, {:?}, {:?}",
        is_connected,
        peripheral.characteristics(),
        peripheral.services(),
        properties
    );

    if let Err(err) = peripheral.discover_services().await {
        println!("Err discovering services first time {:?}", err);
        return Err(err.into());
    }

    let properties = peripheral.properties().await?;
    println!(
        "Connecting discovered services {:?}, {:?}, {:?}",
        peripheral.characteristics(),
        peripheral.services(),
        properties
    );

    let notif_device_clone = bt_device.clone();
    let notif_manager = manager.clone();
    let pairing_prompt = tokio::spawn(async move {
        sleep(Duration::from_millis(1000)).await;

        dispatch_status(
            notif_manager.clone(),
            notif_device_clone,
            DeviceConnectionStatus::Pairing { pin: None },
        )
        .await;
    });

    let subscription_device = peripheral.clone();
    let start = tokio::time::Instant::now();
    let subscription_task = tokio::spawn(async move {
        let mut tries = 0;
        loop {
            // TODO: linux bug
            // when connecting device in bootloader mode subscription_device.unsubscribe will later cause error on device read
            // D-Bus error: "Failed to initiate write"
            #[cfg(target_os = "linux")]
            {
                return "Success".to_string();
            }
            #[cfg(target_os = "windows")]
            {
                return "Success".to_string();
            }

            

            let is_connected = subscription_device.is_connected().await.unwrap_or(false);
            if !is_connected {
                info!("Disconnected, breaking the loop {}", is_connected);
                return "Device disconnected".to_string();
            }

            info!(
                "Trying {} to subscribe loop {:?} {}",
                tries,
                start.elapsed(),
                is_connected
            );

            if start.elapsed() > PAIRING_TIMEOUT {
                info!("Timeout, breaking the loop {:?}", start.elapsed());
                // TODO: disconnect device?
                return "Connection timeout".to_string();
            }

            let characteristic = subscription_device
                .characteristics()
                .into_iter()
                .find(|c| c.uuid == CHARACTERISTIC_TX && c.properties.contains(CharPropFlags::NOTIFY));

            // let characteristic = subscription_device
            //     .characteristics()
            //     .into_iter()
            //     .find(|c| c.properties.contains(CharPropFlags::NOTIFY));
            if characteristic.is_some() {
                let characteristic = characteristic.unwrap();
                if let Err(err) = subscription_device.subscribe(&characteristic).await {
                    if err.to_string().contains("authentication") {
                        // if err.to_string().contains("ATT error") {
                        println!("--cool off");
                        // windows: Error { code: HRESULT(0x80650005), message: "The attribute requires authentication before it can be read or written." }"
                        // https://learn.microsoft.com/en-us/windows/win32/com/com-error-codes-9
                        // E_BLUETOOTH_ATT_INSUFFICIENT_AUTHENTICATION 0x80650005
                        // sleep(Duration::from_secs(2)).await;

                        // TODO: windows btleplug subscription error does not clear the listener
                        // if i try 10 times i will end with 10 listeners
                        if let Err(err) = subscription_device.unsubscribe(&characteristic).await {
                            println!("Err unsubscribing {:?}", err);
                        }
                    } else {
                        info!("end subscription_task loop wit error {err:?}");
                        return err.to_string();
                    }
                    // linux timeout: DbusError(D-Bus error: Operation failed with ATT error: 0x0e (org.bluez.Error.Failed))
                    println!("Err subscribing {:?}", err);
                } else {
                    println!("Unsubscribing....");
                    // try to unsubscribe
                    if let Err(err) = subscription_device.unsubscribe(&characteristic).await {
                        println!("Err unsubscribing {:?}", err);
                    }
                    println!("Subscribed, breaking the loop");
                    return "Success".to_string();
                }
            } else {
                println!("Notify characteristics not found");
            }

            sleep(Duration::from_secs(1)).await;

            tries += 1;
        }
    });

    let result = subscription_task.await.unwrap_or("Unknown".to_string());
    pairing_prompt.abort();

    if result != "Success" {
        bt_device.set_connection_status(DeviceConnectionStatus::PairingError {
            error: result.clone(),
        });

        dispatch_status(
            manager.clone(),
            bt_device.clone(),
            DeviceConnectionStatus::Disconnected, // TODO: get error from result
        )
        .await;

        // TODO: get error from result

        Err(MethodError::Unexpected(result.to_string()))?
    }
    let is_connected = peripheral.is_connected().await.unwrap_or(false);
    if !is_connected {
        dispatch_status(
            manager.clone(),
            bt_device.clone(),
            DeviceConnectionStatus::Disconnected,
        )
        .await;

        Err(MethodError::Unexpected("Device not connected".to_string()))?
    }

    let dev = manager.get_peripheral_or_die(&device.get_id()).await?;

    println!(
        "Successful subscription {}, {}",
        peripheral.address(),
        dev.address()
    );

    bt_device.set_is_paired(true);
    bt_device.update_properties(dev).await;

    dispatch_status(
        manager.clone(),
        bt_device.clone(),
        DeviceConnectionStatus::Connected,
    )
    .await;

    let devices = manager.get_devices().await;
    manager
        .dispatch_notification(NotificationEvent::DeviceConnected {
            id: bt_device.get_id(),
            devices,
        })
        .await;

    Ok(WsResponsePayload::Success(true))
}
