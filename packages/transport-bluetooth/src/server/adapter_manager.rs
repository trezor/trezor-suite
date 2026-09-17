use btleplug::{
    api::{Central, CentralEvent, CentralState, Manager as _, Peripheral as _},
    platform::{Adapter, Manager, Peripheral, PeripheralId},
};
use dashmap::{DashMap, DashSet};
use futures::StreamExt;
use log::info;
use std::{
    fmt::{self, Debug, Formatter},
    sync::Arc,
};
use tokio::{
    sync::Mutex,
    task::JoinHandle,
    time::{sleep, Duration},
};

use crate::server::{
    device::{DeviceConnectionStatus, TrezorDevice},
    notification_registry::{NotificationRegistry, RemovedStream},
    types::{
        AbortProcess, AdapterState, ChannelMessage, KnownDevice, NotificationCharacteristic,
        NotificationEvent,
    },
    utils, ConnectionBroadcast,
};

#[derive(Clone)]
pub struct ServicelessDevice {
    update_count: u128,
    timestamp: u128,
}

#[derive(Clone)]
pub struct AdapterManager {
    manager: Manager,
    adapter: Arc<Mutex<Option<Adapter>>>,
    adapter_state: Arc<Mutex<AdapterState>>,
    manager_state: Arc<Mutex<ManagerState>>,
    discovered_id: DashSet<String>,
    serviceless_peripherals: DashMap<String, ServicelessDevice>,
    serviceless_peripherals_prune_ts: Arc<Mutex<u128>>,
    notification_streams: NotificationRegistry,
}

struct ManagerState {
    adapter_loader: Option<JoinHandle<()>>,
    is_scanning: bool,
    listeners: Vec<ConnectionBroadcast>,
    peripherals: DashMap<String, TrezorDevice>,
    known_peripherals: Vec<KnownDevice>,
}

impl Debug for AdapterManager {
    fn fmt(&self, f: &mut Formatter) -> fmt::Result {
        write!(f, "AdapterManager")
    }
}

#[derive(Debug, thiserror::Error)]
pub enum AdapterError {
    #[error("Adapter missing")]
    AdapterMissing,

    #[error("Adapter disabled")]
    AdapterDisabled,

    #[error("PeripheralNotFound")]
    PeripheralNotFound,

    #[error("PeripheralNotConnected")]
    PeripheralNotConnected,

    #[error("PeripheralCharacteristicNotFound")]
    PeripheralCharacteristicNotFound,

    #[error("PeripheralDiscovered")]
    PeripheralDiscovered,

    #[error("Peripheral create error")]
    PeripheralNotCreated,

    #[error("Btleplug error: {0}")]
    BtleplugError(#[from] btleplug::Error),
}

impl AdapterManager {
    pub async fn new() -> Result<Self, AdapterError> {
        let manager = Manager::new().await?;
        let adapter = Arc::new(Mutex::new(None));
        let adapter_state = Arc::new(Mutex::new(AdapterState::Unknown));
        let manager_state = Arc::new(Mutex::new(ManagerState {
            adapter_loader: None,
            is_scanning: false,
            listeners: Vec::new(),
            peripherals: DashMap::new(),
            known_peripherals: Vec::new(),
        }));

        Ok(Self {
            manager,
            adapter,
            adapter_state,
            manager_state,
            discovered_id: DashSet::new(),
            serviceless_peripherals: DashMap::new(),
            serviceless_peripherals_prune_ts: Arc::new(Mutex::new(0)),
            notification_streams: NotificationRegistry::default(),
        })
    }

    // get current adapter or start loader if there is none
    pub async fn get_adapter(&self) -> Result<Option<Adapter>, AdapterError> {
        let adapter_guard = self.adapter.lock().await;
        let adapter = adapter_guard.clone();
        drop(adapter_guard); // unlock for try_init_adapter

        if adapter.is_some() {
            return Ok(adapter);
        }

        // adapter not found yet. start the loader
        let adapter = self.try_init_adapter().await;
        if adapter.is_none() {
            self.start_adapter_loader().await;
        }

        Ok(adapter)
    }

    pub async fn get_adapter_or_die(&self) -> Result<Adapter, AdapterError> {
        match self.adapter.lock().await.clone() {
            Some(adp) => Ok(adp),
            _ => Err(AdapterError::AdapterMissing),
        }
    }

