use crate::server::{
    device::DeviceConnectionStatus,
    platform::{ConnectDeviceContext, PlatformDevice, PlatformError},
    utils::{discover_services, dispatch_status, verify_connection},
};
use btleplug::{
    api::{BDAddr, Peripheral as _},
    platform::Peripheral,
};
use log::info;
use windows::{
    core::Ref,
    Devices::Bluetooth::BluetoothLEDevice,
    Devices::Enumeration::{
        DeviceInformationCustomPairing, DevicePairingKinds, DevicePairingRequestedEventArgs,
        DevicePairingResultStatus,
    },
    Foundation::TypedEventHandler,
};

pub struct WindowsDevice;

impl PlatformDevice for WindowsDevice {
    async fn is_paired(peripheral: &Peripheral) -> Result<bool, PlatformError> {
        is_paired(peripheral.address().to_string()).await
    }

    // diffs: see ./platform_macos
    fn get_address(peripheral: Peripheral) -> String {
        peripheral.address().to_string()
    }

    async fn connect(ctx: ConnectDeviceContext) -> Result<(), PlatformError> {
        try_to_pair(&ctx).await?;
        discover_services(&ctx).await?;
        verify_connection(&ctx).await
    }
}

async fn is_paired(id: String) -> Result<bool, PlatformError> {
    let address = BDAddr::from_str_delim(&id)?;
    let device = BluetoothLEDevice::FromBluetoothAddressAsync(address.into())?.await?;

    Ok(device.DeviceInformation()?.Pairing()?.IsPaired()?)
}

pub async fn try_to_pair(ctx: &ConnectDeviceContext) -> Result<(), PlatformError> {
    let manager = &ctx.manager;
    let id = ctx.params.id.clone();
    let bt_device = manager.get_device_or_die(id.clone()).await?;
    let address = BDAddr::from_str_delim(&id)?;
    let device = BluetoothLEDevice::FromBluetoothAddressAsync(address.into())?.await?;
    let device_info = device.DeviceInformation()?;
    let pairing = device_info.Pairing()?;

    if !pairing.IsPaired()? {
        info!("try_to_pair attempt");

        if !pairing.CanPair()? {
            return Err("try_to_pair CanPair: false".into());
        }

        let custom_pairing: DeviceInformationCustomPairing = pairing.Custom()?;
        let bt_manager = manager.clone();
        let (tx, _) = tokio::sync::broadcast::channel::<String>(32);
        let pin_sender = tx.clone();
        let mut listener = tx.subscribe();
        let pin_listener = tokio::spawn(async move {
            while let Ok(pin) = listener.recv().await {
                dispatch_status(
                    bt_manager.clone(),
                    bt_device.clone(),
                    DeviceConnectionStatus::Pairing { pin: Some(pin) },
                )
                .await;
            }
        });

        {
            let pairing_requested_handler = TypedEventHandler::new(
                move |_sender, args: Ref<DevicePairingRequestedEventArgs>| {
                    if let Ok(args) = args.ok() {
                        let kind = args.PairingKind()?;
                        if kind == DevicePairingKinds::ConfirmPinMatch {
                            let pin = args.Pin()?;
                            info!("try_to_pair confirm PIN");
                            args.Accept()?; // automatically confirm pin
                            if let Err(err) = pin_sender.send(pin.to_string()) {
                                info!("try_to_pair error sending PIN {:?}", err);
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
        let bt_device = manager.get_device_or_die(id).await?;
        if pairing_status == DevicePairingResultStatus::Paired {
            info!("try_to_pair successful");
            // similar to linux, disconnect after successful paring and proceed to discover_services()
            let result = device.Close();
            if let Err(err) = result {
                info!("try_to_pair close error {:?}", err);
            }

            dispatch_status(manager.clone(), bt_device, DeviceConnectionStatus::Paired).await;
        } else {
            let error = format!("try_to_pair pairing failed status: {:?}", pairing_status);
            dispatch_status(
                manager.clone(),
                bt_device,
                DeviceConnectionStatus::PairingError {
                    error: error.to_string(),
                },
            )
            .await;

            return Err(error.into());
        }
    }

    Ok(())
}
