//! Decides when the adapter scans.
//!
//! The adapter scans while a client wants it (`start_scan`) and, where
//! `connections_need_scan` is set, while a `connect_device` request runs. On
//! Linux BlueZ does not complete a connection to an LE device that it does not
//! see, and a discovery call during a connection can abort it.
//!
//! Both follow from one rule: every change of the demand is followed by
//! `reconcile`, which makes the adapter match the demand with at most one call,
//! one at a time (`ScanTurn`).
//!
//! - A connection raises the demand before it connects. A `stop_scan` that came
//!   before restarts the scan, one that comes after does nothing.
//! - The scan stops when no client and no connection needs it. The last
//!   connection stops it, and a repeated `stop_scan` makes no adapter call.

use std::{
    collections::HashSet,
    future::Future,
    sync::{Arc, Mutex as StdMutex, MutexGuard as StdMutexGuard, PoisonError},
};

use btleplug::{
    api::{Central, ScanFilter},
    platform::Adapter,
};
use log::info;
use tokio::{
    sync::{Mutex, MutexGuard, Notify},
    time::{timeout_at, Duration, Instant},
};

/// How long a start_scan or stop_scan request waits for its turn. They carry no
/// timeout, so they give up before the default request timeout of the websocket
/// client (DEFAULT_TIMEOUT, 20 s, in packages/websocket-client).
pub const SCAN_REQUEST_WAIT: Duration = Duration::from_secs(15);

/// Why `connect` returns no connection.
#[derive(Debug)]
pub enum ConnectError {
    /// the deadline passed while it waited
    Timeout,
    /// The adapter did not start the scan that the connection needs. BlueZ does not
    /// complete a connection without it, so it is not tried: it would only end in
    /// the timeout of the request and hide the reason.
    Scan(btleplug::Error),
}

/// The adapter calls that the coordinator makes.
pub trait ScanAdapter: Clone + Send + Sync + 'static {
    fn start(&self) -> impl Future<Output = btleplug::Result<()>> + Send;
    fn stop(&self) -> impl Future<Output = btleplug::Result<()>> + Send;
}

impl ScanAdapter for Adapter {
    async fn start(&self) -> btleplug::Result<()> {
        // Restart the scan: it ensures that the event stream really runs, a
        // workaround for https://github.com/deviceplug/btleplug/issues/255
        // windows: calling stop_scan breaks the current broadcast.subscribe stream
        if let Err(err) = self.stop_scan().await {
            info!("scan restart, adapter.stop_scan: {err}");
        }

        self.start_scan(ScanFilter::default()).await
    }

    async fn stop(&self) -> btleplug::Result<()> {
        match self.stop_scan().await {
            Err(err) if is_no_discovery_started(&err) => Ok(()),
            result => result,
        }
    }
}

/// BlueZ answers `StopDiscovery` with this text when the caller has no scan,
/// which is the state that a stop wants.
fn is_no_discovery_started(err: &btleplug::Error) -> bool {
    err.to_string().contains("No discovery started")
}

#[derive(Default)]
struct State {
    /// the adapter is powered on
    enabled: bool,
    /// a client started the scan and no client stopped it since
    wanted: bool,
    /// devices that a `connect_device` request connects to right now
    connecting: HashSet<String>,
    /// the adapter runs a scan that this process started
    running: bool,
}

impl State {
    fn needed(&self, connections_need_scan: bool) -> bool {
        self.enabled && (self.wanted || (connections_need_scan && !self.connecting.is_empty()))
    }
}

#[derive(Clone)]
pub struct ScanCoordinator<A> {
    state: Arc<StdMutex<State>>,
    adapter: Arc<Mutex<Option<A>>>,
    /// held by the one request that starts or stops the scan
    adapter_calls: Arc<Mutex<()>>,
    /// a connection ended
    ended: Arc<Notify>,
    connections_need_scan: bool,
}