    // called before each method. start adapter loader if necessary
    pub async fn get_powered_adapter_or_die(&self) -> Result<Adapter, AdapterError> {
        self.get_adapter().await?;

        let adapter = self.get_adapter_or_die().await?;
        match self.get_adapter_state().await {
            AdapterState::Enabled => Ok(adapter),
            _ => Err(AdapterError::AdapterDisabled),
        }
    }

    // called from try_init_adapter
    async fn init_adapter(&self, adapter: Adapter) -> Option<Adapter> {
        let state = match adapter.adapter_state().await {
            Ok(state) => state,
            Err(err) => {
                info!("Adapter state error {:?}", err);
                return None;
            }
        };
        info!("Adapter found with state {:?}", state);

        self.set_adapter_state(AdapterState::from(state.clone()))
            .await;

        if state == CentralState::Unknown {
            // permissions were declined just now.
            // it will throw "PermissionDenied" in further call
            #[cfg(target_os = "macos")]
            {
                self.set_adapter_state(AdapterState::PermissionDenied).await;
            }
            self.dispatch_adapter_event().await;

            return None;
        }

        self.dispatch_adapter_event().await;

        // store adapter
        let mut adp = self.adapter.lock().await;
        *adp = Some(adapter.clone());
        drop(adp); // unlock for start_events_stream

        if let Err(e) = self.start_events_stream().await {
            info!("Failed to start_events_stream: {:?}", e);

            return None;
        }

        Some(adapter)
    }

    // NOTE: btleplug `manager.adapters()` system specific behavior if CentralState is poweredOff
    // - windows and macos always returns the Adapter object.
    // - windows and macos creates new stateless instance of the Adapter every time manager.adapters() is called
    // - linux if adapter is disabled throws error or returns empty adapters array
    // - linux keeps reference(s) for once initialized adapters
    // - macos method is pending until permission is granted/rejected. does not throw any timeout ever
    // - macos throws specific error if bluetooth permission is denied
    async fn try_init_adapter(&self) -> Option<Adapter> {
        match self.manager.adapters().await {
            Ok(adapters) => match adapters.into_iter().nth(0) {
                Some(adapter) => self.init_adapter(adapter).await,
                None => {
                    self.set_adapter_state(AdapterState::Disabled).await;
                    self.dispatch_adapter_event().await;

                    None
                }
            },
            Err(error) => {
                info!("Adapter error {:?}", error);
                match error.to_string().as_str() {
                    "Permission denied" => {
                        // macos: CBManagerAuthorization(2) > PermissionDenied
                        self.set_adapter_state(AdapterState::PermissionDenied).await;
                    }
                    _ => {
                        self.set_adapter_state(AdapterState::Disabled).await;
                    }
                }
                self.dispatch_adapter_event().await;

                None
            }
        }
    }

    async fn start_adapter_loader(&self) {
        let mut state = self.manager_state.lock().await;
        // return early if adapter_loader is already set
        if state.adapter_loader.is_some() {
            info!("Adapter loader already running");
            return;
        }

        info!("Adapter loader start");
        // create new thread and try to init the adapter
        let self_ref = self.clone();
        let adapter_loader = tokio::spawn(async move {
            loop {
                info!("Adapter loader waiting...");
                sleep(Duration::from_secs(2)).await;

                // check again, adapter could be assigned from the other thread while we waiting
                let adapter_guard = self_ref.adapter.lock().await;
                let adapter = adapter_guard.is_some();
                drop(adapter_guard); // unlock for try_init_adapter

                if adapter {
                    break;
                }

                if self_ref.try_init_adapter().await.is_some() {
                    break;
                }
            }

            let mut state = self_ref.manager_state.lock().await;
            state.adapter_loader = None;

            info!("Adapter loader end");
        });

        // store thread
        state.adapter_loader = Some(adapter_loader);
    }

    async fn set_adapter_state(&self, value: AdapterState) {
        let mut state = self.adapter_state.lock().await;
        *state = value;
    }

    pub async fn get_adapter_state(&self) -> AdapterState {
        self.adapter_state.lock().await.clone()
    }

    pub async fn is_scanning(&self) -> bool {
        let state = self.manager_state.lock().await;
        state.is_scanning
    }

    pub async fn set_scanning(&self, value: bool) {
        let mut state = self.manager_state.lock().await;
        state.is_scanning = value;
    }

    pub async fn set_known_peripherals(&self, value: Vec<KnownDevice>) {
        let mut state = self.manager_state.lock().await;
        state.known_peripherals = value;
    }

    async fn is_known_peripheral(&self, id: &str) -> bool {
        let state = self.manager_state.lock().await;

        state.known_peripherals.iter().any(|x| x.id == id)
    }

