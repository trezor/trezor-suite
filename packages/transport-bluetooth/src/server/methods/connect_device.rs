use log::info;
use tokio::time::Duration;

use btleplug::api::{Central, CharPropFlags, Peripheral as _};
use btleplug::platform::Adapter;

use crate::server::adapter_manager::AdapterManager;
use crate::server::types::{ChannelMessage, MethodResult, NotificationEvent, WsResponsePayload};
use crate::server::utils;

const PAIRING_TIMEOUT: Duration = Duration::from_secs(30);

#[cfg(target_os = "linux")]
async fn connect_device_inner(
    uuid: String,
    adapter: Option<Adapter>,
    manager: AdapterManager,
) -> MethodResult {
    use dbus::arg::{RefArg, Variant};
    use dbus::nonblock::Proxy;
    use std::collections::HashMap;

    let dev = manager.get_device(uuid.clone()).await;
    if dev.is_none() {
        Err("Device not found")?;
    }

    if dev.unwrap().is_paired() {
        info!("Device already paired");
        return connect_device_common(uuid, adapter, manager).await;
    }

    manager
        .send_to_listeners(ChannelMessage::Notification(
            NotificationEvent::DevicePairing {
                uuid: uuid.clone(),
                paired: false,
                pin: "".to_string(),
            },
        ))
        .await;

    let (resource, conn) = dbus_tokio::connection::new_system_sync()?;
    let connection_task = tokio::spawn(resource);

    let device_path = format!("/org/bluez/{}", uuid.clone());
    let device_proxy = Proxy::new(
        "org.bluez",
        device_path.clone(),
        Duration::from_secs(30),
        conn.clone(),
    );

    let device_path_task = device_path.clone();
    let mut props_task = Some(tokio::spawn(async move {
        loop {
            tokio::time::sleep(Duration::from_secs(1)).await;
            // create new proxy on each try
            let device_proxy = Proxy::new(
                "org.bluez",
                device_path_task.clone(),
                Duration::from_secs(5),
                conn.clone(),
            );

            let result: Result<(HashMap<String, Variant<Box<dyn RefArg>>>,), dbus::Error> =
                device_proxy
                    .method_call(
                        "org.freedesktop.DBus.Properties",
                        "GetAll",
                        ("org.bluez.Device1",),
                    )
                    .await;

            let mut should_disconnect = false;
            match result {
                Ok((props,)) => {
                    if let Some(variant) = props.get("Paired") {
                        if let Some(is_paired) = variant.0.as_any().downcast_ref::<bool>().cloned()
                        {
                            if is_paired {
                                should_disconnect = true;
                            }
                        }
                    }
                }
                Err(error) => {
                    return Some(error);
                }
            }

            if should_disconnect {
                let _result: Result<(), dbus::Error> = device_proxy
                    .method_call("org.bluez.Device1", "Disconnect", ())
                    .await;
                return None;
            }
        }
    }));

    // Pairing occasionally times out even if pairing process was successful
    // error: Did not receive a reply. Possible causes include: the remote application did not send a reply...
    // workaround: Listen of "Paired" property changes in props_task above
    let pairing_task = tokio::spawn(async move {
        // NOTE: there is no way to abort method_call
        let result: Result<(), dbus::Error> = device_proxy
            .method_call("org.bluez.Device1", "Pair", ())
            .await;
        match result {
            Ok(_) => {
                return None;
            }
            Err(error) => {
                return Some(error);
            }
        }
    });

    tokio::select! {
        response = props_task.as_mut().unwrap() => {
            connection_task.abort();
            println!("props_task ended with {response:?}");
            if let Some(err) = response.unwrap() {
                return Err(err)?;
            }
        },
        response = pairing_task => {
            connection_task.abort();
            props_task.take().unwrap().abort();
            println!("pairing_task ended with {response:?}");
            if let Some(err) = response.unwrap() {
                return Err(err)?;
            }
        },
    };

    manager
        .send_to_listeners(ChannelMessage::Notification(
            NotificationEvent::DevicePairing {
                uuid: uuid.clone(),
                paired: true,
                pin: "".to_string(),
            },
        ))
        .await;

    return connect_device_common(uuid, adapter, manager).await;
}

