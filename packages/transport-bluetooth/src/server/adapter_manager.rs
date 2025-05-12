use btleplug::{
    api::{Central, CentralEvent, CentralState, Manager as _, Peripheral as _},
    platform::{Adapter, Manager, Peripheral, PeripheralId},
};
use dashmap::DashMap;
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
    types::{AdapterState, ChannelMessage, NotificationEvent},
    utils, ConnectionBroadcast,
};

#[derive(Clone)]
pub struct AdapterManager {
    manager: Manager,
    adapter: Arc<Mutex<Option<Adapter>>>,
    adapter_state: Arc<Mutex<AdapterState>>,
    manager_state: Arc<Mutex<ManagerState>>,
}

struct ManagerState {
    adapter_loader: Option<JoinHandle<()>>,
    is_scanning: bool,
    listeners: Vec<ConnectionBroadcast>,
    peripherals: DashMap<String, TrezorDevice>,
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
        }));

        Ok(Self {
            manager,
            adapter,
            adapter_state,
            manager_state,
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

    async fn add_device(&self, id: &PeripheralId) -> Result<TrezorDevice, AdapterError> {
        let peripheral = self.get_peripheral_or_die(&id.to_string()).await?;
        let device = match TrezorDevice::new(peripheral).await {
            Ok(device) => device,
            Err(_) => {
                return Err(AdapterError::AdapterMissing);
            }
        };

        let state = self.manager_state.lock().await;
        state.peripherals.insert(device.get_id(), device.clone());

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
                    disconnected.push(id);
                }
            }
        }
        state.peripherals = peripherals;
        drop(state); // unlock state for future use

        // notify about each disconnected device
        let devices = self.get_devices().await;
        for id in removed.iter() {
            self.dispatch_notification(NotificationEvent::DeviceDisconnected {
                id: id.clone(),
                devices: devices.clone(),
            })
            .await;
        }

        // notify about each removed device
        for id in removed.iter() {
            self.dispatch_notification(NotificationEvent::DeviceRemoved { id: id.clone() })
                .await;
        }

        Ok(devices)
    }

    // get TrezorDevice from AdapterManager or None
    async fn get_device(&self, id: &PeripheralId) -> Option<TrezorDevice> {
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
                        }
                    }
                    CentralEvent::DeviceUpdated(id) => {
                        if let Some(device) = self_ref.get_device(&id).await {
                            info!("DeviceUpdated {:?} : {:?}", id, device);
                            let devices = self_ref.get_devices().await;
                            self_ref
                                .dispatch_notification(NotificationEvent::DeviceUpdated {
                                    id: id.to_string(),
                                    devices,
                                })
                                .await;
                        }
                    }
                    CentralEvent::DeviceDisconnected(id) => {
                        if let Some(device) = self_ref.get_device(&id).await {
                            info!("DeviceDisconnected: {:?} : {:?}", id, device);
                            // TODO: disconnect TrezorDevice
                            let devices = self_ref.get_devices().await;
                            self_ref
                                .dispatch_notification(NotificationEvent::DeviceDisconnected {
                                    id: id.to_string(),
                                    devices,
                                })
                                .await;
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
        let mut state = self.manager_state.lock().await;
        state.listeners.retain(|item| !item.same_channel(listener));

        if state.listeners.is_empty() {
            if let Some(adapter_loader) = state.adapter_loader.take() {
                adapter_loader.abort();
            }
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
