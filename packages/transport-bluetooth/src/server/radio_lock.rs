use std::{
    collections::HashSet,
    sync::{Arc, Mutex as StdMutex, MutexGuard as StdMutexGuard, PoisonError},
};

use log::info;
use tokio::sync::{Mutex, MutexGuard, Notify};

/// Connections run one at a time per device. Only BlueZ requires discovery calls
/// to exclude connections; queued discovery calls never hold back new connections.
#[derive(Clone)]
pub struct RadioLock {
    inner: Arc<Inner>,
    exclusive_discovery: bool,
}

impl Default for RadioLock {
    fn default() -> Self {
        Self::new(cfg!(target_os = "linux"))
    }
}

#[derive(Default)]
struct Inner {
    state: StdMutex<State>,
    changed: Notify,
    // FIFO by lock request, not by websocket message arrival
    discovery_queue: Mutex<()>,
}

#[derive(Default)]
struct State {
    connecting: HashSet<String>,
    discovery_in_flight: bool,
}

impl State {
    fn try_enter_connection(&mut self, device_id: &str) -> bool {
        let free = !self.discovery_in_flight && !self.connecting.contains(device_id);
        if free {
            self.connecting.insert(device_id.to_string());
        }

        free
    }

    fn leave_connection(&mut self, device_id: &str) {
        self.connecting.remove(device_id);
    }

    fn try_enter_discovery(&mut self) -> bool {
        let free = self.connecting.is_empty();
        if free {
            self.discovery_in_flight = true;
        }

        free
    }

    fn leave_discovery(&mut self) {
        self.discovery_in_flight = false;
    }
}

#[must_use = "dropping the guard releases the radio lock immediately"]
pub struct ConnectionGuard<'a> {
    lock: &'a RadioLock,
    device_id: String,
}

#[must_use = "dropping the guard releases the radio lock immediately"]
pub struct DiscoveryGuard<'a> {
    lock: &'a RadioLock,
    _queue: MutexGuard<'a, ()>,
}

impl Drop for ConnectionGuard<'_> {
    fn drop(&mut self) {
        self.lock
            .release(|state| state.leave_connection(&self.device_id));
    }
}

impl Drop for DiscoveryGuard<'_> {
    fn drop(&mut self) {
        if self.lock.exclusive_discovery {
            self.lock.release(State::leave_discovery);
        }
    }
}

impl RadioLock {
    fn new(exclusive_discovery: bool) -> Self {
        Self {
            inner: Arc::default(),
            exclusive_discovery,
        }
    }

    pub async fn lock_connection(&self, owner: &str, device_id: &str) -> ConnectionGuard<'_> {
        self.wait_until(owner, "connection", |state| {
            state.try_enter_connection(device_id)
        })
        .await;

