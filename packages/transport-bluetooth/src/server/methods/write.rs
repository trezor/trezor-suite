use btleplug::api::{CharPropFlags, Peripheral as _, WriteType};
use log::info;
use crate::server::{
    utils,
    device::{CHARACTERISTIC_RX,SERVICE_UUID},
    adapter_manager::AdapterManager,
    types::{MethodError, MethodResult, WsResponsePayload, WriteParams},
    device::{DeviceConnectionStatus, TrezorDevice}
};

pub async fn write(manager: AdapterManager, params: WriteParams) -> MethodResult {
    let WriteParams { id, data, with_response } = params;
    manager.get_powered_adapter_or_die().await?;
    let peripheral = manager.get_peripheral_or_die(&id).await?;
    let device = manager.get_device_or_die(id).await?;
    let is_connected = peripheral.is_connected().await.unwrap_or(false);
    if !is_connected {
        return Err(MethodError::Unexpected("WTF?".to_string()));
    }
    // TODO: remove this info after debugging
    info!("write services: {}", peripheral.services().len());
    if peripheral.services().len() == 0 {
        // always empty on linux
        // slows down the process on windows
        peripheral.discover_services().await?;
    }
    let characteristics = peripheral.characteristics();
    let cmd_char = characteristics
        .iter()
        .find(|c| c.uuid == CHARACTERISTIC_RX && c.properties.contains(CharPropFlags::WRITE_WITHOUT_RESPONSE))
        .unwrap();

    let mut vec = vec![0; 244];
    for (i, val) in data.into_iter().enumerate() {
        vec[i] = val;
    }

    let mut write_type;
    if with_response {
        write_type = WriteType::WithResponse;
        // windows WithResponse takes too long. about ~3000ms
        #[cfg(target_os = "windows")]
        {
            write_type = WriteType::WithoutResponse;
            // tokio::time::sleep(tokio::time::Duration::from_millis(1000)).await;
        }
    } else {
        write_type = WriteType::WithoutResponse;
    }

    info!("write: {} {:?}, bytes {:?}", vec.len(), write_type, vec);

    peripheral
        .write(cmd_char, &vec, write_type)
        .await?;

    #[cfg(target_os = "windows")]
    {
        if with_response {
            tokio::time::sleep(tokio::time::Duration::from_millis(80)).await;
        } else {
            tokio::time::sleep(tokio::time::Duration::from_millis(50)).await;
        }
        
    }

    Ok(WsResponsePayload::Success(true))
}