    async fn add_device(&self, id: &PeripheralId) -> Result<TrezorDevice, AdapterError> {
        let state = self.manager_state.lock().await;
        if state.peripherals.contains_key(&id.to_string()) {
            return Err(AdapterError::PeripheralDiscovered);
        }
        drop(state);

        let id = id.to_string();
        let peripheral = self.get_peripheral_or_die(&id).await?;
        let is_known = self.is_known_peripheral(&id).await;
        let device = match TrezorDevice::new(peripheral, is_known).await {
            Ok(device) => device,
            Err(_) => {
                return Err(AdapterError::PeripheralNotCreated);
            }
        };

        let state = self.manager_state.lock().await;
        state.peripherals.insert(device.get_id(), device.clone());
        self.discovered_id.insert(device.get_id());

        Ok(device)
    }

    // verify and clear current state
    // peripherals could be removed manually from the system UI
    async fn prune_devices(&self, device: TrezorDevice) -> Result<Vec<TrezorDevice>, AdapterError> {
        let devices = self.get_devices().await;
        let mut removed: Vec<String> = Vec::new();
        let mut disconnected: Vec<String> = Vec::new();

        let mut state = self.manager_state.lock().await;
        // find peripherals with the same addresses but different ids and remove them
        // see TrezorDevice.[id+address] description
        let device_id = device.get_id();
        let device_address = device.get_address();
        let peripherals = state.peripherals.clone();
        if let Some(outdated) = state
            .peripherals
            .iter()
            .find(|d| d.get_address() == device_address && d.get_id() != device_id)
        {
            let id = outdated.get_id();
            removed.push(id.clone());
            peripherals.remove(&id);
        }

        for device in devices {
            // check if known device still exists on the Adapter
            let id = device.get_id();
            if (self.get_peripheral_or_die(&id).await).is_err() {
                peripherals.remove(&id);
                removed.push(id.clone());
                // check if device was connected
                if let DeviceConnectionStatus::Connected = device.get_connection_status() {
                    let _ = device.disconnect().await;
                    disconnected.push(id);
                }
            }
        }
        state.peripherals = peripherals;
        drop(state); // unlock state for future use

        // notify about each disconnected device
        let devices = self.get_devices().await;
        for id in disconnected.iter() {
            self.dispatch_notification(NotificationEvent::DeviceDisconnected {
                id: id.clone(),
                devices: devices.clone(),
            })
            .await;
        }

        // notify about each removed device
        for id in removed.iter() {
            self.discovered_id.remove(id);
            self.dispatch_notification(NotificationEvent::DeviceRemoved { id: id.clone() })
                .await;
        }

        Ok(devices)
    }

    fn is_discovered(&self, id: &PeripheralId) -> bool {
        self.discovered_id.contains(&id.to_string())
    }

    // get TrezorDevice from AdapterManager or None
    async fn get_device(&self, id: &PeripheralId) -> Option<TrezorDevice> {
        if !self.is_discovered(id) {
            return None;
        }

        let state = self.manager_state.lock().await;
        if let Some(device) = state.peripherals.get(&id.to_string()) {
            return Some(device.clone());
        }

        None
    }

    // get TrezorDevice from AdapterManager or throw error
    pub async fn get_device_or_die(&self, id: String) -> Result<TrezorDevice, AdapterError> {
        let state = self.manager_state.lock().await;
        if let Some(device) = state.peripherals.get(&id) {
            return Ok(device.clone());
        }

        Err(AdapterError::PeripheralNotFound)
    }

    // get Peripheral from btleplug Adapter
    pub async fn get_peripheral_or_die(&self, id: &String) -> Result<Peripheral, AdapterError> {
        let adapter = self.get_adapter_or_die().await?;
        let peripherals = adapter.peripherals().await?;
        let id_str = id.to_string();
        let peripheral = peripherals
            .into_iter()
            .find(|x| x.id().to_string() == id_str);

        match peripheral {
            Some(device) => Ok(device),
            None => Err(AdapterError::PeripheralNotFound),
        }
    }

    // return array of TrezorDevice sorted by discovery_timestamp
    pub async fn get_devices(&self) -> Vec<TrezorDevice> {
        let state = self.manager_state.lock().await;
        let mut devices: Vec<TrezorDevice> = state
            .peripherals
            .iter()
            .map(|entry| entry.value().clone())
            .collect();
        devices.sort_by(|a, b| {
            a.get_discovery_timestamp()
                .cmp(&b.get_discovery_timestamp())
        });

        devices
    }

