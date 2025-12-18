use crate::server::{
    bluez::agent::create_agent,
    device::DeviceConnectionStatus,
    platform::{ConnectDeviceContext, PlatformDevice, PlatformError},
    types::{AbortProcess, ChannelMessage, NotificationEvent},
    utils::{discover_services, dispatch_status, verify_connection},
    ConnectionBroadcast,
};
use btleplug::{api::Peripheral as _, platform::Peripheral};
use dbus::{
    arg::{RefArg, Variant},
    nonblock::{Proxy, SyncConnection},
};
use log::info;
use std::collections::HashMap;
use tokio::time::{sleep, Duration};

const BLUEZ_SERVICE: &str = "org.bluez";
const DBUS_PROPERTIES_INTERFACE: &str = "org.freedesktop.DBus.Properties";
const DBUS_DEVICE: &str = "org.bluez.Device1";
const DBUS_TIMEOUT: u32 = 30000;

pub struct LinuxDevice;

impl PlatformDevice for LinuxDevice {
    async fn is_paired(peripheral: &Peripheral) -> Result<bool, PlatformError> {
        is_paired(peripheral.id().to_string()).await
    }

    // diffs: see ./platform_macos
    fn get_address(peripheral: Peripheral) -> String {
        peripheral.address().to_string()
    }

    async fn connect(ctx: ConnectDeviceContext) -> Result<(), PlatformError> {
        let id = ctx.params.id.clone();
        let paired = is_paired(id).await?;
        if paired {
            connect_with_timeout(ctx.clone()).await?;
        } else {
            pair_with_timeout(ctx.clone()).await?;
        }

        discover_services(&ctx).await?;
        verify_connection(&ctx).await
    }

    async fn forget(_id: String) -> Result<(), PlatformError> {
        // use dbus::arg::{RefArg, Variant};
        // use tokio::time::Duration;
        // let device = manager.get_device_or_die(id).await?;
        // let adapter_proxy = platform::get_device_proxy(device.get_id().clone(), 5 * 1000);

        // this will throw: Forget error D-Bus error: Does Not Exist (org.bluez.Error.DoesNotExist)
        // the device will be unpaired but only partially and it causes problems after future reconnection
        // next pairing will most likely throw "le-connection-abort-by-local"

        // let res: Result<(), dbus::Error> = adapter_proxy.method_call("org.bluez.Device1", "CancelPairing", ()).await;
        // match res {
        //     Ok(()) => {
        //         Ok(WsResponsePayload::Success{ success: true })
        //     }
        //     Err(err) => {
        //         println!("Forget error {:?}", err);
        //         Ok(WsResponsePayload::Success{ success: false })
        //     }
        // }

        Err("forget_device is not implemented".into())
    }
}

/// get bluez device (proxy) reference
fn get_device_proxy(
    id: String,
    timeout: u32,
) -> Result<
    (
        tokio::task::JoinHandle<dbus_tokio::connection::IOResourceError>,
        Proxy<'static, std::sync::Arc<SyncConnection>>,
    ),
    dbus::Error,
> {
    let device_path = format!("/org/bluez/{}", id);
    let (resource, conn) = dbus_tokio::connection::new_system_sync()?;
    let connection_task = tokio::spawn(resource);
    let timeout = Duration::from_millis(timeout.into());

    Ok((
        connection_task,
        Proxy::new(BLUEZ_SERVICE, device_path, timeout, conn),
    ))
}

/// get device properties
async fn get_device_properties(
    id: String,
    timeout: u32,
) -> Result<(HashMap<String, Variant<Box<dyn RefArg>>>,), dbus::Error> {
    let (conn, proxy) = get_device_proxy(id, timeout)?;

    let props = proxy
        .method_call(DBUS_PROPERTIES_INTERFACE, "GetAll", (DBUS_DEVICE,))
        .await;

    conn.abort();

    props
}

async fn is_paired(id: String) -> Result<bool, PlatformError> {
    let (props,) = get_device_properties(id, DBUS_TIMEOUT).await?;
    if let Some(variant) = props.get("Paired") {
        if let Some(is_paired) = variant.0.as_any().downcast_ref::<bool>().cloned() {
            return Ok(is_paired);
        }
    }

    Ok(false)
}

/// try to disconnect the device silently
async fn disconnect_device(id: String) {
    match get_device_proxy(id, DBUS_TIMEOUT) {
        Ok((conn, device_proxy)) => {
            let result: Result<(), dbus::Error> = device_proxy
                .method_call(DBUS_DEVICE, "Disconnect", ())
                .await;
            conn.abort();
            info!("Silent disconnect {result:?}");
        }
        Err(e) => info!("Silent disconnect {e}"),
    }
}

/// watch abort by DeviceDisconnected event
fn watch_abort(
    current_id: String,
    broadcast: ConnectionBroadcast,
) -> (
    tokio::task::JoinHandle<()>,
    tokio::sync::oneshot::Receiver<()>,
) {
    let mut receiver = broadcast.subscribe();
    let (tx, rx) = tokio::sync::oneshot::channel();

    let handler = tokio::spawn(async move {
        while let Ok(event) = receiver.recv().await {
            // TODO: if websocket client connection is related to this device
            // AbortProcess::ClientDisconnected
            if let ChannelMessage::Abort(AbortProcess::DeviceDisconnected(id)) = event {
                if current_id == id {
                    disconnect_device(id).await;
                    break;
                }
            }
        }

        // task was finished
        let _ = tx.send(());
    });

    (handler, rx)
}