impl<A: ScanAdapter> ScanCoordinator<A> {
    pub fn new(adapter: Arc<Mutex<Option<A>>>, connections_need_scan: bool) -> Self {
        Self {
            state: Arc::default(),
            adapter,
            adapter_calls: Arc::default(),
            ended: Arc::default(),
            connections_need_scan,
        }
    }

    fn state(&self) -> StdMutexGuard<'_, State> {
        self.state.lock().unwrap_or_else(PoisonError::into_inner)
    }

    pub fn is_wanted(&self) -> bool {
        self.state().wanted
    }

    /// The adapter turned on or off. A scan ends with the adapter, so the demand of
    /// the clients ends with it too: a client starts the scan again when the adapter
    /// is enabled. A connection that still runs needs the scan, so enabling starts
    /// it again. Returns true when a scan was wanted or running.
    pub fn set_enabled(&self, enabled: bool) -> bool {
        let mut state = self.state();
        state.enabled = enabled;
        if enabled {
            let restart = state.needed(self.connections_need_scan) && !state.running;
            drop(state);
            if restart {
                self.reconcile_later();
            }

            return false;
        }
        let had_scan = state.wanted || state.running;
        state.wanted = false;
        state.running = false;

        had_scan
    }

    /// Reconciles in the background, for callers that cannot wait for the turn.
    fn reconcile_later(&self) {
        let scan = self.clone();
        if let Ok(runtime) = tokio::runtime::Handle::try_current() {
            runtime.spawn(async move {
                let _ = scan.turn().await.reconcile().await;
            });
        }
    }

    /// Waits for the turn to start or stop the scan, in the order of the requests.
    pub async fn turn(&self) -> ScanTurn<'_, A> {
        ScanTurn {
            scan: self,
            _turn: self.adapter_calls.lock().await,
        }
    }

    /// Registers a connection to `device_id` and, where connections need the scan,
    /// has the scan running before it returns. The connection is registered first,
    /// so a `stop_scan` that comes next leaves the scan to it.
    ///
    /// Connections to the same device run one at a time. Fails when `deadline`
    /// passes first, or when the scan does not start. Only the waits end at the
    /// deadline, an adapter call is not cancelled.
    pub async fn connect(
        &self,
        device_id: &str,
        deadline: Instant,
    ) -> Result<ConnectionGuard<A>, ConnectError> {
        let connection = timeout_at(deadline, self.register(device_id))
            .await
            .map_err(|_| ConnectError::Timeout)?;
        if self.connections_need_scan {
            let mut turn = timeout_at(deadline, self.turn())
                .await
                .map_err(|_| ConnectError::Timeout)?;
            turn.reconcile().await.map_err(ConnectError::Scan)?;
        }

        Ok(connection)
    }

    async fn register(&self, device_id: &str) -> ConnectionGuard<A> {
        let mut waited = false;
        loop {
            // created before the check so an end in between is not lost
            let ended = self.ended.notified();
            if self.state().connecting.insert(device_id.to_string()) {
                return ConnectionGuard {
                    scan: self.clone(),
                    device_id: device_id.to_string(),
                };
            }
            if !waited {
                info!("connection to {device_id} waits for the running one");
                waited = true;
            }
            ended.await;
        }
    }
}

/// The right to start or stop the scan. One request has it at a time.
#[must_use = "dropping the turn hands it to the next request"]
pub struct ScanTurn<'a, A> {
    scan: &'a ScanCoordinator<A>,
    _turn: MutexGuard<'a, ()>,
}