        ConnectionGuard {
            lock: self,
            device_id: device_id.to_string(),
        }
    }

    #[cfg(test)]
    pub async fn lock_discovery(&self, owner: &str) -> DiscoveryGuard<'_> {
        self.lock_discovery_if_needed(owner, std::future::ready(true))
            .await
    }

    pub async fn lock_discovery_if_needed(
        &self,
        owner: &str,
        needs_radio: impl std::future::Future<Output = bool>,
    ) -> DiscoveryGuard<'_> {
        // kept while waiting for connections so discovery calls stay in queue order
        let queue = match self.inner.discovery_queue.try_lock() {
            Ok(queue) => queue,
            Err(_) => {
                info!("{owner} waiting for another discovery call");
                self.inner.discovery_queue.lock().await
            }
        };
        if self.exclusive_discovery && needs_radio.await {
            self.wait_until(owner, "discovery", State::try_enter_discovery)
                .await;
        }

        DiscoveryGuard {
            lock: self,
            _queue: queue,
        }
    }

    /// Does not wait. Returns `None` when the queue or the radio is busy.
    pub fn try_lock_discovery(&self) -> Option<DiscoveryGuard<'_>> {
        let queue = self.inner.discovery_queue.try_lock().ok()?;
        if self.exclusive_discovery && !self.state().try_enter_discovery() {
            return None;
        }

        Some(DiscoveryGuard {
            lock: self,
            _queue: queue,
        })
    }

    /// Waits for running connections without the queue, so other discovery
    /// calls continue meanwhile. Use it for work that no client request waits for.
    pub async fn lock_discovery_when_idle(&self, owner: &str) -> DiscoveryGuard<'_> {
        loop {
            if self.exclusive_discovery {
                self.wait_until(owner, "discovery", |state| state.connecting.is_empty())
                    .await;
            }
            let queue = self.inner.discovery_queue.lock().await;
            if !self.exclusive_discovery || self.state().try_enter_discovery() {
                return DiscoveryGuard {
                    lock: self,
                    _queue: queue,
                };
            }
            // A connection started before this call got the queue. Do not
            // keep the queue during that connection.
        }
    }

    fn state(&self) -> StdMutexGuard<'_, State> {
        self.inner
            .state
            .lock()
            .unwrap_or_else(PoisonError::into_inner)
    }

    fn release(&self, leave: impl FnOnce(&mut State)) {
        leave(&mut self.state());
        self.inner.changed.notify_waiters();
    }

    async fn wait_until(
        &self,
        owner: &str,
        mode: &str,
        mut try_enter: impl FnMut(&mut State) -> bool,
    ) {
        let mut waited = false;
        loop {
            // created before the check so a notification in between is not lost
            let changed = self.inner.changed.notified();
            if try_enter(&mut self.state()) {
                if waited {
                    info!("{owner} acquired the {mode} radio lock");
                }

                return;
            }

            if !waited {
                info!("{owner} waiting for the {mode} radio lock");
                waited = true;
            }

            changed.await;
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use futures::{poll, FutureExt};

    #[tokio::test]
    async fn connections_to_different_devices_share_the_lock() {
        let lock = RadioLock::default();

        let _first = lock.lock_connection("connect 1", "dev1").await;

        assert!(lock
            .lock_connection("connect 2", "dev2")
            .now_or_never()
            .is_some());
    }

    #[tokio::test]
    async fn connections_to_the_same_device_run_one_at_a_time() {
        let lock = RadioLock::default();
        let first = lock.lock_connection("connect 1", "dev1").await;

        // a cancelled wait must not leave the device marked as connecting
        assert!(lock
            .lock_connection("connect 2", "dev1")
            .now_or_never()
            .is_none());

        drop(first);
        assert!(lock
            .lock_connection("connect 2", "dev1")
            .now_or_never()
            .is_some());
    }

    // connect_device, stop_scan, connect_device: the second connection must not
    // queue behind the waiting stop_scan.
    #[tokio::test]
    async fn waiting_discovery_does_not_hold_back_new_connections() {
        let lock = RadioLock::new(true);
        let first = lock.lock_connection("connect 1", "dev1").await;

        let mut stop_scan = Box::pin(lock.lock_discovery("stop_scan"));
        assert!(poll!(&mut stop_scan).is_pending());

        let second = lock
            .lock_connection("connect 2", "dev2")
            .now_or_never()
            .expect("second connection must not wait for the pending discovery");

        drop(first);
        assert!(poll!(&mut stop_scan).is_pending());

        drop(second);
        assert!(poll!(stop_scan).is_ready());
    }

    #[tokio::test]
    async fn connections_wait_for_a_running_discovery() {
        let lock = RadioLock::new(true);
        let discovery = lock.lock_discovery("stop_scan").await;

        // a cancelled wait must not leave the lock taken
        assert!(lock
            .lock_connection("connect", "dev1")
            .now_or_never()
            .is_none());

        drop(discovery);
        assert!(lock
            .lock_connection("connect", "dev1")
            .now_or_never()
            .is_some());
    }

    #[tokio::test]
    async fn deferred_discovery_leaves_the_queue_free_while_a_connection_runs() {
        let lock = RadioLock::new(true);
        let connection = lock.lock_connection("connect", "dev1").await;
        assert!(lock.try_lock_discovery().is_none());

        let mut deferred = Box::pin(lock.lock_discovery_when_idle("deferred stop"));
        assert!(poll!(&mut deferred).is_pending());
        let queue = lock.lock_discovery_if_needed("start_scan", std::future::ready(false));
        assert!(queue.now_or_never().is_some());

        drop(connection);
        assert!(poll!(deferred).is_ready());
    }

    // The deferred call waits for the queue when the connections end. A new
    // connection can start meanwhile.
    #[tokio::test]
    async fn deferred_discovery_releases_the_queue_for_a_new_connection() {
        let lock = RadioLock::new(true);
        let first = lock.lock_connection("connect 1", "dev1").await;
        let start_scan = lock
            .lock_discovery_if_needed("start_scan", std::future::ready(false))
            .await;
        let mut deferred = Box::pin(lock.lock_discovery_when_idle("deferred stop"));
        assert!(poll!(&mut deferred).is_pending());

        drop(first);
        assert!(poll!(&mut deferred).is_pending());
        let second = lock.lock_connection("connect 2", "dev2").await;
        drop(start_scan);
        assert!(poll!(&mut deferred).is_pending());
        let stop_scan = lock.lock_discovery_if_needed("stop_scan", std::future::ready(false));
        assert!(stop_scan.now_or_never().is_some());

        drop(second);
        assert!(poll!(deferred).is_ready());
    }

    #[tokio::test]
    async fn cancelled_discovery_wait_releases_the_queue() {
        let lock = RadioLock::new(true);
        let connection = lock.lock_connection("connect", "dev1").await;

        assert!(lock.lock_discovery("stop_scan").now_or_never().is_none());

        drop(connection);
        assert!(lock.lock_discovery("stop_scan").now_or_never().is_some());
    }

    async fn assert_discovery_queue_order<Guard>(lock: &RadioLock, blocker: Guard) {
        let mut stop = Box::pin(lock.lock_discovery("stop_scan"));
        let mut start = Box::pin(lock.lock_discovery("start_scan"));
        assert!(poll!(&mut stop).is_pending());
        assert!(poll!(&mut start).is_pending());

        drop(blocker);
        assert!(poll!(&mut start).is_pending());
        let stopping = stop.now_or_never().expect("first waiter gets the radio");
        assert!(poll!(&mut start).is_pending());
        drop(stopping);
        assert!(poll!(start).is_ready());
    }

    #[tokio::test]
    async fn discovery_calls_run_in_queue_order() {
        let lock = RadioLock::default();
        assert_discovery_queue_order(&lock, lock.lock_discovery("first").await).await;
    }

    #[tokio::test]
    async fn discovery_calls_waiting_for_a_connection_run_in_queue_order() {
        let lock = RadioLock::new(true);
        assert_discovery_queue_order(&lock, lock.lock_connection("connect", "dev1").await).await;
    }

    #[tokio::test]
    async fn independent_discovery_still_serializes_connections_per_device() {
        let lock = RadioLock::new(false);
        let first = lock.lock_connection("connect", "dev1").await;
        let _scan = lock
            .lock_discovery("scan")
            .now_or_never()
            .expect("discovery can overlap connect");
        let _other = lock
            .lock_connection("connect", "dev2")
            .now_or_never()
            .expect("connect can overlap discovery");
        let mut retry = Box::pin(lock.lock_connection("retry", "dev1"));
        assert!(poll!(&mut retry).is_pending());
        drop(first);
        assert!(poll!(retry).is_ready());
    }
}