#[cfg(target_os = "macos")]
async fn connect_device_inner(
    uuid: String,
    adapter: Option<Adapter>,
    manager: AdapterManager,
) -> MethodResult {
    return connect_device_common(uuid, adapter, manager).await;
}

#[cfg(target_os = "windows")]
async fn connect_device_inner(
    uuid: String,
    adapter: Option<Adapter>,
    manager: AdapterManager,
) -> MethodResult {
    use btleplug::api::BDAddr;
    use windows::{
        Devices::Bluetooth::BluetoothLEDevice,
        Devices::Enumeration::{
            DeviceInformationCustomPairing, DevicePairingKinds, DevicePairingRequestedEventArgs,
            DevicePairingResultStatus,
        },
        Foundation::TypedEventHandler,
    };

    let address = BDAddr::from_str_delim(&uuid).unwrap();
    let device = BluetoothLEDevice::FromBluetoothAddressAsync(address.into())?.await?;
    let device_info = device.DeviceInformation()?;
    let pairing = device_info.Pairing()?;

    if !pairing.IsPaired()? {
        println!("Device not paired. Attempting to pair...");

        if !pairing.CanPair()? {
            Err("Device cannot be paired")?
        }

        let custom_pairing: DeviceInformationCustomPairing = pairing.Custom()?;
        let bt_manager = manager.clone();
        let bt_uuid = uuid.clone();
        let (tx, _) = tokio::sync::broadcast::channel::<String>(32);
        let pin_sender = tx.clone();
        let mut listener = tx.subscribe();
        let pin_listener = tokio::spawn(async move {
            while let Ok(pin) = listener.recv().await {
                bt_manager
                    .send_to_listeners(ChannelMessage::Notification(
                        NotificationEvent::DevicePairing {
                            uuid: bt_uuid.clone(),
                            paired: false,
                            pin,
                        },
                    ))
                    .await;
            }
        });

        {
            let pairing_requested_handler = TypedEventHandler::new(
                move |_sender, args: &Option<DevicePairingRequestedEventArgs>| {
                    if let Some(args) = args {
                        let kind = args.PairingKind()?;
                        if kind == DevicePairingKinds::ConfirmPinMatch {
                            let pin = args.Pin()?;
                            println!("Confirming PIN match: {}", pin);
                            args.Accept()?; // automatically confirm host pin
                            if let Err(err) = pin_sender.send(pin.to_string()) {
                                println!("Error sending PIN match: {:?}", err);
                            }
                        }
                    }
                    Ok(())
                },
            );
            custom_pairing.PairingRequested(&pairing_requested_handler)?;
        }

        let pairing_result = custom_pairing
            .PairAsync(DevicePairingKinds::ConfirmPinMatch)?
            .await?;
        pin_listener.abort();
        let pairing_status = pairing_result.Status()?;
        if pairing_status == DevicePairingResultStatus::Paired {
            println!("Successfully paired with device");
            // similar to linux, disconnect after successful paring process and proceed to connect_device_common
            let result = device.Close();
            if let Err(err) = result {
                println!("Error while closing device {:?}", err);
            }

            // TODO: maybe this event is useless?
            manager
                .send_to_listeners(ChannelMessage::Notification(
                    NotificationEvent::DevicePairing {
                        uuid: uuid.clone(),
                        paired: true,
                        pin: "".to_string(),
                    },
                ))
                .await;
        } else {
            let error = format!("Pairing failed with status: {:?}", pairing_status);
            return Err(error)?;
        }
    }

    return connect_device_common(uuid, adapter, manager).await;
}

pub async fn connect_device(uuid: String, manager: AdapterManager) -> MethodResult {
    let adapter = manager.get_adapter().await?;
    if !(utils::is_adapter_powered(adapter.clone()).await) {
        return Err("AdapterDisabled")?;
    }

    return connect_device_inner(uuid, adapter, manager).await;
}

