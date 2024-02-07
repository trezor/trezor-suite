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
