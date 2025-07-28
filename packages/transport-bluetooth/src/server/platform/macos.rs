use crate::server::{
    device::{DeviceConnectionStatus, CHARACTERISTIC_TX},
    platform::{ConnectDeviceContext, PlatformDevice, PlatformError},
    utils::{discover_services, dispatch_status, verify_connection},
};
use btleplug::api::{CharPropFlags, Peripheral as _};
use btleplug::platform::Peripheral;
use log::info;
use tokio::time::{sleep, Duration};

const DEFAULT_PAIRING_TIMEOUT: Duration = Duration::from_secs(30);

pub struct MacosDevice;

#[derive(Clone, Debug)]
enum SubscriptionResult {
    Success,
    Error(String),
}

impl PlatformDevice for MacosDevice {
    async fn is_paired(_peripheral: &Peripheral) -> Result<bool, PlatformError> {
        Ok(false)
    }

    // address is unknown, btleplug returns 00:00:00:00. use id
    fn get_address(peripheral: Peripheral) -> String {
        peripheral.id().to_string()
    }

    async fn connect(ctx: ConnectDeviceContext) -> Result<(), PlatformError> {
        discover_services(&ctx).await?;
        try_to_subscribe(&ctx).await?;
        verify_connection(&ctx).await
    }

    async fn forget(_id: String) -> Result<(), PlatformError> {
        Err("forget_device is not implemented".into())
    }
}

pub async fn try_to_subscribe(ctx: &ConnectDeviceContext) -> Result<(), PlatformError> {
    let manager = &ctx.manager;
    let id = ctx.params.id.clone();

    let device = manager.get_device_or_die(id.clone()).await?;
    let peripheral = manager.get_peripheral_or_die(&id).await?;

    let notif_manager = manager.clone();
    let notif_device = device.clone();
    let pairing_prompt = tokio::spawn(async move {
        sleep(Duration::from_millis(1000)).await;

        dispatch_status(
            notif_manager,
            notif_device,
            DeviceConnectionStatus::Pairing { pin: None },
        )
        .await;
    });

    let subscription_device = peripheral.clone();
    let start = tokio::time::Instant::now();
    let timeout = Duration::from_millis(ctx.params.timeout as u64);
    let timeout = if timeout.is_zero() {
        DEFAULT_PAIRING_TIMEOUT
    } else {
        timeout
    };

    let subscription_task = tokio::spawn(async move {
        let mut tries = 0;
        loop {
            let is_connected = subscription_device.is_connected().await.unwrap_or(false);
            if !is_connected {
                info!("subscription_task device disconnected");
                return SubscriptionResult::Error("Device disconnected".to_string());
            }

            info!(
                "subscription_task try {} time elapsed {:?}",
                tries,
                start.elapsed()
            );

            if start.elapsed() > timeout {
                info!("subscription_task timeout");
                return SubscriptionResult::Error("Subscription timeout".to_string());
            }

            let characteristic = subscription_device.characteristics().into_iter().find(|c| {
                c.uuid == CHARACTERISTIC_TX && c.properties.contains(CharPropFlags::NOTIFY)
            });

            if characteristic.is_some() {
                let characteristic = characteristic.unwrap();
                if let Err(err) = subscription_device.subscribe(&characteristic).await {
                    if err.to_string().contains("authentication") {
                        //
                        if let Err(err) = subscription_device.unsubscribe(&characteristic).await {
                            info!(
                                "subscription_task authentication unsubscribe error {:?}",
                                err
                            );
                        }
                    } else {
                        info!("subscription_task subscribe error {err:?}");
                        return SubscriptionResult::Error(err.to_string());
                    }
                } else {
                    info!("subscription_task successful, unsubscribing");
                    // try to unsubscribe
                    if let Err(err) = subscription_device.unsubscribe(&characteristic).await {
                        info!("subscription_task unsubscribe error {:?}", err);
                    }
                    return SubscriptionResult::Success;
                }
            } else {
                info!("subscription_task characteristics not found");
            }

            sleep(Duration::from_secs(1)).await;

            tries += 1;
        }
    });

    let result = subscription_task
        .await
        .unwrap_or(SubscriptionResult::Error("Unknown".to_string()));
    pairing_prompt.abort();

    match result {
        SubscriptionResult::Success => Ok(()),
        SubscriptionResult::Error(e) => {
            device.set_connection_status(DeviceConnectionStatus::PairingError { error: e.clone() });
            dispatch_status(
                manager.clone(),
                device.clone(),
                DeviceConnectionStatus::Disconnected,
            )
            .await;

            Err(e.into())
        }
    }
}
