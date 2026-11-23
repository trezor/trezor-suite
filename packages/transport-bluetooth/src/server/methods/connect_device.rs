use tokio::time::{Duration, Instant};

use crate::server::{
    adapter_manager::{AdapterError, AdapterManager},
    platform::{BluetoothDevice, ConnectDeviceContext, PlatformDevice},
    types::{ConnectDeviceParams, MethodResult, WsResponsePayload},
    ConnectionBroadcast,
};

const DEFAULT_CONNECT_TIMEOUT_MS: u32 = 30_000;
const MAX_CONNECT_TIMEOUT_MS: u32 = 120_000;
// kept for the connection itself, the wait for the connection takes only the rest
const MIN_CONNECT_TIMEOUT_MS: u32 = 5_000;

/// How long the request may wait for its connection. The client allows the request
/// its timeout plus a margin, so the request never outlives it.
fn wait_allowed(timeout_ms: u32) -> Duration {
    Duration::from_millis(timeout_ms.saturating_sub(MIN_CONNECT_TIMEOUT_MS).into())
}

/// The timeout that is left for the connection itself after the wait, none when
/// the wait took longer than allowed.
fn timeout_after_wait(timeout_ms: u32, waited: Duration) -> Option<u32> {
    let waited_ms = waited.as_millis();
    if waited_ms > wait_allowed(timeout_ms).as_millis() {
        return None;
    }

    Some(timeout_ms - waited_ms as u32)
}

pub async fn connect_device(
    manager: AdapterManager,
    broadcast: ConnectionBroadcast,
    mut params: ConnectDeviceParams,
) -> MethodResult {
    // zero means "not set"; the timeout is client supplied so bound it on both sides
    params.timeout = match params.timeout {
        0 => DEFAULT_CONNECT_TIMEOUT_MS,
        timeout => timeout.clamp(MIN_CONNECT_TIMEOUT_MS, MAX_CONNECT_TIMEOUT_MS),
    };

    // Before the wait for the connection: it loads the adapter that the scan of the
    // connection needs, and a disabled adapter fails right away instead of after the wait.
    manager.get_powered_adapter_or_die().await?;

    let started = Instant::now();
    let _connection = manager
        .lock_connection(&params.id, started + wait_allowed(params.timeout))
        .await?;
    // the wait is taken from the timeout of the connection
    params.timeout =
        timeout_after_wait(params.timeout, started.elapsed()).ok_or(AdapterError::RadioBusy)?;

    // the adapter can turn off during the wait
    manager.get_powered_adapter_or_die().await?;

    let context = ConnectDeviceContext {
        manager: manager.clone(),
        broadcast,
        params,
    };

    BluetoothDevice::connect(context).await?;

    Ok(WsResponsePayload::Success { success: true })
}

#[cfg(test)]
mod tests {
    use super::*;

    // not a fixed cap: the wait takes what the timeout leaves for the connection
    #[test]
    fn a_request_may_wait_for_all_but_the_time_the_connection_needs() {
        assert_eq!(wait_allowed(30_000), Duration::from_millis(25_000));
        assert_eq!(wait_allowed(MIN_CONNECT_TIMEOUT_MS), Duration::ZERO);
    }

    #[test]
    fn the_wait_is_taken_from_the_timeout_of_the_connection() {
        assert_eq!(timeout_after_wait(30_000, Duration::ZERO), Some(30_000));
        assert_eq!(
            timeout_after_wait(30_000, Duration::from_millis(1_200)),
            Some(28_800)
        );
    }

    #[test]
    fn a_wait_beyond_the_allowed_one_leaves_no_connection() {
        assert_eq!(
            timeout_after_wait(30_000, Duration::from_millis(25_000)),
            Some(MIN_CONNECT_TIMEOUT_MS)
        );
        assert_eq!(
            timeout_after_wait(30_000, Duration::from_millis(25_001)),
            None
        );
    }
}
