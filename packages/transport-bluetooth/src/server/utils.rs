use crate::server::device::SERVICE_UUID;
use btleplug::{
    api::{Central, Peripheral as _},
    platform::{Adapter, Peripheral, PeripheralId},
};
use std::time::{SystemTime, UNIX_EPOCH};

pub const APP_VERSION: &str = env!("CARGO_PKG_VERSION");
pub const BUILD_VERSION_TAG: &str = match option_env!("BUILD_VERSION_TAG") {
    Some(hash) => hash,
    None => "unknown",
};

pub async fn scan_filter(adapter: &Adapter, id: &PeripheralId) -> Option<Peripheral> {
    let peripheral = match adapter.peripheral(id).await {
        Ok(p) => p,
        Err(_) => {
            return None;
        }
    };

    if let Ok(Some(props)) = peripheral.properties().await {
        let service = props.services.iter().find(|c| *c == &SERVICE_UUID);
        if service.is_some() {
            return Some(peripheral);
        }
    };

    None
}

pub fn get_timestamp() -> u128 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .expect("Time went backwards")
        .as_millis()
}
