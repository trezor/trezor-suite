use btleplug::api::BDAddr;
use windows::{
    Devices::Bluetooth::BluetoothLEDevice,
    Devices::Enumeration::{
        DeviceInformationCustomPairing, DevicePairingKinds, DevicePairingRequestedEventArgs,
        DevicePairingResultStatus,
    },
    Foundation::TypedEventHandler,
};

use crate::server::adapter_manager::AdapterManager;
use crate::server::device::{DeviceConnectionStatus, TrezorDevice};
use crate::server::types::{ChannelMessage, MethodError, NotificationEvent};
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

pub async fn connect_device_windows(
    manager: AdapterManager,
    _b: ConnectionBroadcast,
    bt_device: TrezorDevice,
    _timeout: u32,
) -> Result<(), Box<dyn std::error::Error>> {
    let id = bt_device.get_id();
    let address = BDAddr::from_str_delim(&id)?;
    let device = BluetoothLEDevice::FromBluetoothAddressAsync(address.into())?.await?;
    let device_info = device.DeviceInformation()?;
    let pairing = device_info.Pairing()?;

    if !pairing.IsPaired()? {
        println!("Device not paired. Attempting to pair...");

        if !pairing.CanPair()? {
            Err(MethodError::Unexpected("Can pair: false".to_string()))?
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

            let bt_device = manager.get_device_or_die(id.clone()).await?;
            bt_device.set_is_paired(true);

            dispatch_status(
                manager.clone(),
                bt_device.clone(),
                DeviceConnectionStatus::Paired,
            )
            .await;
        } else {
            let error = format!("Pairing failed with status: {:?}", pairing_status);
            return Err(error)?;
        }
    }

    Ok(())
}
