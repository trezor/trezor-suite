use crate::server::{
    adapter_manager::AdapterManager,
    types::{MethodResult, WsResponsePayload},
    utils,
};
use std::process::Command;

#[cfg(target_os = "linux")]
async fn get_adapter_info() -> Result<String, Box<dyn std::error::Error>> {
    // look for LMP version 10+
    let result1 = Command::new("bluetoothctl").arg("show").output();
    // hciconfig is deprecated
    let result2 = Command::new("hciconfig").arg("-a").output();

    match (result1, result2) {
        (Ok(info1), Ok(info2)) => Ok(String::from_utf8_lossy(&info1.stdout).to_string()),
        (Ok(info1), Err(_)) => Ok(String::from_utf8_lossy(&info1.stdout).to_string()),
        (Err(_), Ok(info2)) => Ok(String::from_utf8_lossy(&info2.stdout).to_string()),
        (Err(error), Err(_)) => Err(error.into()),
    }
}

#[cfg(target_os = "macos")]
async fn get_adapter_info() -> Result<String, Box<dyn std::error::Error>> {
    // system_profiler -detailLevel full SPBluetoothDataType
    let result = Command::new("system_profiler")
        .arg("-detailLevel")
        .arg("full")
        .arg("SPBluetoothDataType")
        .output();

    match result {
        Ok(info) => Ok(String::from_utf8_lossy(&info.stdout).to_string()),
        Err(error) => Err(error.into()),
    }
}

#[cfg(target_os = "windows")]
async fn get_adapter_info() -> Result<String, Box<dyn std::error::Error>> {
    Ok("Missing info".to_string())

    // This takes too long
    // let result = Command::new("powershell")
    //     .arg("-Command")
    //     .arg("Get-PnpDevice -Class Bluetooth | Format-List")
    //     .output();
    // match result {
    //     Ok(info) => Ok(String::from_utf8_lossy(&info.stdout).to_string()),
    //     Err(error) => Err(error.into()),
    // }
}

pub async fn get_info(manager: AdapterManager) -> MethodResult {
    let api_version = utils::APP_VERSION.to_string();
    let build = utils::BUILD_VERSION_TAG.to_string();

    let info = match get_adapter_info().await {
        Ok(info) => info,
        Err(error) => error.to_string(),
    };

    let state = manager.get_adapter_state().await;

    Ok(WsResponsePayload::Info {
        state,
        api_version,
        build,
        adapter_info: info,
    })
}
