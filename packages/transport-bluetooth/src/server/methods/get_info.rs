use btleplug::api::{Central, CentralState};
use btleplug::platform::Adapter;

use crate::server::types::{MethodResult, WsResponsePayload};
use crate::server::utils;

pub async fn get_info(adapter: Option<Adapter>) -> MethodResult {
    if adapter.is_some() {
        let adapter = adapter.unwrap();
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
            api_version: utils::APP_VERSION.to_string(),
            adapter_info: info,
        });
    }

    return Ok(WsResponsePayload::Info {
        powered: false,
        api_version: utils::APP_VERSION.to_string(),
        adapter_info: "Unknown".to_string(),
    });
}