async fn connect_device_common(
    uuid: String,
    adapter: Option<Adapter>,
    manager: AdapterManager,
) -> MethodResult {
    let adapter = adapter.unwrap();
    let peripheral = utils::get_peripheral_by_address(&adapter, uuid.clone()).await?;
    let device_id = peripheral.id();
    let properties = peripheral.properties().await?;
    let is_connected = peripheral.is_connected().await.unwrap_or(false);
    // let bt_device = utils::get_bluetooth_device(&peripheral).await?;
    let bt_device = manager.get_device(uuid.clone()).await.unwrap();

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

    if !is_connected {
        println!("Connecting...");

        manager
            .send_to_listeners(ChannelMessage::Notification(
                NotificationEvent::DeviceConnectionStatus {
                    uuid: uuid.clone(),
                    phase: "connecting".to_string(),
                },
            ))
            .await;

        // Connect if we aren't already connected.
        if let Err(err) = peripheral.connect().await {
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
            return Err(Box::new(err));
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
        return Err(Box::new(err));
    }

    let properties = peripheral.properties().await?;
    println!(
        "Connecting discovered services {:?}, {:?}, {:?}",
        peripheral.characteristics(),
        peripheral.services(),
        properties
    );

    let notif_device = uuid.clone();
    let notif_manager = manager.clone();
    let pairing_prompt = tokio::spawn(async move {
        tokio::time::sleep(Duration::from_millis(1000)).await;

        notif_manager
            .send_to_listeners(ChannelMessage::Notification(
                NotificationEvent::DevicePairing {
                    uuid: notif_device.clone(),
                    paired: false,
                    pin: "".to_string(),
                },
            ))
            .await;
    });

    let subscription_device = peripheral.clone();
    let start = tokio::time::Instant::now();
    let subscription_task = tokio::spawn(async move {
        let mut tries = 0;
        loop {
            let is_connected = subscription_device.is_connected().await.unwrap_or(false);
            if !is_connected {
                info!("Disconnected, breaking the loop {}", is_connected);
                return false;
            }

            info!(
                "Trying {} to subscribe loop {:?} {}",
                tries,
                start.elapsed(),
                is_connected
            );

            if start.elapsed() > PAIRING_TIMEOUT {
                info!("Timeout, breaking the loop {:?}", start.elapsed());
                return false;
            }

            let characteristic = subscription_device
                .characteristics()
                .into_iter()
                .find(|c| c.properties.contains(CharPropFlags::NOTIFY));
            if characteristic.is_some() {
                let characteristic = characteristic.unwrap();
                if let Err(err) = subscription_device.subscribe(&characteristic).await {
                    if err.to_string().contains("authentication") {
                        // if err.to_string().contains("ATT error") {
                        println!("--cool off");
                        // windows: Error { code: HRESULT(0x80650005), message: "The attribute requires authentication before it can be read or written." }"
                        // https://learn.microsoft.com/en-us/windows/win32/com/com-error-codes-9
                        // E_BLUETOOTH_ATT_INSUFFICIENT_AUTHENTICATION 0x80650005
                        // tokio::time::sleep(Duration::from_secs(2)).await;

                        // TODO: windows btle-plug subscription error does not clear listener, if i try 10 times i will end wind 10 listeners
                        if let Err(err) = subscription_device.unsubscribe(&characteristic).await {
                            println!("Err unsubscribing {:?}", err);
                        }
                    } else {
                        info!("end subscription_task loop wit error {err:?}");
                        return false;
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
                    return true;
                }
            } else {
                println!("Notify characteristics not found");
            }

            tokio::time::sleep(Duration::from_secs(1)).await;

            tries += 1;
        }
    });

    let result = subscription_task.await.unwrap_or(false);
    if !result {
        // TODO: get error from result
        Err("Connection failed")?
    }
    let is_connected = peripheral.is_connected().await.unwrap_or(false);
    if !is_connected {
        Err("Device disconnected")?
    }

    manager
        .send_to_listeners(ChannelMessage::Notification(
            NotificationEvent::DeviceConnectionStatus {
                uuid: uuid.clone(),
                phase: "connected".to_string(),
            },
        ))
        .await;

    let dev = adapter.peripheral(&device_id).await.unwrap();
    pairing_prompt.abort();
    println!(
        "Successful subscription {}, {}",
        peripheral.address(),
        dev.address()
    );

    bt_device.update_connection(Some(dev)).await;

    let state = manager.get_devices().await;
    manager
        .send_to_listeners(ChannelMessage::Notification(
            NotificationEvent::DeviceConnected {
                uuid: uuid.clone(),
                devices: state,
            },
        ))
        .await;

    Ok(WsResponsePayload::Success(true))
}
