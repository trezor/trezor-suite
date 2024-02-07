use log::info;
use btleplug::api::{Central, CentralState};

use crate::server::adapter_manager::AdapterManager;
use crate::server::types::{MethodResult, WsResponsePayload};
use crate::server::utils;

#[cfg(target_os = "macos")]
pub async fn get_adapter_info() -> Result<(), Box<dyn std::error::Error>> {
    let info = std::process::Command::new("system_profiler")
        .arg("-detailLevel")
        .arg("full")
        .arg("SPBluetoothDataType")
        .output();

    println!("get_adapter_info macos {:?}", info);
    // system_profiler -detailLevel full SPBluetoothDataType

    Ok(())
}

// TODO: look for LMP version 10+

#[cfg(target_os = "linux")]
pub async fn get_adapter_info() -> Result<(), Box<dyn std::error::Error>> {
    // TODO: https://askubuntu.com/a/591813, hciconfig deprecated
    let info = std::process::Command::new("hciconfig").arg("-a").output();

    println!("get_adapter_info linux {:?}", info);

    Ok(())
}

#[cfg(target_os = "windows")]
pub async fn get_adapter_info() -> Result<(), Box<dyn std::error::Error>> {
    println!("get_adapter_info windows...");
    Ok(())
}

pub async fn get_info(manager: AdapterManager) -> MethodResult {
    if let Err(err) = get_adapter_info().await {
        info!("get_adapter_info error {:?}", err);
    }

    let adapter = manager.get_adapter().await?;
    let api_version = utils::APP_VERSION.to_string();
    if adapter.is_some() {
        let adapter = adapter.clone().unwrap();
        let info = adapter
            .adapter_info()
            .await
            .unwrap_or("Unknown".to_string());
        let state = adapter
            .adapter_state()
            .await
            .unwrap_or(CentralState::PoweredOff);

        return Ok(WsResponsePayload::Info {
            powered: state == CentralState::PoweredOn,
            api_version,
            adapter_info: info,
            adapter_version: 9, // TODO: create platform specific util
        });
    }

    return Ok(WsResponsePayload::Info {
        powered: false,
        api_version: utils::APP_VERSION.to_string(),
        adapter_info: "Unknown".to_string(),
        adapter_version: 0,
    });
}
