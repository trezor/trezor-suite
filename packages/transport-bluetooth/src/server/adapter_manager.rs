use btleplug::api::{Central, CentralEvent, CentralState, Manager as _};
use btleplug::platform::{Adapter, Manager};
use dashmap::DashMap;
use futures::StreamExt;
use log::info;
use std::fmt::{self, Debug, Formatter};
use std::sync::Arc;
use tokio::sync::{broadcast, Mutex};
use tokio::task::JoinHandle;
use tokio::time::{sleep, Duration};

use crate::server::device::{DeviceConnectionStatus, TrezorDevice};
use crate::server::types::{AdapterState, ChannelMessage, NotificationEvent};
use crate::server::utils;

#[derive(Clone)]
pub struct AdapterManager {
    manager: Manager,
    adapter: Arc<Mutex<Option<Adapter>>>,
    adapter_state: Arc<Mutex<AdapterState>>,
    adapter_watcher: Arc<Mutex<AdapterWatcher>>,
    // is_scanning: bool, // TODO
    peripherals: Arc<Mutex<DashMap<String, TrezorDevice>>>,
}

struct AdapterWatcher {
    stream: Option<JoinHandle<()>>,
    watcher: Option<JoinHandle<()>>,
    scanning_update: Option<JoinHandle<()>>,
    listeners: Vec<broadcast::Sender<ChannelMessage>>,
}

impl Debug for AdapterManager {
    fn fmt(&self, f: &mut Formatter) -> fmt::Result {
        write!(f, "AdapterManager")
    }
}

impl AdapterManager {
    pub async fn new() -> Result<Self, Box<dyn std::error::Error>> {
        let peripherals = Arc::new(Mutex::new(DashMap::new()));
        let manager = Manager::new().await.expect("Failed to initialize Manager");
        let adapter = Arc::new(Mutex::new(None));
        let adapter_state = Arc::new(Mutex::new(AdapterState::Unknown));
        let adapter_watcher = Arc::new(Mutex::new(AdapterWatcher {
            watcher: None,
            stream: None,
            scanning_update: None,
            listeners: Vec::new(),
        }));

        Ok(Self {
            manager,
            adapter,
            adapter_state,
            adapter_watcher,
            peripherals,
        })
    }

    pub async fn enumerate(&self) -> Vec<TrezorDevice> {
        // TODO: enumerate adapter, remove local diff
        return self.get_devices().await;
    }

    pub async fn get_adapter(&self) -> Result<Option<Adapter>, Box<dyn std::error::Error>> {
        let current = self.adapter.lock().await;
        let adapter_found = current.clone();
        drop(current);

        if adapter_found.is_some() {
            return Ok(adapter_found);
        }

        // TODO: check if loader already exists

        let adapter = self.try_init_adapter().await;
        if adapter.is_none() {
            self.start_adapter_loader().await;
        }

        Ok(adapter)
    }

    async fn init_adapter(&self, adapter: Adapter) -> Option<Adapter> {
        let state = adapter.adapter_state().await.unwrap();
        info!("Adapter found with state {:?}", state);
        self.set_adapter_state(AdapterState::from(state.clone()))
            .await;
        if state == CentralState::Unknown {
            // permissions was declined just now.
            // it will throw "PermissionDenied" in further call
            #[cfg(target_os = "macos")]
            {
                self.set_adapter_state(AdapterState::PermissionDenied).await;
            }
            self.dispatch_adapter_event().await;

            return None;
        }

        self.dispatch_adapter_event().await;

        let mut adp = self.adapter.lock().await;
        *adp = Some(adapter.clone());
        drop(adp);

        if let Err(e) = self.start_events_stream().await {
            println!("Failed to start_events_stream: {:?}", e);
        }

        Some(adapter)
    }

    // NOTE: btleplug `manager.adapters()` system specific behavior if CentralState is poweredOff
    // let manager = Manager::new().await.expect("BLEManager error");
    // - windows and mac (?) create new stateless instance of the Adapter every time manager.adapters() is called
    // - linux keep reference(s) for once initialized adapters
    // - linux throws error if adapter is disabled, or returns adapters array empty
    // - windows and macos always returns the Adapter object.
    // - macos pending until permission is granted, does not throw any timeout
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
        let mut state = self.adapter_watcher.lock().await;
        // If there's already a watcher, return early
        if state.watcher.is_some() {
            info!("Adapter loader already running");
            return ();
        }

