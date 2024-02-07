use crate::server::adapter_manager::AdapterManager;
use crate::server::types::{MethodResult, WsResponsePayload};
use crate::server::utils;

#[cfg(target_os = "linux")]
pub async fn get_adapter_info() -> Result<String, Box<dyn std::error::Error>> {
    // TODO: look for LMP version 10+
    // TODO: https://askubuntu.com/a/591813, hciconfig deprecated
    let result = std::process::Command::new("hciconfig").arg("-a").output();

    match result {
        Ok(info) => Ok(format!("{:?}", info)),
        Err(error) => Err(error.into()),
    }
}

#[cfg(target_os = "macos")]
pub async fn get_adapter_info() -> Result<String, Box<dyn std::error::Error>> {
    // system_profiler -detailLevel full SPBluetoothDataType
    let result = std::process::Command::new("system_profiler")
        .arg("-detailLevel")
        .arg("full")
        .arg("SPBluetoothDataType")
        .output();

    match result {
        Ok(info) => Ok(format!("{:?}", info)),
        Err(error) => Err(error.into()),
    }
}

#[cfg(target_os = "windows")]
pub async fn get_adapter_info() -> Result<String, Box<dyn std::error::Error>> {
    Ok("TODO: get_adapter_info windows.".to_string())
}

pub async fn get_info(manager: AdapterManager) -> MethodResult {
    let api_version = utils::APP_VERSION.to_string();

    let info = match get_adapter_info().await {
        Ok(info) => info,
        Err(error) => error.to_string(),
    };

    let adapter = manager.get_adapter().await?;
    let state = manager.get_adapter_state().await;

    if adapter.is_some() {
        return Ok(WsResponsePayload::Info {
            state,
            api_version,
            adapter_info: info,
            adapter_version: 9, // TODO: create platform specific util
        });
    }

    return Ok(WsResponsePayload::Info {
        state,
        api_version: utils::APP_VERSION.to_string(),
        adapter_info: info,
        adapter_version: 0,
    });
}