impl<A: ScanAdapter> ScanTurn<'_, A> {
    /// The adapter runs a scan, whoever needs it.
    pub fn running(&self) -> bool {
        self.scan.state().running
    }

    /// A client wants the scan. Returns whether the adapter started it now, it
    /// does not when a scan runs for a connection already.
    pub async fn start(&mut self) -> btleplug::Result<bool> {
        let (was_running, was_wanted) = {
            let mut state = self.scan.state();
            if !state.enabled {
                return Ok(false);
            }
            let before = (state.running, state.wanted);
            state.wanted = true;

            before
        };
        if was_running {
            info!(
                "{}",
                if was_wanted {
                    "Scan already running"
                } else {
                    "Scan running for a connection, taken over by the client"
                }
            );
        }
        if let Err(err) = self.reconcile().await {
            self.scan.state().wanted = false;

            return Err(err);
        }

        Ok(!was_running && self.running())
    }

    /// No client wants the scan. A connection that runs keeps it until it ends, and
    /// a stop without a scan makes no adapter call. Returns false when the adapter
    /// stop failed, the next stop tries it again.
    pub async fn stop(&mut self) -> bool {
        self.scan.state().wanted = false;

        self.reconcile().await.is_ok()
    }

    /// Makes the adapter match the demand. Called after every change of it with the
    /// turn held, so a change that comes meanwhile is handled by its own call.
    async fn reconcile(&mut self) -> btleplug::Result<()> {
        let scan = self.scan;
        let (needed, running) = {
            let state = scan.state();
            (state.needed(scan.connections_need_scan), state.running)
        };
        if needed == running {
            return Ok(());
        }
        let Some(adapter) = scan.adapter.lock().await.clone() else {
            // there is no scan without an adapter
            scan.state().running = false;

            return Ok(());
        };

        if needed {
            info!("Scan start");
            adapter
                .start()
                .await
                .inspect_err(|err| info!("Scan start error: {err}"))?;
            // The adapter can turn off during the call, the scan ends with it.
            let mut state = scan.state();
            state.running = state.enabled;
        } else {
            info!("Scan stop");
            adapter
                .stop()
                .await
                .inspect_err(|err| info!("Scan stop error: {err}"))?;
            scan.state().running = false;
        }

        Ok(())
    }
}

/// A running `connect_device` request. When it ends the scan stops, unless a client
/// or another connection needs it.
#[must_use = "dropping the guard ends the connection in the coordinator"]
pub struct ConnectionGuard<A: ScanAdapter> {
    scan: ScanCoordinator<A>,
    device_id: String,
}

impl<A: ScanAdapter> Drop for ConnectionGuard<A> {
    fn drop(&mut self) {
        self.scan.state().connecting.remove(&self.device_id);
        self.scan.ended.notify_waiters();
        if !self.scan.connections_need_scan {
            return;
        }

        self.scan.reconcile_later();
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use futures::poll;
    use tokio::time::sleep;

    type StartHook = Box<dyn Fn() + Send>;

    /// Records the calls and fails or waits when a test asks for it.
    #[derive(Clone, Default)]
    struct FakeAdapter {
        calls: Arc<StdMutex<Vec<&'static str>>>,
        failing: Arc<StdMutex<Vec<&'static str>>>,
        blocked: Arc<StdMutex<Vec<&'static str>>>,
        released: Arc<Notify>,
        on_start: Arc<StdMutex<Option<StartHook>>>,
    }

    impl FakeAdapter {
        fn calls(&self) -> Vec<&'static str> {
            self.calls.lock().unwrap().clone()
        }

        fn fail(&self, call: &'static str) {
            self.failing.lock().unwrap().push(call);
        }

        fn stop_failing(&self) {
            self.failing.lock().unwrap().clear();
        }

        fn block(&self, call: &'static str) {
            self.blocked.lock().unwrap().push(call);
        }

        fn release(&self) {
            self.blocked.lock().unwrap().clear();
            self.released.notify_one();
        }

        async fn call(&self, name: &'static str) -> btleplug::Result<()> {
            self.calls.lock().unwrap().push(name);
            if self.blocked.lock().unwrap().contains(&name) {
                self.released.notified().await;
            }
            if name == "start" {
                if let Some(hook) = self.on_start.lock().unwrap().as_ref() {
                    hook();
                }
            }
            if self.failing.lock().unwrap().contains(&name) {
                return Err(btleplug::Error::Other(format!("{name} failed").into()));
            }

            Ok(())
        }
    }

