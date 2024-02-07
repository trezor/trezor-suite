use tokio::sync::broadcast::Sender;

use btleplug::api::{CharPropFlags, Peripheral as _, WriteType};
use btleplug::platform::Adapter;

use uuid::Uuid;

use crate::server::types::{ChannelMessage, MethodResult, WsResponseFailure, WsResponsePayload};

use crate::server::utils;

const WRITE_CHARACTERISTIC_UUID: Uuid = Uuid::from_u128(0x6e400002_b5a3_f393_e0a9_e50e24dcca9e);

pub async fn write(
    uuid: String,
    data: Vec<u8>,
    adapter: Option<Adapter>,
    _sender: Sender<ChannelMessage>,
) -> MethodResult {
    if !(utils::is_adapter_powered(adapter.clone()).await) {
        return Ok(WsResponsePayload::Error(WsResponseFailure::AdapterDisabled));
    }

    let adapter = adapter.unwrap();
    let device = utils::get_peripheral_by_address(&adapter, uuid).await?;

    device.discover_services().await?;

    let characteristics = device.characteristics();
    let cmd_char = characteristics
        .iter()
        .find(|c| {
            c.uuid == WRITE_CHARACTERISTIC_UUID && c.properties.contains(CharPropFlags::WRITE)
        })
        .unwrap();

    let mut vec = vec![0; 244];
    let mut i = 0;
    for val in data {
        vec[i] = val;
        i += 1;
    }

    println!("sending {} - {}, {:?}", vec.len(), cmd_char, vec);

    let resp = device
        .write(&cmd_char, &vec, WriteType::WithoutResponse)
        .await
        .expect("Cannot write...");

    println!("sending complete {:?}", resp);

    Ok(WsResponsePayload::Success(true))
}
