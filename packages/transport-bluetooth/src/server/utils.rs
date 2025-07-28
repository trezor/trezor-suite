use crate::server::{
    adapter_manager::AdapterManager,
    device::{DeviceConnectionStatus, TrezorDevice, SERVICE_UUID},
    platform::{ConnectDeviceContext, PlatformError},
    types::NotificationEvent,
};
use btleplug::{
    api::{Central, Peripheral as _},
    platform::{Adapter, Peripheral, PeripheralId},
};
use log::info;
use std::time::{SystemTime, UNIX_EPOCH};

pub const APP_VERSION: &str = env!("CARGO_PKG_VERSION");
pub const BUILD_VERSION_TAG: &str = match option_env!("BUILD_VERSION_TAG") {
    Some(hash) => hash,
    None => "unknown",
};

pub async fn scan_filter(adapter: &Adapter, id: &PeripheralId) -> Option<Peripheral> {
    let peripheral = match adapter.peripheral(id).await {
        Ok(p) => p,
        Err(_) => {
            return None;
        }
    };

    if let Ok(Some(props)) = peripheral.properties().await {
        let service = props.services.iter().find(|c| *c == &SERVICE_UUID);
        if service.is_some() {
            return Some(peripheral);
        }
    };

    None
}

pub fn get_timestamp() -> u128 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .expect("Time went backwards")
        .as_millis()
}

/// Common utility, dispatch DeviceConnectionStatus change
pub async fn dispatch_status(
    manager: AdapterManager,
    device: TrezorDevice,
    phase: DeviceConnectionStatus,
) {
    device.set_connection_status(phase);
    manager
        .dispatch_notification(NotificationEvent::DeviceConnectionStatus(device))
        .await
}

/// Common btleplug flow after successful pairing
/// process is separated into parts:
/// discover_services + (macos: try_to_subscribe) + verify_connection
pub async fn discover_services(ctx: &ConnectDeviceContext) -> Result<(), PlatformError> {
    let manager = &ctx.manager;
    let id = ctx.params.id.clone();

    let device = manager.get_device_or_die(id).await?;
    let peripheral = manager.get_peripheral_or_die(&device.get_id()).await?;
    let is_connected = peripheral.is_connected().await.unwrap_or(false);

    dispatch_status(
        manager.clone(),
        device.clone(),
        DeviceConnectionStatus::Connecting,
    )
    .await;

    if !is_connected {
        if let Err(err) = peripheral.connect().await {
            dispatch_status(
                manager.clone(),
                device.clone(),
                DeviceConnectionStatus::Disconnected,
            )
            .await;

            info!("peripheral.connect error {err:?}");

            // linux: le-connection-abort-by-local https://github.com/hbldh/bleak/issues/993
            // device was never paired (e) and is not in pairing mode
            return Err(err.into());
        }
    }

    if let Err(err) = peripheral.discover_services().await {
        info!("discover_services error {err:?}");
        return Err(err.into());
    }

    // macos: try_to_subscribe
    // linux + windows: continue to verify_connection
    Ok(())
}

pub async fn verify_connection(ctx: &ConnectDeviceContext) -> Result<(), PlatformError> {
    let manager = &ctx.manager;
    let id = ctx.params.id.clone();

    let mut device = manager.get_device_or_die(id.clone()).await?;
    let peripheral = manager.get_peripheral_or_die(&id).await?;
    let is_connected = peripheral.is_connected().await.unwrap_or(false);
    if !is_connected {
        dispatch_status(
            manager.clone(),
            device.clone(),
            DeviceConnectionStatus::Disconnected,
        )
        .await;

        return Err("verify_connection device disconnected".into());
    }

    device.set_is_paired(true);
    device.update_properties(peripheral).await?;

    dispatch_status(
        manager.clone(),
        device.clone(),
        DeviceConnectionStatus::Connected,
    )
    .await;

    let devices = manager.get_devices().await;
    manager
        .dispatch_notification(NotificationEvent::DeviceConnected {
            id: device.get_id(),
            devices,
        })
        .await;

    Ok(())
}
