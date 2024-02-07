use log::info;
use tokio::sync::broadcast::Sender;

use crate::server::adapter_manager::AdapterManager;
use crate::server::types::{ChannelMessage, MethodResult, WsResponsePayload};

#[cfg(target_os = "linux")]
pub async fn forget_device(
    uuid: String,
    _manager: AdapterManager,
    _sender: Sender<ChannelMessage>,
) -> MethodResult {
    use tokio::time::Duration;

    info!("forget_device tryout on linux");

    let connection = dbus::blocking::Connection::new_system()?;
    let adapter_path = "/org/bluez/hci0";
    let device_path = format!("/org/bluez/{}", uuid.clone());
    let adapter_proxy = connection.with_proxy("org.bluez", adapter_path, Duration::from_secs(5));
    adapter_proxy.method_call("org.bluez.Adapter1", "RemoveDevice", (device_path,))?;

    Ok(WsResponsePayload::Success(true))
}

#[cfg(target_os = "windows")]
pub async fn forget_device(
    uuid: String,
    _manager: AdapterManager,
    _sender: Sender<ChannelMessage>,
) -> MethodResult {
    use btleplug::api::BDAddr;
    use windows::Devices::Bluetooth::BluetoothLEDevice;

    info!("forget_device windows");
    let address = BDAddr::from_str_delim(&uuid).unwrap();
    let device = BluetoothLEDevice::FromBluetoothAddressAsync(address.into())?.await?;
    let device_info = device.DeviceInformation()?;
    let pairing = device_info.Pairing()?;
    let result = pairing.UnpairAsync()?;

    Ok(WsResponsePayload::Success(true))
}

#[cfg(target_os = "macos")]
pub async fn forget_device(
    uuid: String,
    _manager: AdapterManager,
    _sender: Sender<ChannelMessage>,
) -> MethodResult {
    info!("forget_device not implemented on macos {}", uuid);
    Ok(WsResponsePayload::Success(false))
}