    impl ScanAdapter for FakeAdapter {
        fn start(&self) -> impl Future<Output = btleplug::Result<()>> + Send {
            self.call("start")
        }

        fn stop(&self) -> impl Future<Output = btleplug::Result<()>> + Send {
            self.call("stop")
        }
    }

    fn scan(connections_need_scan: bool) -> (ScanCoordinator<FakeAdapter>, FakeAdapter) {
        let adapter = FakeAdapter::default();
        let scan = ScanCoordinator::new(
            Arc::new(Mutex::new(Some(adapter.clone()))),
            connections_need_scan,
        );
        scan.set_enabled(true);

        (scan, adapter)
    }

    fn in_ten_seconds() -> Instant {
        Instant::now() + Duration::from_secs(10)
    }

    // a guard dropped by a test hands its stop to a task
    async fn settle() {
        sleep(Duration::from_millis(1)).await;
    }

    #[test]
    fn a_stop_of_a_scan_that_is_not_running_is_not_a_failure() {
        let not_started = btleplug::Error::Other("No discovery started".into());
        let other = btleplug::Error::Other("Timeout waiting for reply".into());

        assert!(is_no_discovery_started(&not_started));
        assert!(!is_no_discovery_started(&other));
    }

    // The test page sends stop_scan more than once. BlueZ answers every stop after
    // the first with an error, so they must not reach it.
    #[tokio::test(start_paused = true)]
    async fn a_client_starts_and_stops_the_scan_once() {
        let (scan, adapter) = scan(true);

        assert!(scan.turn().await.start().await.unwrap());
        assert!(!scan.turn().await.start().await.unwrap());
        assert!(scan.turn().await.stop().await);
        assert!(scan.turn().await.stop().await);

        assert_eq!(adapter.calls(), ["start", "stop"]);
    }

    // stop_scan, connect_device: BlueZ does not complete a connection without a scan.
    #[tokio::test(start_paused = true)]
    async fn a_connection_restarts_the_scan_that_a_stop_ended() {
        let (scan, adapter) = scan(true);
        scan.turn().await.start().await.unwrap();
        scan.turn().await.stop().await;

        let _connection = scan.connect("device", in_ten_seconds()).await.unwrap();

        assert_eq!(adapter.calls(), ["start", "stop", "start"]);
    }

    // connect_device, stop_scan: the stop answers at once and the scan ends after
    // the connection.
    #[tokio::test(start_paused = true)]
    async fn a_stop_after_a_connection_waits_for_it() {
        let (scan, adapter) = scan(true);
        scan.turn().await.start().await.unwrap();
        let connection = scan.connect("device", in_ten_seconds()).await.unwrap();

        assert!(scan.turn().await.stop().await);
        assert_eq!(adapter.calls(), ["start"]);

        drop(connection);
        settle().await;
        assert_eq!(adapter.calls(), ["start", "stop"]);
    }

    // The connection is registered while it waits for its turn, so the stop that
    // is queued behind it leaves the scan to it.
    #[tokio::test(start_paused = true)]
    async fn a_connection_that_waits_for_a_stop_keeps_the_scan_from_the_next_one() {
        let (scan, adapter) = scan(true);
        scan.turn().await.start().await.unwrap();
        adapter.block("stop");
        let mut stop = Box::pin(async { scan.turn().await.stop().await });
        assert!(poll!(&mut stop).is_pending());
        let mut connect = Box::pin(scan.connect("device", in_ten_seconds()));
        assert!(poll!(&mut connect).is_pending());
        let mut next_stop = Box::pin(async { scan.turn().await.stop().await });
        assert!(poll!(&mut next_stop).is_pending());

        adapter.release();
        assert!(stop.await);
        let connection = connect.await.unwrap();
        assert!(next_stop.await);

        assert_eq!(adapter.calls(), ["start", "stop", "start"]);
        drop(connection);
    }