    async fn add_serviceless_device(
        &self,
        id: &PeripheralId,
        update_count: u128,
    ) -> Result<(), AdapterError> {
        let peripheral = self.get_peripheral_or_die(&id.to_string()).await?;
        if let Ok(Some(props)) = peripheral.properties().await {
            if let Some(_name) = props.local_name {
                let device = ServicelessDevice {
                    update_count,
                    timestamp: utils::get_timestamp(),
                };

                self.serviceless_peripherals
                    .insert(id.to_string(), device.clone());
            }
        }

        Ok(())
    }

    pub async fn update_serviceless_device(&self, id: &PeripheralId) -> Result<(), AdapterError> {
        let device = self.serviceless_peripherals.get(&id.to_string());
        if device.is_none() {
            return Ok(());
        }

        let update_count = device.unwrap().update_count;
        self.serviceless_peripherals.remove(&id.to_string());
        if self.is_discovered(id) {
            return Ok(());
        }

        let peripheral = self.get_peripheral_or_die(&id.to_string()).await?;
        if peripheral.services().is_empty() {
            let _ = peripheral.discover_services().await;
        }

        let adapter = self.get_adapter_or_die().await?;
        if let Some(_device) = utils::scan_filter(&adapter, id).await {
            if let Ok(_device) = self.add_device(id).await {
                let devices = self.get_devices().await;
                self.dispatch_notification(NotificationEvent::DeviceDiscovered {
                    id: id.to_string(),
                    devices,
                })
                .await;
            }
        } else if update_count < 1000 && peripheral.services().is_empty() {
            let _ = self.add_serviceless_device(id, update_count + 1).await;
        }

        // prune outdated data
        let threshold = 30_000;
        let now = utils::get_timestamp();
        let mut ts = self.serviceless_peripherals_prune_ts.lock().await;
        if now - threshold > *ts {
            let threshold = now - threshold;
            self.serviceless_peripherals
                .retain(|_key, p| p.timestamp >= threshold);
            *ts = now;
        }

        Ok(())
    }

