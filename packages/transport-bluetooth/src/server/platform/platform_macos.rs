use btleplug::{api::Peripheral as _, platform::Peripheral};
use std::error::Error;

pub async fn is_device_paired(_peripheral: &Peripheral) -> Result<bool, Box<dyn Error>> {
    Ok(false)
}

// address is unknown, btleplug returns 00:00:00:00. use id
pub fn get_device_address(peripheral: Peripheral) -> String {
    peripheral.id().to_string()
}
