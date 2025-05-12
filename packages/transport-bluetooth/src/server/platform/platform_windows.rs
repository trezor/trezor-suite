use btleplug::{
    api::{BDAddr, Peripheral as _},
    platform::Peripheral,
};
use std::error::Error;
use windows::Devices::Bluetooth::BluetoothLEDevice;

pub async fn is_device_paired(peripheral: &Peripheral) -> Result<bool, Box<dyn Error>> {
    let address = BDAddr::from_str_delim(&peripheral.id().to_string())?;
    let device = BluetoothLEDevice::FromBluetoothAddressAsync(address.into())?.await?;

    Ok(device.DeviceInformation()?.Pairing()?.IsPaired()?)
}

// diffs: see ./platform_macos
pub fn get_device_address(peripheral: Peripheral) -> String {
    peripheral.address().to_string()
}