    #[tokio::test(start_paused = true)]
    async fn the_last_connection_ends_the_scan() {
        let (scan, adapter) = scan(true);

        let first = scan.connect("device 1", in_ten_seconds()).await.unwrap();
        let second = scan.connect("device 2", in_ten_seconds()).await.unwrap();
        assert_eq!(adapter.calls(), ["start"]);

        drop(first);
        settle().await;
        assert_eq!(adapter.calls(), ["start"]);

        drop(second);
        settle().await;
        assert_eq!(adapter.calls(), ["start", "stop"]);
    }

    #[tokio::test(start_paused = true)]
    async fn a_scan_that_a_client_wants_outlives_the_connections() {
        let (scan, adapter) = scan(true);
        let connection = scan.connect("device", in_ten_seconds()).await.unwrap();

        // the scan runs for the connection, the client takes it over
        assert!(!scan.turn().await.start().await.unwrap());
        drop(connection);
        settle().await;
        assert_eq!(adapter.calls(), ["start"]);

        assert!(scan.turn().await.stop().await);
        assert_eq!(adapter.calls(), ["start", "stop"]);
    }

    #[tokio::test(start_paused = true)]
    async fn a_failed_stop_is_tried_again_by_the_next_one() {
        let (scan, adapter) = scan(true);
        scan.turn().await.start().await.unwrap();

        adapter.fail("stop");
        assert!(!scan.turn().await.stop().await);
        adapter.stop_failing();
        assert!(scan.turn().await.stop().await);

        assert_eq!(adapter.calls(), ["start", "stop", "stop"]);
    }

    #[tokio::test(start_paused = true)]
    async fn a_failed_start_leaves_no_scan_wanted() {
        let (scan, adapter) = scan(true);
        adapter.fail("start");

        assert!(scan.turn().await.start().await.is_err());

        assert!(!scan.is_wanted());
        assert!(!scan.turn().await.running());
    }

    // BlueZ does not complete a connection without the scan, so the request fails
    // with the reason instead of running into its timeout.
    #[tokio::test(start_paused = true)]
    async fn a_connection_fails_when_the_scan_does_not_start() {
        let (scan, adapter) = scan(true);
        adapter.fail("start");

        assert!(matches!(
            scan.connect("device", in_ten_seconds()).await,
            Err(ConnectError::Scan(_))
        ));
        assert_eq!(adapter.calls(), ["start"]);

        // nothing stays registered for the device
        adapter.stop_failing();
        assert!(scan.connect("device", in_ten_seconds()).await.is_ok());
    }

    // The scan ends with the adapter, and the clients start it again.
    #[tokio::test(start_paused = true)]
    async fn the_adapter_turning_off_ends_the_scan() {
        let (scan, adapter) = scan(true);
        scan.turn().await.start().await.unwrap();

        assert!(scan.set_enabled(false));
        assert!(!scan.set_enabled(false));
        assert!(!scan.is_wanted());
        scan.set_enabled(true);
        settle().await;
        // nothing starts by itself
        assert_eq!(adapter.calls(), ["start"]);

        assert!(scan.turn().await.start().await.unwrap());
        assert_eq!(adapter.calls(), ["start", "start"]);
    }

    // A connection that runs through a turn off of the adapter needs the scan when
    // the adapter is back, BlueZ does not complete it without.
    #[tokio::test(start_paused = true)]
    async fn enabling_the_adapter_restarts_the_scan_that_a_connection_needs() {
        let (scan, adapter) = scan(true);
        let _connection = scan.connect("device", in_ten_seconds()).await.unwrap();

        scan.set_enabled(false);
        scan.set_enabled(true);
        settle().await;

        assert_eq!(adapter.calls(), ["start", "start"]);
    }

