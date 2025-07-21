use crate::server::platform::PlatformDevice;
use btleplug::{api::Peripheral as _, platform::Peripheral};
use std::error::Error;

pub struct MacosDevice;

impl PlatformDevice for MacosDevice {
    async fn is_paired(_peripheral: &Peripheral) -> Result<bool, Box<dyn Error>> {
        Ok(false)
    }

    // address is unknown, btleplug returns 00:00:00:00. use id
    fn get_address(peripheral: Peripheral) -> String {
        peripheral.id().to_string()
    }
}
