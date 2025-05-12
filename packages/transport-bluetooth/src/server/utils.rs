use crate::server::device::SERVICE_UUID;
use btleplug::{
    api::{Central, Peripheral as _},
    platform::{Adapter, Peripheral, PeripheralId},
};
use std::time::{SystemTime, UNIX_EPOCH};

pub const APP_VERSION: &str = env!("CARGO_PKG_VERSION");

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

        // 2 types of advertisements:
        // Primary Advertisement: basic data like flags, manufacturer-specific but lack of services and local_name
        // Scan Response: additional details like services and local_name
        // advertisements may be received in unexpected order
        // linux / mac: props.services is empty. try by name
        let name = props.local_name.unwrap_or("".to_string());
        if name.contains("Trezor") {
            return Some(peripheral);
        }
    };

    None
}

pub fn get_timestamp() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .expect("Time went backwards")
        .as_secs()
}