    // The adapter can turn off while the start call runs. The scan that started
    // is gone, so a later start must call the adapter again.
    #[tokio::test(start_paused = true)]
    async fn a_scan_that_started_while_the_adapter_turned_off_is_not_running() {
        let (scan, adapter) = scan(true);
        let during_start = scan.clone();
        *adapter.on_start.lock().unwrap() = Some(Box::new(move || {
            during_start.set_enabled(false);
        }));

        assert!(!scan.turn().await.start().await.unwrap());
        assert!(!scan.turn().await.running());

        *adapter.on_start.lock().unwrap() = None;
        scan.set_enabled(true);
        assert!(scan.turn().await.start().await.unwrap());
        assert_eq!(adapter.calls(), ["start", "start"]);
    }

    #[tokio::test(start_paused = true)]
    async fn a_disabled_adapter_is_not_asked_to_scan() {
        let (scan, adapter) = scan(true);
        scan.set_enabled(false);

        assert!(!scan.turn().await.start().await.unwrap());
        assert!(!scan.is_wanted());
        assert!(scan.connect("device", in_ten_seconds()).await.is_ok());

        assert!(adapter.calls().is_empty());
    }

    #[tokio::test(start_paused = true)]
    async fn without_an_adapter_nothing_scans_and_nothing_waits() {
        let scan = ScanCoordinator::<FakeAdapter>::new(Arc::new(Mutex::new(None)), true);
        scan.set_enabled(true);

        assert!(!scan.turn().await.start().await.unwrap());
        assert!(scan.turn().await.stop().await);
        assert!(scan.connect("device", in_ten_seconds()).await.is_ok());
    }

    // Where discovery may overlap a connection the scan is only the clients' business.
    #[tokio::test(start_paused = true)]
    async fn connections_do_not_touch_the_scan_where_discovery_may_overlap() {
        let (scan, adapter) = scan(false);

        let connection = scan.connect("device", in_ten_seconds()).await.unwrap();
        assert!(adapter.calls().is_empty());
        scan.turn().await.start().await.unwrap();
        assert!(scan.turn().await.stop().await);
        assert_eq!(adapter.calls(), ["start", "stop"]);

        drop(connection);
        settle().await;
        assert_eq!(adapter.calls(), ["start", "stop"]);
    }

    #[tokio::test(start_paused = true)]
    async fn connections_to_the_same_device_run_one_at_a_time() {
        let (scan, _adapter) = scan(true);
        let first = scan.connect("device", in_ten_seconds()).await.unwrap();

        let mut second = Box::pin(scan.connect("device", in_ten_seconds()));
        assert!(poll!(&mut second).is_pending());
        // another device is not held back
        assert!(scan.connect("other", in_ten_seconds()).await.is_ok());

        drop(first);
        assert!(second.await.is_ok());
    }

    #[tokio::test(start_paused = true)]
    async fn a_connection_gives_up_at_its_deadline() {
        let (scan, _adapter) = scan(true);
        let first = scan.connect("device", in_ten_seconds()).await.unwrap();
        let started = Instant::now();

        let deadline = started + Duration::from_secs(5);
        assert!(scan.connect("device", deadline).await.is_err());
        assert_eq!(started.elapsed(), Duration::from_secs(5));

        drop(first);
        assert!(scan.connect("device", in_ten_seconds()).await.is_ok());
    }

    // A connection that gave up must not keep the device marked as connecting, or
    // the scan running for it.
    #[tokio::test(start_paused = true)]
    async fn a_connection_that_gave_up_waiting_for_the_turn_leaves_nothing_behind() {
        let (scan, adapter) = scan(true);
        let turn = scan.turn().await;

        let deadline = Instant::now() + Duration::from_secs(5);
        assert!(scan.connect("device", deadline).await.is_err());
        drop(turn);
        settle().await;
        assert!(adapter.calls().is_empty());

        assert!(scan.connect("device", in_ten_seconds()).await.is_ok());
    }
}