    async fn start_events_stream(&self) -> Result<(), AdapterError> {
        let adapter = self.get_adapter_or_die().await?;
        // linux this will start scanning after adp.events subscription
        // windows + mac will start after actual adapter.start_scan
        let mut events = adapter.events().await?;
        let self_ref = self.clone();
        tokio::spawn(async move {
            while let Some(event) = events.next().await {
                match event {
                    CentralEvent::StateUpdate(state) => {
                        info!("CentralEvent::StateUpdate {:?}", state);
                        self_ref.set_adapter_state(AdapterState::from(state)).await;
                        self_ref.dispatch_adapter_event().await;
                    }
                    CentralEvent::DeviceDiscovered(id) => {
                        if let Some(device) = utils::scan_filter(&adapter, &id).await {
                            info!("DeviceDiscovered {:?} : {:?}", id, device);
                            if let Ok(device) = self_ref.add_device(&id).await {
                                if let Ok(devices) = self_ref.prune_devices(device).await {
                                    self_ref
                                        .dispatch_notification(
                                            NotificationEvent::DeviceDiscovered {
                                                id: id.to_string(),
                                                devices,
                                            },
                                        )
                                        .await;
                                }
                            }
                        } else {
                            let _ = self_ref.add_serviceless_device(&id, 0).await;
                        }
                    }
                    CentralEvent::DeviceUpdated(id) => {
                        if let Some(mut device) = self_ref.get_device(&id).await {
                            let mut emit_update = false;
                            if let Ok(peripheral) =
                                self_ref.get_peripheral_or_die(&id.to_string()).await
                            {
                                if let Ok(updated) = device.update_properties(peripheral).await {
                                    emit_update = updated;
                                }
                            };

                            if emit_update {
                                info!("DeviceUpdated {:?} : {:?}", id, device);
                                let devices = self_ref.get_devices().await;
                                self_ref
                                    .dispatch_notification(NotificationEvent::DeviceUpdated {
                                        id: id.to_string(),
                                        devices,
                                    })
                                    .await;
                            }
                        } else {
                            let _ = self_ref.update_serviceless_device(&id).await;
                        }
                    }
                    CentralEvent::DeviceDisconnected(id) => {
                        // The BLE subscriptions died with the connection, abort
                        // the notification streams reading from this peripheral.
                        self_ref
                            .close_notification_streams(None, Some(&id.to_string()), None)
                            .await;

                        if let Some(mut device) = self_ref.get_device(&id).await {
                            info!("DeviceDisconnected: {:?} : {:?}", id, device);

                            self_ref
                                .send_to_listeners(ChannelMessage::Abort(
                                    AbortProcess::DeviceDisconnected(id.to_string()),
                                ))
                                .await;

                            let mut emit_event = false;
                            if let Ok(peripheral) =
                                self_ref.get_peripheral_or_die(&id.to_string()).await
                            {
                                if let Ok(updated) = device.update_properties(peripheral).await {
                                    emit_event = updated;
                                }
                            }

                            if let DeviceConnectionStatus::Connected =
                                device.get_connection_status()
                            {
                                let _ = device.disconnect().await;
                                emit_event = true;
                            }

                            if emit_event {
                                let devices = self_ref.get_devices().await;
                                self_ref
                                    .dispatch_notification(NotificationEvent::DeviceDisconnected {
                                        id: id.to_string(),
                                        devices,
                                    })
                                    .await;
                            }
                        }
                    }
                    // CentralEvent::DeviceConnected fires up too early. Device may be connected but in pairing process
                    CentralEvent::DeviceConnected(id) => {
                        if let Some(device) = self_ref.get_device(&id).await {
                            info!("DeviceConnected: {:?} : {:?}", id, device);
                            if let DeviceConnectionStatus::Disconnected =
                                device.get_connection_status()
                            {
                                // device was connected manually using system UI
                                device.set_connection_status(DeviceConnectionStatus::Connected);
                                let devices = self_ref.get_devices().await;
                                self_ref
                                    .dispatch_notification(NotificationEvent::DeviceConnected {
                                        id: id.to_string(),
                                        devices,
                                    })
                                    .await;
                            }
                        }
                    }
                    CentralEvent::ManufacturerDataAdvertisement {
                        id,
                        manufacturer_data: _,
                    } => {
                        // log is useful but noisy
                        // info!("ManufacturerDataAdvertisement: {:?} : {:?}", id, manufacturer_data);
                        let _ = self_ref.update_serviceless_device(&id).await;
                    }
                    CentralEvent::ServicesAdvertisement { id, services: _ } => {
                        // info!("ServicesAdvertisement: {:?} : {:?}", id, services);
                        let _ = self_ref.update_serviceless_device(&id).await;
                    }
                    _ => {}
                }
            }
        });

        Ok(())
    }

    pub async fn add_listener(&self, listener: ConnectionBroadcast) {
        let mut state = self.manager_state.lock().await;
        state.listeners.push(listener.clone());
    }

    pub async fn remove_listener(&self, listener: &ConnectionBroadcast) {
        // Notification streams forward to this connection only, so they must
        // not outlive it no matter how many other clients stay connected.
        self.close_notification_streams(Some(listener.get_peer()), None, None)
            .await;

        let mut state = self.manager_state.lock().await;
        state.listeners.retain(|item| !item.same_channel(listener));

        if !state.listeners.is_empty() {
            return;
        }

        if let Some(adapter_loader) = state.adapter_loader.take() {
            adapter_loader.abort();
        }

        let was_scanning = state.is_scanning;
        state.is_scanning = false;
        drop(state); // unlock for get_adapter_or_die

        // Scanning must not outlive the last client, even when the client
        // that originally started it disconnected earlier.
        if was_scanning {
            info!("All clients disconnected, stopping scanning");
            if let Ok(adapter) = self.get_adapter_or_die().await {
                if let Err(err) = adapter.stop_scan().await {
                    info!("remove_listener/adapter.stop_scan: {err}");
                }
            }
        }
    }

    pub fn register_notification_stream(
        &self,
        peer: String,
        device_id: String,
        characteristic: NotificationCharacteristic,
        task: JoinHandle<()>,
    ) {
        self.notification_streams
            .register(peer, device_id, characteristic, task);
    }

    /// Aborts matching notification stream tasks and releases BLE
    /// subscriptions that lost their last stream. `None` filters match
    /// everything.
    pub async fn close_notification_streams(
        &self,
        peer: Option<&str>,
        device_id: Option<&str>,
        characteristic: Option<&NotificationCharacteristic>,
    ) {
        let removed = self
            .notification_streams
            .remove(peer, device_id, characteristic);

        for stream in removed {
            info!(
                "{} {:?} stream terminated",
                stream.device_id, stream.characteristic
            );
            if stream.unsubscribe {
                self.unsubscribe_characteristic(&stream).await;
            }
        }
    }

