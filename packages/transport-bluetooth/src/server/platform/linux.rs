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
use std::{collections::HashMap, sync::mpsc};
use tokio::{
    sync::broadcast::error::RecvError,
    task::AbortHandle,
    time::{sleep, Duration},
};

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
        let device = ctx.manager.get_device_or_die(ctx.params.id.clone()).await?;
        let paired = is_paired(device.get_id()).await?;
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
    let device_path = dbus::Path::new(format!("/org/bluez/{id}")).map_err(|reason| {
        dbus::Error::new_custom("org.freedesktop.DBus.Error.InvalidArgs", &reason)
    })?;
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
    props
        .get("Paired")
        .and_then(|variant| variant.0.as_any().downcast_ref::<bool>().copied())
        .ok_or_else(|| PlatformError::from("Paired property is missing or not a boolean"))
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
        loop {
            let event = match receiver.recv().await {
                Ok(event) => event,
                Err(RecvError::Lagged(skipped)) => {
                    info!("watch_abort loop lagged, {skipped} events skipped");
                    continue;
                }
                Err(RecvError::Closed) => break,
            };

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
        info!("Start connection with timeout {timeout:?}");
        sleep(Duration::from_millis(timeout.into())).await;
        info!("Connection timeout. disconnecting device {id:?}");
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
    let mut guard = TaskGuard::default();
    guard.track(cancel_task.abort_handle());
    guard.track(timeout_task.abort_handle());

    // start connection
    let (conn, device_proxy) = get_device_proxy(device.get_id(), params.timeout)?;
    guard.track(conn.abort_handle());
    let result: Result<(), dbus::Error> =
        device_proxy.method_call(DBUS_DEVICE, "Connect", ()).await;

    // clear watchers
    drop(guard);

    // check the result
    if let Err(err) = result {
        dispatch_status(manager, device, DeviceConnectionStatus::Disconnected).await;

        info!("connect_with_timeout error: {err}");
        return Err(err)?;
    }

    Ok(())
}

/// Stops the agent (if any) and aborts tracked tasks on every exit path, including `?` and future drop.
#[derive(Default)]
struct TaskGuard {
    agent_stop: Option<mpsc::Sender<()>>,
    tasks: Vec<AbortHandle>,
}

impl TaskGuard {
    fn stop_agent(&self) {
        if let Some(agent_stop) = &self.agent_stop {
            let _ = agent_stop.send(());
        }
    }

    fn track(&mut self, abort_handle: AbortHandle) {
        self.tasks.push(abort_handle);
    }
}

impl Drop for TaskGuard {
    fn drop(&mut self) {
        self.stop_agent();
        for task in &self.tasks {
            task.abort();
        }
    }
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

    let mut guard = TaskGuard {
        agent_stop: Some(agent_stop),
        tasks: Vec::new(),
    };

    let (cancel_task, mut is_cancel_finished) = watch_abort(device.get_id(), broadcast.clone());
    guard.track(cancel_task.abort_handle());

    if !agent_enabled {
        guard.stop_agent();

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
    guard.track(props_task.abort_handle());

    // Pairing occasionally times out even if pairing process was successful
    // Err(D-Bus error: Timeout waiting for reply (org.freedesktop.DBus.Error.Timeout))
    // Err(D-Bus error: Did not receive a reply. Possible causes include: the remote application did not send a reply...
    // workaround: Listen for "Paired" property changes in props_task (see above)
    let (conn, device_proxy) = get_device_proxy(device.get_id(), DBUS_TIMEOUT)?;
    guard.track(conn.abort_handle());
    let mut pairing_task = tokio::spawn(async move {
        // NOTE: there is no way to abort device_proxy.method_call
        let result: Result<(), dbus::Error> =
            device_proxy.method_call(DBUS_DEVICE, "Pair", ()).await;
        result.err()
    });
    guard.track(pairing_task.abort_handle());

    let outcome: Result<(), PlatformError> = tokio::select! {
        response = &mut props_task => match response {
            Ok(None) => Ok(()),
            Ok(Some(err)) => Err(err),
            Err(err) => Err(err.into()),
        },
        response = &mut pairing_task => match response {
            // re-verify the pairing target before reporting success
            Ok(None) => match is_paired(device.get_id()).await {
                Ok(true) => Ok(()),
                Ok(false) => Err("Device is not paired after pairing finished".into()),
                Err(err) => Err(err),
            },
            // Pair may report a timeout although the bond was created
            Ok(Some(err)) => match is_paired(device.get_id()).await {
                Ok(true) => Ok(()),
                _ => Err(err.into()),
            },
            Err(err) => Err(err.into()),
        },
    };

    drop(guard);

    if let Err(err) = outcome {
        info!("pair_with_timeout error: {err:?}");
        dispatch_status(
            manager,
            device,
            DeviceConnectionStatus::PairingError {
                error: err.to_string(),
            },
        )
        .await;
        return Err(err);
    }

    dispatch_status(manager, device, DeviceConnectionStatus::Paired).await;

    Ok(())
}