        info!("Adapter loader start");
        // create thread
        let adapter_mutex = self.adapter.clone();
        let self_clone = self.clone();
        let watcher = tokio::spawn(async move {
            loop {
                info!("Adapter loader waiting...");
                sleep(Duration::from_secs(2)).await;

                let adapter = adapter_mutex.lock().await;
                let adapter_found = adapter.is_some();
                drop(adapter); // unlock

                if adapter_found {
                    break;
                }

                let adapter = self_clone.try_init_adapter().await;
                if adapter.is_some() {
                    break;
                }
            }

            let mut state = self_clone.adapter_watcher.lock().await;
            state.watcher = None;
            drop(state);

            info!("Adapter loader end");
        });

        // store thread
        state.watcher = Some(watcher);
    }

    async fn set_adapter_state(&self, value: AdapterState) {
        let mut state = self.adapter_state.lock().await;
        *state = value;
    }

    pub async fn get_adapter_state(&self) -> AdapterState {
        self.adapter_state.lock().await.clone()
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

    async fn send_to_listeners(&self, message: ChannelMessage) {
        // info!("send_to_listeners: {:?}", message.clone());
        let state = self.adapter_watcher.lock().await;
        let listeners = state.listeners.clone();
        drop(state);

        for listener in &listeners {
            if let Err(e) = listener.send(message.clone()) {
                println!("Failed to send message: {:?}", e);
            }
        }
    }

    async fn add_device(&self, device: TrezorDevice) {
        let id = device.get_id();
        let devices = self.get_devices().await;
        let outdated = devices
            .into_iter()
            .find(|d| d.get_address() == device.get_address() && d.get_id() != id);
        let peripherals = self.peripherals.lock().await;
        if let Some(outdated) = outdated {
            println!("Remove outdated device: {:?}", outdated);
            peripherals.remove(&outdated.get_id());

            // self.dispatch_notification(NotificationEvent::DeviceRemoved {
            //     id: outdated.get_id(),
            // }).await;
        }
        peripherals.insert(id, device);
    }

    async fn prune_devices(&self) -> Result<(), Box<dyn std::error::Error>> {
        let adapter = self.adapter.lock().await;
        if adapter.is_none() {
            return Err("Adapter not found".into());
        }
        let adapter = adapter.as_ref().unwrap();

        let devices = self.get_devices().await;
        let mut removed: Vec<String> = Vec::new();
        let mut disconnected: Vec<String> = Vec::new();
        let peripherals = self.peripherals.lock().await;
        for device in devices {
            // check if known device still exists on Adapter
            let id = device.get_id();
            if let Err(_) = utils::get_peripheral_by_id(adapter, id.clone()).await {
                peripherals.remove(&id);
                removed.push(id.to_string());

                match device.get_connection_status() {
                    DeviceConnectionStatus::Connected => {
                        disconnected.push(id.to_string());
                    }
                    _ => {}
                }
            }
        }
        drop(peripherals); // unlock

        if disconnected.len() > 0 {
            let devices = self.get_devices().await;
            for id in removed.iter() {
                self.dispatch_notification(NotificationEvent::DeviceDisconnected {
                    id: id.clone(),
                    devices: devices.clone(),
                })
                .await;
            }
        }

        for id in removed.iter() {
            self.dispatch_notification(NotificationEvent::DeviceRemoved { id: id.clone() })
                .await;
        }

        Ok(())
    }

    pub async fn get_device(&self, id: String) -> Option<TrezorDevice> {
        let peripherals = self.peripherals.lock().await;
        if let Some(device) = peripherals.get(&id) {
            return Some(device.clone());
        }
        None
    }

    pub async fn get_devices(&self) -> Vec<TrezorDevice> {
        let peripherals = self.peripherals.lock().await;
        let mut devices: Vec<TrezorDevice> = peripherals
            .iter()
            .map(|entry| entry.value().clone())
            .collect();
        devices.sort_by(|a, b| a.get_timestamp().cmp(&b.get_timestamp()));

        return devices;
    }

    async fn start_events_stream(&self) -> Result<(), Box<dyn std::error::Error>> {
        let adapter = self.adapter.lock().await;
        if adapter.is_none() {
            return Err("Adapter not found")?;
        }

        let adp = adapter.as_ref().unwrap();
        // platform specific, on linux this will start scanning
        let mut events = adp.events().await?;

        // subscribe to broadcast channel
        // let mut receiver = sender.subscribe();

        let adapter = adp.clone();
        let self_clone = self.clone();
        let _stream_task = tokio::spawn(async move {
            while let Some(event) = events.next().await {
                match event {
                    CentralEvent::StateUpdate(state) => {
                        info!("StateUpdate: {:?}", state);
                        self_clone
                            .set_adapter_state(AdapterState::from(state))
                            .await;
                        self_clone.dispatch_adapter_event().await;
                    }
                    CentralEvent::DeviceDiscovered(id) => {
                        let evt = utils::scan_filter(&adapter, &id).await;
                        if evt.is_some() {
                            let peripheral =
                                adapter.peripheral(&id).await.expect("Peripheral missing");
                            let device = TrezorDevice::new(peripheral).await.unwrap();
                            self_clone.add_device(device.clone()).await;
                            let _ = self_clone.prune_devices().await;

                            let devices = self_clone.get_devices().await;
                            self_clone
                                .dispatch_notification(NotificationEvent::DeviceDiscovered {
                                    id: id.to_string(),
                                    timestamp: 0,
                                    devices,
                                })
                                .await;
                        }
                    }
                    CentralEvent::DeviceUpdated(id) => {
                        let device = self_clone.get_device(id.to_string()).await;
                        if device.is_some() {
                            let peripheral =
                                adapter.peripheral(&id).await.expect("Peripheral not found");
                            let mut device = device.unwrap();
                            let mut emit_update = false;
                            if let Ok(updated) = device.update_properties(peripheral).await {
                                emit_update = updated;
                            }

                            if emit_update {
                                let id = id.to_string();
                                let devices = self_clone.get_devices().await;
                                self_clone
                                    .dispatch_notification(NotificationEvent::DeviceUpdated {
                                        id,
                                        devices,
                                    })
                                    .await;
                            }
                        }
                    }
                    CentralEvent::ServicesAdvertisement { id, services: _ } => {
                        let device = self_clone.get_device(id.to_string()).await;
                        if device.is_some() {
                            // info!("ServicesAdvertisement: {:?}", services);
                        }
                    }
                    CentralEvent::ServiceDataAdvertisement {
                        id,
                        service_data: _,
                    } => {
                        let device = self_clone.get_device(id.to_string()).await;
                        if device.is_some() {
                            // info!("ServiceDataAdvertisement: {:?} {:?}", id, service_data);
                        }
                    }
                    CentralEvent::ManufacturerDataAdvertisement {
                        id,
                        manufacturer_data: _,
                    } => {
                        let device = self_clone.get_device(id.to_string()).await;
                        if device.is_some() {
                            // info!("ManufacturerDataAdvertisement: {:?} {:?}", id, manufacturer_data);
                        }
                    }
                    CentralEvent::DeviceDisconnected(id) => {
                        if let Some(device) = self_clone.get_device(id.to_string()).await {
                            info!("DeviceDisconnected: {:?} : {:?}", id, device);

                            // TODO: make util from this
                            let peripheral = match adapter.peripheral(&id).await {
                                Ok(peripheral) => Some(peripheral),
                                Err(_error) => None,
                            };
                            let _ = device.update_connection(peripheral).await;

                            let devices = self_clone.get_devices().await;
                            self_clone
                                .dispatch_notification(NotificationEvent::DeviceDisconnected {
                                    id: id.to_string(),
                                    devices,
                                })
                                .await;
                        }
                    }
                    // CentralEvent::DeviceConnected fires up too early. Could be connected but in pairing process
                    // this event is emitted inside method/connect_device.rs
                    CentralEvent::DeviceConnected(id) => {
                        info!("DeviceConnected: {:?}", id);
                        if let Some(device) = self_clone.get_device(id.to_string()).await {
                            let state = device.get_connection_status();
                            match state {
                                DeviceConnectionStatus::Disconnected => {
                                    // device was connected manually using system ui
                                    device.set_connection_status(DeviceConnectionStatus::Connected);
                                    let devices = self_clone.get_devices().await;
                                    self_clone
                                        .dispatch_notification(NotificationEvent::DeviceConnected {
                                            id: id.to_string(),
                                            devices,
                                        })
                                        .await;
                                }
                                _ => {}
                            }
                        }
                    }
                }
            }
        });

        Ok(())
    }

    pub async fn add_listener(&self, listener: broadcast::Sender<ChannelMessage>) {
        let mut state = self.adapter_watcher.lock().await;
        state.listeners.push(listener.clone());
    }

    pub async fn remove_listener(&self, listener: &broadcast::Sender<ChannelMessage>) {
        let mut state = self.adapter_watcher.lock().await;
        state
            .listeners
            .retain(|item| item.same_channel(listener) == false);

        if state.listeners.is_empty() {
            if let Some(watcher) = state.watcher.take() {
                info!("stop Adapter loader");
                watcher.abort();
                // state.watcher = None;
            }
        }
    }
}
