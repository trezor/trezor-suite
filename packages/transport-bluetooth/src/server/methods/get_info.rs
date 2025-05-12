use crate::server::{
    adapter_manager::AdapterManager,
    types::{MethodResult, WsResponsePayload},
    utils,
};

#[cfg(target_os = "linux")]
async fn get_adapter_info() -> Result<String, Box<dyn std::error::Error>> {
    // TODO: look for LMP version 10+
    // TODO: https://askubuntu.com/a/591813, hciconfig deprecated
    let result = std::process::Command::new("hciconfig").arg("-a").output();

    match result {
        Ok(info) => Ok(String::from_utf8_lossy(&info.stdout).to_string()),
        Err(error) => Err(error.into()),
    }
}

#[cfg(target_os = "macos")]
async fn get_adapter_info() -> Result<String, Box<dyn std::error::Error>> {
    // system_profiler -detailLevel full SPBluetoothDataType
    let result = std::process::Command::new("system_profiler")
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
    // let result = std::process::Command::new("powershell")
    //     .arg("-Command")
    //     .arg("Get-PnpDevice -Class Bluetooth | Format-List")
    //     .output();
    // match result {
    //     Ok(info) => Ok(String::from_utf8_lossy(&info.stdout).to_string()),
    //     Err(error) => Err(error.into()),
    // }
}

fn get_adapter_version() -> u8 {
    // TODO: create platform specific util and parse adapter_info
    0
}

pub async fn get_info(manager: AdapterManager) -> MethodResult {
    let api_version = utils::APP_VERSION.to_string();

    let info = match get_adapter_info().await {
        Ok(info) => info,
        Err(error) => error.to_string(),
    };

    let adapter = manager.get_adapter().await?;
    let state = manager.get_adapter_state().await;
    let adapter_version = get_adapter_version();

    if adapter.is_some() {
        return Ok(WsResponsePayload::Info {
            state,
            api_version,
            adapter_info: info,
            adapter_version,
        });
    }

    Ok(WsResponsePayload::Info {
        state,
        api_version,
        adapter_info: info,
        adapter_version,
    })
}