/// watch timeout event
fn watch_timeout(id: String, timeout: u32) -> tokio::task::JoinHandle<()> {
    tokio::spawn(async move {
        info!("Start connection with timeout {:?}", timeout);
        sleep(Duration::from_millis(timeout.into())).await;
        info!("Connection timeout. disconnecting device");
        disconnect_device(id).await;
    })
}

async fn connect_with_timeout(ctx: ConnectDeviceContext) -> Result<(), PlatformError> {
    let ConnectDeviceContext {
        manager,
        params,
        broadcast,
    } = ctx;
    let device = manager.get_device_or_die(params.id).await?;

    info!("connect_with_timeout start");

    dispatch_status(
        manager.clone(),
        device.clone(),
        DeviceConnectionStatus::Connecting,
    )
    .await;

    // watch cancellation
    let (cancel_task, _) = watch_abort(device.get_id(), broadcast);
    let timeout_task = watch_timeout(device.get_id(), params.timeout);

    // start connection
    let (conn, device_proxy) = get_device_proxy(device.get_id(), params.timeout)?;
    let result: Result<(), dbus::Error> =
        device_proxy.method_call(DBUS_DEVICE, "Connect", ()).await;

    // clear watchers
    conn.abort();
    timeout_task.abort();
    cancel_task.abort();

    // check the result
    if let Err(err) = result {
        dispatch_status(manager, device, DeviceConnectionStatus::Disconnected).await;

        info!("connect_with_timeout error: {err}");
        return Err(err)?;
    }

    Ok(())
}

async fn pair_with_timeout(ctx: ConnectDeviceContext) -> Result<(), PlatformError> {
    let ConnectDeviceContext {
        manager,
        params,
        broadcast,
    } = ctx.clone();
    let device = manager.get_device_or_die(params.id).await?;

    info!("pair_with_timeout start");

    // Registering custom Agent doesn't have to work by default.
    // it may require some tweaking of the user groups and permissions
    let (agent_ready, agent_stop) = create_agent(ctx.clone());
    let agent_enabled = match tokio::time::timeout(Duration::from_secs(3), agent_ready).await {
        Ok(Ok(_)) => true,
        _ => false, // Ok(Err(_)) or Err(_)
    };

    let (cancel_task, mut is_cancel_finished) = watch_abort(device.get_id(), broadcast.clone());

    if !agent_enabled {
        let _ = agent_stop.send(());

        info!("Agent not registered");
        // if system_settings/bluetooth UI window is closed/unavailable
        // Pairing Request capability will be set to `NoInputNoOutput`. Trezor expects `DisplayYesNo`
        // this leads to org.bluez.Error.AuthenticationFailed error
        // request client to open system UI.

        dispatch_status(
            manager.clone(),
            device.clone(),
            DeviceConnectionStatus::Pairing { pin: None },
        )
        .await;

        manager
            .dispatch_notification(NotificationEvent::OpenBluetoothSettings {
                id: device.get_id(),
            })
            .await;

        sleep(Duration::from_millis(1000)).await;

        if is_cancel_finished.try_recv().is_ok() {
            // task was aborted
            // DeviceDisconnected was called by the host as response to OpenBluetoothSettings event
            dispatch_status(manager, device, DeviceConnectionStatus::Disconnected).await;

            return Err("BluetoothSettingsMissing".to_string())?;
        }
    }

    // watch "Paired" props
    let device_id = device.get_id();
    let mut props_task = tokio::spawn(async move {
        loop {
            sleep(Duration::from_millis(1000)).await;

            match is_paired(device_id.clone()).await {
                Ok(is_paired) => {
                    if is_paired {
                        info!("pair_with_timeout successful. disconnecting");
                        disconnect_device(device_id).await;
                        // wait for propagation down to btleplug (DeviceDisconnected)
                        sleep(Duration::from_millis(100)).await;
                        return None;
                    }
                }
                Err(error) => {
                    return Some(error);
                }
            }
        }
    });

    // Pairing occasionally times out even if pairing process was successful
    // Err(D-Bus error: Timeout waiting for reply (org.freedesktop.DBus.Error.Timeout))
    // Err(D-Bus error: Did not receive a reply. Possible causes include: the remote application did not send a reply...
    // workaround: Listen for "Paired" property changes in props_task (see above)
    let (conn, device_proxy) = get_device_proxy(device.get_id(), DBUS_TIMEOUT)?;
    let mut pairing_task = tokio::spawn(async move {
        // NOTE: there is no way to abort device_proxy.method_call
        let result: Result<(), dbus::Error> =
            device_proxy.method_call(DBUS_DEVICE, "Pair", ()).await;
        match result {
            Ok(_) => None,
            Err(error) => Some(error),
        }
    });

    tokio::select! {
        response = &mut props_task => {
            cancel_task.abort();
            pairing_task.abort();
            conn.abort();
            if let Ok(Some(err)) = response {
                info!("pair_with_timeout props_task error: {err:?}");
                let _ = agent_stop.send(());
                dispatch_status(manager, device, DeviceConnectionStatus::PairingError{ error: err.to_string() }).await;
                return Err(err)?;
            }
        },
        response = &mut pairing_task => {
            cancel_task.abort();
            props_task.abort();
            conn.abort();
            if let Ok(Some(err)) = response {
                info!("pair_with_timeout pairing_task error: {err:?}");
                let _ = agent_stop.send(());
                dispatch_status(manager, device, DeviceConnectionStatus::PairingError{ error: err.to_string() }).await;
                return Err(err)?;
            }
        },
    };

    let _ = agent_stop.send(());
    dispatch_status(manager, device, DeviceConnectionStatus::Paired).await;

    Ok(())
}
