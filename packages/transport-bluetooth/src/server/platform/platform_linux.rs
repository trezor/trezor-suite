use btleplug::{api::Peripheral as _, platform::Peripheral};
use dbus::{
    arg::{RefArg, Variant},
    blocking::Connection,
};
use std::{collections::HashMap, error::Error};
use tokio::time::Duration;

const BLUEZ_SERVICE: &str = "org.bluez";
const DBUS_PROPERTIES_INTERFACE: &str = "org.freedesktop.DBus.Properties";
const DBUS_DEVICE: &str = "org.bluez.Device1";

pub async fn is_device_paired(peripheral: &Peripheral) -> Result<bool, Box<dyn Error>> {
    let conn = Connection::new_system()?;
    let device_path = format!("/org/bluez/{}", peripheral.id());
    let device_proxy = conn.with_proxy(BLUEZ_SERVICE, device_path, Duration::from_secs(10));
    let (props,): (HashMap<String, Variant<Box<dyn RefArg>>>,) =
        device_proxy.method_call(DBUS_PROPERTIES_INTERFACE, "GetAll", (DBUS_DEVICE,))?;

    let is_paired = props
        .get("Paired")
        .and_then(|variant| variant.0.as_any().downcast_ref::<bool>())
        .copied()
        .unwrap_or(false);

    Ok(is_paired)
}

// diffs: see ./platform_macos
pub fn get_device_address(peripheral: Peripheral) -> String {
    peripheral.address().to_string()
}