    // Best effort BLE-level unsubscribe. The peripheral may already be gone
    // (device disconnected), errors are only logged.
    async fn unsubscribe_characteristic(&self, stream: &RemovedStream) {
        let Ok(peripheral) = self.get_peripheral_or_die(&stream.device_id).await else {
            return;
        };
        let uuid = stream.characteristic.to_uuid();
        let Some(characteristic) = peripheral
            .characteristics()
            .into_iter()
            .find(|c| c.uuid == uuid)
        else {
            return;
        };
        if let Err(err) = peripheral.unsubscribe(&characteristic).await {
            info!(
                "Unsubscribe {} {:?} error: {err}",
                stream.device_id, stream.characteristic
            );
        }
    }

    async fn dispatch_adapter_event(&self) {
        let state = self.adapter_state.lock().await.clone();
        self.dispatch_notification(NotificationEvent::AdapterStateChanged { state })
            .await;
    }

    pub async fn dispatch_notification(&self, message: NotificationEvent) {
        self.send_to_listeners(ChannelMessage::Notification(message.clone()))
            .await;
    }

    // send to all registered peers
    async fn send_to_listeners(&self, message: ChannelMessage) {
        // info!("send_to_listeners: {:?}", message.clone());
        let state = self.manager_state.lock().await;
        let listeners = state.listeners.clone();
        drop(state);

        for listener in &listeners {
            listener.send(message.clone());
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::sync::atomic::{AtomicBool, Ordering};

    // Sets the flag when the task future is dropped, i.e. when it was aborted.
    struct SetOnDrop(Arc<AtomicBool>);
    impl Drop for SetOnDrop {
        fn drop(&mut self) {
            self.0.store(true, Ordering::SeqCst);
        }
    }

    fn pending_stream_task(aborted: Arc<AtomicBool>) -> JoinHandle<()> {
        // The guard is captured by the future itself, so it is dropped even
        // when the task is aborted before its first poll.
        let guard = SetOnDrop(aborted);
        tokio::spawn(async move {
            let _guard = guard;
            std::future::pending::<()>().await;
        })
    }

    // Finding 2 of https://github.com/trezor/trezor-suite/issues/31948:
    // a disconnecting client must not leave its notification stream task
    // alive just because another client is still connected.
    #[tokio::test]
    async fn remove_listener_aborts_streams_of_disconnected_client_only() {
        let manager = AdapterManager::new().await.expect("manager");
        let client_a = ConnectionBroadcast::new("a".to_string()).expect("broadcast");
        let client_b = ConnectionBroadcast::new("b".to_string()).expect("broadcast");
        manager.add_listener(client_a.clone()).await;
        manager.add_listener(client_b.clone()).await;

        let aborted_a = Arc::new(AtomicBool::new(false));
        let aborted_b = Arc::new(AtomicBool::new(false));
        manager.register_notification_stream(
            "a".to_string(),
            "dev1".to_string(),
            NotificationCharacteristic::Read,
            pending_stream_task(aborted_a.clone()),
        );
        manager.register_notification_stream(
            "b".to_string(),
            "dev1".to_string(),
            NotificationCharacteristic::Read,
            pending_stream_task(aborted_b.clone()),
        );

        // Client "a" disconnects while client "b" stays connected.
        manager.remove_listener(&client_a).await;
        // Give the runtime a moment to drop the aborted task.
        sleep(Duration::from_millis(50)).await;

        assert!(aborted_a.load(Ordering::SeqCst));
        assert!(!aborted_b.load(Ordering::SeqCst));
    }

    // Finding 3 of https://github.com/trezor/trezor-suite/issues/31948:
    // scanning must stop with the last client, not with the client that
    // originally started it.
    #[tokio::test]
    async fn scanning_stops_with_the_last_listener() {
        let manager = AdapterManager::new().await.expect("manager");
        let client_a = ConnectionBroadcast::new("a".to_string()).expect("broadcast");
        let client_b = ConnectionBroadcast::new("b".to_string()).expect("broadcast");
        manager.add_listener(client_a.clone()).await;
        manager.add_listener(client_b.clone()).await;
        manager.set_scanning(true).await;

        // The client that started the scan disconnects first.
        manager.remove_listener(&client_a).await;
        assert!(manager.is_scanning().await);

        // The last client disconnects.
        manager.remove_listener(&client_b).await;
        assert!(!manager.is_scanning().await);
    }
}
