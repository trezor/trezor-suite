use dbus::arg::{RefArg, Variant};
use dbus::nonblock::{Proxy, SyncConnection};
use log::info;
use std::collections::HashMap;
use tokio::time::{sleep, Duration};

use crate::server::adapter_manager::AdapterManager;
use crate::server::device::{DeviceConnectionStatus, TrezorDevice};
use crate::server::platform;
use crate::server::types::{AbortProcess, ChannelMessage, NotificationEvent};
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

async fn disconnect_device(device_path: String, timeout: u32) {
    let device_proxy = platform::get_device_proxy(device_path, timeout);
    let _result: Result<(), dbus::Error> = device_proxy
        .method_call("org.bluez.Device1", "Disconnect", ())
        .await;
    println!("Silent disconnect {:?}", _result);
}

async fn connect_with_timeout(
    device: TrezorDevice,
    timeout: u32,
    manager: AdapterManager,
    broadcast: ConnectionBroadcast,
) -> Result<(), Box<dyn std::error::Error>> {
    info!("Device already paired {:?}", timeout);

    let device_path = device.get_id();

    dispatch_status(
        manager.clone(),
        device.clone(),
        DeviceConnectionStatus::Connecting,
    )
    .await;

    let current_id = device.get_id();
    let mut receiver = broadcast.subscribe();
    let cancel_task = tokio::spawn(async move {
        while let Ok(event) = receiver.recv().await {
            if let ChannelMessage::Abort(event) = event {
                #[allow(clippy::single_match)] // see TODO below
                match event {
                    AbortProcess::DeviceDisconnected(id) => {
                        if current_id == id {
                            disconnect_device(id, 10000).await;
                            break;
                        }
                    }
                    // TODO: if ws client connection is related to this device
                    #[allow(clippy::single_match)]
                    _ => {} // ignore
                }
            }
        }
    });

    let device_path_clone = device_path.clone();
    let timeout_task = tokio::spawn(async move {
        println!("Start connection timeout {:?}", timeout);
        let tm = Duration::from_millis(timeout.into());
        tokio::time::sleep(tm).await;
        println!("Connection timeout. disconnectting...");
        disconnect_device(device_path_clone, timeout).await;
    });

    let device_proxy = platform::get_device_proxy(device_path.clone(), 30000);
    let result: Result<(), dbus::Error> = device_proxy
        .method_call("org.bluez.Device1", "Connect", ())
        .await;

    timeout_task.abort();
    cancel_task.abort();

    if let Err(err) = result {
        println!("Dbus err {}", err);
        return Err(err)?;
    }

    info!("Device _result {:?}", result);
    Ok(())
}

pub async fn pair_device(
    device: TrezorDevice,
    timeout: u32,
    manager: AdapterManager,
    broadcast: ConnectionBroadcast,
) -> Result<(), Box<dyn std::error::Error>> {
    dispatch_status(
        manager.clone(),
        device.clone(),
        DeviceConnectionStatus::Pairing { pin: None },
    )
    .await;

    let (resource, conn) = dbus_tokio::connection::new_system_sync().expect("Fail");
    let connection_task = tokio::spawn(resource);

    let device_proxy = platform::get_device_proxy(device.get_id(), 30000);

    // if system bluetooth UI window is closed/unavailable
    // Pairing Request capability is set to `NoInputNoOutput`, Trezor expects `DisplayYesNo`
    // this leads to org.bluez.Error.AuthenticationFailed error
    // try to open system UI
    // TODO MOVE THIS TO SUITE?
    manager
        .dispatch_notification(NotificationEvent::DeviceSettingsUi)
        .await;

    fn open_bluetooth_ui() -> Option<std::process::Child> {
        let desktop_env = std::env::var("XDG_CURRENT_DESKTOP").unwrap_or_default();
        if desktop_env.contains("GNOME") {
            return std::process::Command::new("gnome-control-center")
                .arg("bluetooth")
                .spawn()
                .ok();
        } else if desktop_env.contains("KDE") {
            return std::process::Command::new("systemsettings5")
                .arg("bluetooth")
                .spawn()
                .ok();
        } else {
            println!("TODO: Unsupported desktop environment: {:?}", desktop_env);
        }

        None
    }

    let ui_process = open_bluetooth_ui();
    // TODO: some loader, only if ui_process is some?
    sleep(Duration::from_millis(1000)).await;

    // watch props and disconnect device once paired
    let device_id_ref = device.get_id();
    let mut props_task = Some(tokio::spawn(async move {
        loop {
            sleep(Duration::from_secs(1)).await;
            let mut should_disconnect = false;
            let result = platform::get_device_properties(device_id_ref.clone(), 1000).await;

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
                let device_proxy = platform::get_device_proxy(device_id_ref.clone(), 5000);
                let _result: Result<(), dbus::Error> = device_proxy
                    .method_call("org.bluez.Device1", "Disconnect", ())
                    .await;

                // try to close opened UI process
                if let Some(mut proc) = ui_process {
                    if let Err(e) = proc.kill() {
                        println!("Failed to kill process: {}", e);
                    }
                }

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
            Ok(_) => None,
            Err(error) => Some(error),
        }
    });

    let current_id = device.get_id();
    let mut receiver = broadcast.subscribe();
    let cancel_task = tokio::spawn(async move {
        while let Ok(event) = receiver.recv().await {
            if let ChannelMessage::Abort(event) = event {
                #[allow(clippy::single_match)] // see TODO below
                match event {
                    AbortProcess::DeviceDisconnected(id) => {
                        if current_id == id {
                            let device_proxy = platform::get_device_proxy(id, timeout);
                            let _result: Result<(), dbus::Error> = device_proxy
                                .method_call("org.bluez.Device1", "CancelPairing", ())
                                .await;
                            break;
                        }
                    }
                    // TODO: if ws connection is related to this device
                    _ => {} // ignore
                };
            }
        }
    });

    tokio::select! {
        response = props_task.as_mut().unwrap() => {
            connection_task.abort();
            cancel_task.abort();
            println!("props_task ended with {response:?}");
            if let Some(err) = response.unwrap() {
                dispatch_status(manager.clone(), device.clone(), DeviceConnectionStatus::PairingError{ error: err.to_string() }).await;
                return Err(err)?;
                // return Err(err.to_string());
            }
        },
        response = pairing_task => {
            connection_task.abort();
            cancel_task.abort();
            props_task.take().unwrap().abort();
            println!("pairing_task ended with {response:?}");
            if let Some(err) = response.unwrap() {
                dispatch_status(manager.clone(), device.clone(), DeviceConnectionStatus::PairingError{ error: err.to_string() }).await;
                return Err(err)?;
            }
        },
    };

    device.set_is_paired(true);

    dispatch_status(
        manager.clone(),
        device.clone(),
        DeviceConnectionStatus::Paired,
    )
    .await;

    Ok(())
}

pub async fn connect_device_linux(
    manager: AdapterManager,
    broadcast: ConnectionBroadcast,
    device: TrezorDevice,
    timeout: u32,
) -> Result<(), Box<dyn std::error::Error>> {
    if device.is_paired() {
        connect_with_timeout(device, timeout, manager, broadcast).await
    } else {
        pair_device(device, timeout, manager, broadcast).await
    }
}
