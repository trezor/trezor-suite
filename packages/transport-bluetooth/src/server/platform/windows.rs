use crate::server::platform::PlatformDevice;
use btleplug::{
    api::{BDAddr, Peripheral as _},
    platform::Peripheral,
};
use std::error::Error;
use windows::Devices::Bluetooth::BluetoothLEDevice;

pub struct WindowsDevice;

impl PlatformDevice for WindowsDevice {
    async fn is_paired(peripheral: &Peripheral) -> Result<bool, Box<dyn Error>> {
        let address = BDAddr::from_str_delim(&peripheral.id().to_string())?;
        let device = BluetoothLEDevice::FromBluetoothAddressAsync(address.into())?.await?;

        Ok(device.DeviceInformation()?.Pairing()?.IsPaired()?)
    }

    // diffs: see ./platform_macos
    fn get_address(peripheral: Peripheral) -> String {
        peripheral.address().to_string()
    }
}
