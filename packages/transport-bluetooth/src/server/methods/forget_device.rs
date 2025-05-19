use log::info;

use crate::server::{
    adapter_manager::AdapterManager,
    platform,
    types::{MethodResult, WsResponsePayload},
    ConnectionBroadcast,
    device::DeviceConnectionStatus,
};

#[cfg(target_os = "linux")]
pub async fn forget_device(
    manager: AdapterManager,
    _sender: ConnectionBroadcast,
    id: String,
) -> MethodResult {
    info!("forget_device not possible on linux {}", id);

    let device = manager.get_device_or_die(id).await?;
    device.set_is_paired(false);
    device.set_connection_status(DeviceConnectionStatus::PairingError {
        error: "Unpaired".to_string(),
    });

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
    //         Ok(WsResponsePayload::Success(true))
    //     }
    //     Err(err) => {
    //         println!("Forget error {:?}", err);
    //         Ok(WsResponsePayload::Success(false))
    //     }
    // }

    Ok(WsResponsePayload::Success(false))
}

#[cfg(target_os = "windows")]
pub async fn forget_device(
    manager: AdapterManager,
    _sender: ConnectionBroadcast,
    id: String,
) -> MethodResult {
    use btleplug::api::BDAddr;
    use windows::Devices::Bluetooth::BluetoothLEDevice;

    let device = manager.get_device_or_die(id.clone()).await?;
    device.set_is_paired(false);
    device.set_connection_status(DeviceConnectionStatus::PairingError {
        error: "Unpaired".to_string(),
    });

    info!("forget_device");
    let address = BDAddr::from_str_delim(&id).expect("TODO");
    let device = BluetoothLEDevice::FromBluetoothAddressAsync(address.into())
        .expect("TODO")
        .await
        .expect("TODO");
    if let Ok(device_info) = device.DeviceInformation() {
        if let Ok(pairing) = device_info.Pairing() {
            let result = pairing.UnpairAsync();
        }
    }

    Ok(WsResponsePayload::Success(true))
}

#[cfg(target_os = "macos")]
pub async fn forget_device(
    manager: AdapterManager,
    _sender: ConnectionBroadcast,
    id: String,
) -> MethodResult {
    info!("forget_device not possible on macos {}", id);

    let device = manager.get_device_or_die(id).await?;
    device.set_is_paired(false);
    device.set_connection_status(DeviceConnectionStatus::PairingError {
        error: "Unpaired".to_string(),
    });

    Ok(WsResponsePayload::Success(false))
}
