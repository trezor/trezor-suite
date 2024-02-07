use btleplug::api::{Central, CentralEvent, CentralState};
use btleplug::platform::{Adapter, Manager};
use dashmap::DashMap;
use futures::StreamExt;
use log::info;
use std::fmt::{self, Debug, Formatter};
use std::sync::Arc;
use tokio::sync::{broadcast, Mutex};
use tokio::task::JoinHandle;
use tokio::time::{sleep, Duration};

use crate::server::device::TrezorDevice;
use crate::server::types::{ChannelMessage, NotificationEvent};
use crate::server::utils;

#[derive(Clone)]
pub struct AdapterManager {
    pub manager: Manager,
    pub adapter: Arc<Mutex<Option<Adapter>>>,
    adapter_watcher: Arc<Mutex<AdapterWatcher>>,
    pub is_scanning: bool,
    pub last_update: u64, // timestamp of any recent change
    peripherals: Arc<Mutex<DashMap<String, TrezorDevice>>>,
}

impl Debug for AdapterManager {
    fn fmt(&self, f: &mut Formatter) -> fmt::Result {
        write!(f, "AdapterManager")
    }
}

struct AdapterWatcher {
    stream: Option<JoinHandle<()>>,
    watcher: Option<JoinHandle<()>>,
    scanning_update: Option<JoinHandle<()>>,
    listeners: Vec<broadcast::Sender<ChannelMessage>>,
}

impl AdapterManager {
    pub async fn new() -> Result<Self, Box<dyn std::error::Error>> {
        let is_scanning = false;
        let peripherals = Arc::new(Mutex::new(DashMap::new()));
        let last_update = 0;
        let manager = Manager::new().await.expect("Failed to initialize Manager");
        let adapter = Arc::new(Mutex::new(None));
        let adapter_watcher = Arc::new(Mutex::new(AdapterWatcher {
            watcher: None,
            stream: None,
            scanning_update: None,
            listeners: Vec::new(),
        }));

        Ok(Self {
            manager,
            adapter,
            adapter_watcher,
            is_scanning,
            peripherals,
            last_update,
        })
    }

    // let manager = Manager::new().await.expect("BLEManager error");
    // - windows and mac (?) create new stateless instance of the Adapter every time manager.adapters() is called
    // - linux keep reference(s) for once initialized adapters
    // - linux throws error if adapter is disabled

    // system specific behavior. if CentralState is poweredOff
    // - windows and macos always returns the Adapter object
    // - linux (bluez) returns nothing or throws error
    // once the Adapter is found and assigned then it correctly reports it's state change (on/off)
    // start thread and wait until Adapter is enabled/found.

    async fn dispatch_adapter_event(&self) {
        // let adapter = utils::get_adapter(&self.manager, None).await;
        // if adapter.is_some() {
        //     let mut val = self.adapter.lock().await;
        //     *val = adapter;
        //     let adapter = val.clone();
        //     drop(val);

        //     let powered = adapter.unwrap().adapter_state().await.unwrap() == CentralState::PoweredOn;
        //     self.send_to_listeners(ChannelMessage::Notification(
        //         NotificationEvent::AdapterStateChanged { powered },
        //     )).await;

        //     info!("Adapter found");
        //     if let Err(e) = self.start_events_stream().await {
        //         println!("Failed to start_events_stream: {:?}", e);
        //     }
        // }

        // Ok(adapter)

        let current = self.adapter.lock().await;
        let adapter = current.clone();

        if adapter.is_some() {
            let powered =
                adapter.unwrap().adapter_state().await.unwrap() == CentralState::PoweredOn;
            self.send_to_listeners(ChannelMessage::Notification(
                NotificationEvent::AdapterStateChanged { powered },
            ))
            .await;
        }
    }

    pub async fn get_adapter(&self) -> Result<Option<Adapter>, Box<dyn std::error::Error>> {
        let current = self.adapter.lock().await;
        let adapter_found = current.clone();
        drop(current);

        if adapter_found.is_some() {
            return Ok(adapter_found);
        }

        let adapter = utils::get_adapter(&self.manager, None).await;
        if adapter.is_some() {
            let mut val = self.adapter.lock().await;
            *val = adapter;
            let adapter_found = val.clone();
            drop(val);

            self.dispatch_adapter_event().await;

            info!("Adapter found");
            if let Err(e) = self.start_events_stream().await {
                println!("Failed to start_events_stream: {:?}", e);
            }

            return Ok(adapter_found);
        }

        self.adapter_loader().await;

        Ok(None)
    }

    pub async fn watch_adapter(&self, listener: broadcast::Sender<ChannelMessage>) {
        let mut state = self.adapter_watcher.lock().await;

        state.listeners.push(listener.clone());
    }

    pub async fn enumerate(&self) -> Vec<TrezorDevice> {
        // TODO: enumerate adapter, remove local diff
        return self.get_devices().await;
    }

