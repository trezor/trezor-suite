use btleplug::api::Peripheral as _;
use btleplug::platform::Peripheral;
use log::info;
use tokio::sync::broadcast::Sender;

use crate::server::adapter_manager::AdapterManager;
use crate::server::types::{AbortProcess, ChannelMessage, MethodResult, WsResponsePayload};
use crate::server::utils;

type CancelResult = Result<(), Box<dyn std::error::Error>>;
#[cfg(target_os = "linux")]
pub async fn cancel_pairing(peripheral: &Peripheral) -> CancelResult {
    use dbus::nonblock::Proxy;
    use tokio::time::Duration;

    if utils::is_paired(peripheral).await.unwrap_or(false) {
        return Ok(());
    }

    let (resource, conn) = dbus_tokio::connection::new_system_sync()?;
    let _connection_task = tokio::spawn(resource);

    // NOTE: this will remove bonds. device will not be connectable.
    let device_path = format!("/org/bluez/{}", peripheral.id());
    let device_proxy = Proxy::new(
        "org.bluez",
        device_path.clone(),
        Duration::from_secs(30),
        conn.clone(),
    );
    // we don't care about the result
    let _: Result<(), dbus::Error> = device_proxy
        .method_call("org.bluez.Device1", "CancelPairing", ())
        .await;

    Ok(())
}

#[cfg(target_os = "windows")]
pub async fn cancel_pairing(_peripheral: &Peripheral) -> CancelResult {
    Ok(())
}

#[cfg(target_os = "macos")]
pub async fn cancel_pairing(_peripheral: &Peripheral) -> CancelResult {
    Ok(())
}

pub async fn disconnect_device(
    id: String,
    manager: AdapterManager,
    sender: Sender<ChannelMessage>,
) -> MethodResult {
    info!("Disconnecting {:?}", id);
    let _ = sender.send(ChannelMessage::Abort(AbortProcess::Pairing)); // TODO: abort also breaks open_device

    let adapter = manager.get_adapter().await?;
    if !(utils::is_adapter_powered(adapter.clone()).await) {
        return Err("Adapted disabled")?;
    }

    let adapter = adapter.unwrap();
    let peripheral = utils::get_peripheral_by_id(&adapter, id.clone()).await?;
    let is_connected = peripheral.is_connected().await.unwrap_or(false);
    if is_connected {
        cancel_pairing(&peripheral).await?;
        peripheral.disconnect().await?;
    }

    Ok(WsResponsePayload::Success(true))
}
