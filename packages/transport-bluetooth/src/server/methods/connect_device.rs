use log::info;
use tokio::sync::broadcast::Sender;

use btleplug::api::{Central, CharPropFlags, Peripheral as _};
use btleplug::platform::Adapter;

use crate::server::types::{
    ChannelMessage, MethodResult, NotificationEvent, WsResponseFailure, WsResponsePayload,
};

use crate::server::utils;

const PAIRING_TIMEOUT: tokio::time::Duration = tokio::time::Duration::from_secs(30);

pub async fn connect_device(
    uuid: String,
    adapter: Option<Adapter>,
    sender: Sender<ChannelMessage>,
) -> MethodResult {
    if !(utils::is_adapter_powered(adapter.clone()).await) {
        return Ok(WsResponsePayload::Error(WsResponseFailure::AdapterDisabled));
    }

    let adapter = adapter.unwrap();
    let device = utils::get_peripheral_by_address(&adapter, uuid).await?;
    let device_id = device.id();
    let properties = device.properties().await?;
    let is_connected = device.is_connected().await.unwrap_or(false);
    let bt_device = utils::get_bluetooth_device(&device).await?;

    println!(
        "Connecting before {:?}, {:?}, {:?}, {:?}",
        is_connected,
        device.characteristics(),
        device.services(),
        properties
    );

    // linux:
    // - if device is paired it will be visible in Adapter.periperials() even before scanning
    // - if device is paired device should already have discovered services (more than 1) right after connection
    // macos:
    // - paired device will...
    // windows:
    // - paired device

    if !is_connected {
        println!("Connecting...");

        utils::send_notification(
            &sender,
            NotificationEvent::DeviceConnecting {
                phase: "start".to_string(),
                device: bt_device.clone(),
            },
        );

        // Connect if we aren't already connected.
        if let Err(err) = device.connect().await {
        // if let Err(err) = device
        //     .connect_with_timeout(std::time::Duration::from_secs(5))
        //     .await
        // {
            // TODO: linux, le-connection-abort-by-local https://github.com/hbldh/bleak/issues/993
            // TODO: windows ... (i dont remember the error itself, medium not ready?)
            eprintln!("Error connecting to peripheral: {}", err);
            return Err(Box::new(err));
        }
    }

    let properties = device.properties().await?;
    println!(
        "Connecting after - before discovering service {:?}, {:?}, {:?}, {:?}",
        is_connected,
        device.characteristics(),
        device.services(),
        properties
    );

    if let Err(err) = device.discover_services().await {
        println!("Err discovering services first time {:?}", err);
        return Err(Box::new(err));
    }

    let properties = device.properties().await?;
    println!(
        "Connecting discovered services {:?}, {:?}, {:?}",
        device.characteristics(),
        device.services(),
        properties
    );

    let mut is_paring = false;
    let notif_sender = sender.clone();
    let notif_device = bt_device.clone();
    let pairing_prompt = tokio::spawn(async move {
        tokio::time::sleep(tokio::time::Duration::from_millis(1000)).await;
        is_paring = true;
        // send_notification(&notif_sender, NotificationEvent::Str("a".to_string()));
        utils::send_notification(
            &notif_sender,
            NotificationEvent::DeviceConnecting {
                phase: "pairing".to_string(),
                device: notif_device,
            },
        );
    });

    let subscription_device = device.clone();
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

            let char = subscription_device
                .characteristics()
                .into_iter()
                .find(|c| c.properties.contains(CharPropFlags::NOTIFY));
            if char.is_some() {
                let char = char.unwrap();
                if let Err(err) = subscription_device.subscribe(&char).await {
                    if err.to_string().contains("authentication") {
                        // if err.to_string().contains("ATT error") {
                        println!("--cool off");
                        // windows: Error { code: HRESULT(0x80650005), message: "The attribute requires authentication before it can be read or written." }"
                        // https://learn.microsoft.com/en-us/windows/win32/com/com-error-codes-9
                        // E_BLUETOOTH_ATT_INSUFFICIENT_AUTHENTICATION 0x80650005
                        // tokio::time::sleep(tokio::time::Duration::from_secs(2)).await;
                    }
                    // linux timeout: DbusError(D-Bus error: Operation failed with ATT error: 0x0e (org.bluez.Error.Failed))
                    println!("Err subscribing {:?}", err);
                } else {
                    println!("Unsubscribing....");
                    // try to unsubscribe
                    if let Err(err) = subscription_device.unsubscribe(&char).await {
                        println!("Err unsubscribing {:?}", err);
                    }
                    println!("Subscribed, breaking the loop");
                    return true;
                }
            } else {
                println!("Notify characteristics not found");
            }

            tokio::time::sleep(tokio::time::Duration::from_secs(1)).await;

            tries += 1;
        }
    });

    let result = subscription_task.await.unwrap_or(false);
    let is_connected = device.is_connected().await.unwrap_or(false);

    utils::send_notification(
        &sender,
        NotificationEvent::DeviceConnecting {
            phase: "connected".to_string(),
            device: bt_device.clone(),
        },
    );

    if result {
        let dev = adapter.peripheral(&device_id).await.unwrap();
        pairing_prompt.abort();
        println!(
            "Successful subscription {}, {}",
            device.address(),
            dev.address()
        );

        let state = utils::enumerate(&adapter).await;
        utils::send_notification(
            &sender,
            NotificationEvent::DeviceConnected {
                uuid: device_id.to_string(),
                devices: state,
            },
        );

        Ok(WsResponsePayload::Success(true))
    } else {
        if is_connected {
            if let Err(_) = device.disconnect().await {
                // todo
            }
        }
        println!("Unsuccessful subscription!");
        Err(Box::new(std::fmt::Error {}))
    }
}