    pub async fn adapter_loader(&self) {
        let mut state = self.adapter_watcher.lock().await;
        // If there's already a watcher, return early
        if state.watcher.is_some() {
            info!("Adapter loader already running");
            return ();
        }

        // self.start_scan().await;

        info!("Adapter loader start");
        let adapter_mutex = self.adapter.clone();
        let manager = self.manager.clone();
        let self_clone = self.clone();
        let watcher = tokio::spawn(async move {
            loop {
                let adapter = adapter_mutex.lock().await;
                let adapter_found = adapter.is_some();
                drop(adapter); // unlock

                if adapter_found {
                    info!("Adapter found");
                    if let Err(e) = self_clone.start_events_stream().await {
                        println!("Failed to start_events_stream: {:?}", e);
                    }
                    // TODO clear watcher
                    // state.watcher = None;

                    break;
                }

                info!("Waiting for Adapter");
                sleep(Duration::from_secs(2)).await;

                let adapter = utils::get_adapter(&manager, None).await;
                if adapter.is_some() {
                    info!("Adapter found in adapter_loader");
                    let mut val = adapter_mutex.lock().await;
                    *val = adapter;
                    drop(val); // unlock

                    self_clone.dispatch_adapter_event().await;
                }
            }

            info!("Adapter loader end");
        });
        state.watcher = Some(watcher);
    }

    pub async fn send_to_listeners(&self, message: ChannelMessage) {
        info!("send_to_listeners: {:?}", message.clone());
        let state = self.adapter_watcher.lock().await;
        let listeners = state.listeners.clone();
        for listener in &listeners {
            if let Err(e) = listener.send(message.clone()) {
                println!("Failed to send message: {:?}", e);
            }
        }
    }

    async fn add_device(&self, uuid: String, device: TrezorDevice) {
        let peripherals = self.peripherals.lock().await;
        peripherals.insert(uuid, device);
    }

    pub async fn get_device(&self, uuid: String) -> Option<TrezorDevice> {
        let peripherals = self.peripherals.lock().await;
        if let Some(device) = peripherals.get(&uuid) {
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
                        let mut powered = false;
                        if state == CentralState::PoweredOn {
                            powered = true;
                        }
                        self_clone
                            .send_to_listeners(ChannelMessage::Notification(
                                NotificationEvent::AdapterStateChanged { powered },
                            ))
                            .await;
                    }
                    CentralEvent::DeviceDiscovered(id) => {
                        let evt = utils::scan_filter(&adapter, &id).await;
                        if evt.is_some() {
                            let device = adapter.peripheral(&id).await.expect("REASON");
                            let dev = TrezorDevice::new(device.clone()).await.unwrap();
                            self_clone.add_device(id.to_string(), dev.clone()).await;
                            let devices = self_clone.get_devices().await;

                            let uuid = id.to_string();
                            self_clone
                                .send_to_listeners(ChannelMessage::Notification(
                                    NotificationEvent::DeviceDiscovered {
                                        uuid,
                                        timestamp: 0,
                                        devices,
                                    },
                                ))
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
                                let uuid = id.to_string();
                                let devices = self_clone.get_devices().await;
                                self_clone
                                    .send_to_listeners(ChannelMessage::Notification(
                                        NotificationEvent::DeviceUpdated {
                                            uuid,
                                            devices,
                                        },
                                    ))
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
                    CentralEvent::ServiceDataAdvertisement { id, service_data: _ } => {
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
                                .send_to_listeners(ChannelMessage::Notification(
                                    NotificationEvent::DeviceDisconnected {
                                        uuid: id.to_string(),
                                        devices,
                                    },
                                ))
                                .await;
                        }
                    }
                    // CentralEvent::DeviceConnected fires up too early, connected doesn't mean that pairing process is completed.
                    // this event is emitted after successfully connection/subscription process by connect_device method.
                    CentralEvent::DeviceConnected(id) => {
                        info!("DeviceConnected: {:?}", id);
                    }
                }
            }
        });

        Ok(())
    }

    pub async fn stop_watching(&self, listener: &broadcast::Sender<ChannelMessage>) {
        let mut state = self.adapter_watcher.lock().await;
        state
            .listeners
            .retain(|item| item.same_channel(listener) == false);

        if state.listeners.is_empty() {
            if let Some(watcher) = state.watcher.take() {
                info!("Adapter watcher stopping");
                watcher.abort();
                // state.watcher = None;
            }
        }
    }

    pub async fn start_scan(&self) {
        let mut state = self.adapter_watcher.lock().await;

        let self_clone = self.clone();
        let update_thread = tokio::spawn(async move {
            loop {
                let _devices = self_clone.get_devices().await;
                // self_clone.send_to_listeners(
                //     ChannelMessage::Notification(
                //         NotificationEvent::ScanningUpdate { devices },
                //     )
                // ).await;

                sleep(Duration::from_secs(3)).await;
            }
        });

        state.scanning_update = Some(update_thread);
    }

    pub async fn stop_scan(&self) {}
}
