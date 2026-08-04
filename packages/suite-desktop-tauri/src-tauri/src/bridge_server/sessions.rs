//! Session/descriptor state machine — the Rust port of `@trezor/transport-common`'s
//! SessionsBackground. Pure in-process (no IPC): tracks connected devices, maps their internal
//! path (USB serial / UDP addr) to a public numeric path, allocates decimal session ids, serializes
//! acquire/release per device, and broadcasts descriptor changes so `/listen` long-polls resolve.

use serde::Serialize;
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::{watch, Mutex};

use super::transport::{DeviceDescriptor, Transport};

/// Public descriptor emitted by `/enumerate` and `/listen`.
#[derive(Clone, Debug, Serialize, PartialEq)]
pub struct Descriptor {
    pub path: String, // public numeric, e.g. "1"
    #[serde(rename = "type")]
    pub device_type: u8,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub product: Option<u16>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub vendor: Option<u16>,
    #[serde(rename = "apiType")]
    pub api_type: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub model: Option<u8>,
    pub session: Option<String>,
    #[serde(rename = "sessionOwner", skip_serializing_if = "Option::is_none")]
    pub session_owner: Option<String>,
}

struct Entry {
    internal_path: String,
    descriptor: Descriptor,
}

struct Inner {
    entries: Vec<Entry>, // one per connected device
    public_path_of: HashMap<String, String>, // internal → public
    last_session_id: u64,
    last_path_id: u64,
}

pub struct Sessions {
    inner: Mutex<Inner>,
    /// per-internal-path acquire serialization (SessionsBackground lock queue)
    acquire_locks: Mutex<HashMap<String, Arc<Mutex<()>>>>,
    /// per-internal-path device I/O isolation (AbstractApi.runInIsolation)
    io_locks: Mutex<HashMap<String, Arc<Mutex<()>>>>,
    /// descriptor change notifier for /listen
    descriptors_tx: watch::Sender<Vec<Descriptor>>,
}

impl Sessions {
    pub fn new() -> Arc<Self> {
        let (tx, _rx) = watch::channel(Vec::new());
        Arc::new(Sessions {
            inner: Mutex::new(Inner {
                entries: Vec::new(),
                public_path_of: HashMap::new(),
                last_session_id: 0,
                last_path_id: 0,
            }),
            acquire_locks: Mutex::new(HashMap::new()),
            io_locks: Mutex::new(HashMap::new()),
            descriptors_tx: tx,
        })
    }

    pub fn subscribe(&self) -> watch::Receiver<Vec<Descriptor>> {
        self.descriptors_tx.subscribe()
    }

    pub async fn current_descriptors(&self) -> Vec<Descriptor> {
        self.inner
            .lock()
            .await
            .entries
            .iter()
            .map(|e| e.descriptor.clone())
            .collect()
    }

    async fn lock_named(map: &Mutex<HashMap<String, Arc<Mutex<()>>>>, key: &str) -> Arc<Mutex<()>> {
        let mut guard = map.lock().await;
        guard
            .entry(key.to_string())
            .or_insert_with(|| Arc::new(Mutex::new(())))
            .clone()
    }

    /// Reconcile the freshly-enumerated device list into the descriptor table, assigning a public
    /// path to each newly-seen device and preserving sessions of still-present ones. Returns true
    /// if the descriptor set changed (→ notify /listen).
    pub async fn enumerate_done(&self, devices: Vec<DeviceDescriptor>) -> Vec<Descriptor> {
        let mut inner = self.inner.lock().await;
        let previous: Vec<Descriptor> = inner.entries.iter().map(|e| e.descriptor.clone()).collect();

        let mut new_entries: Vec<Entry> = Vec::new();
        for dev in devices {
            // preserve existing session/publicPath if this internal path was already known
            let (session, session_owner) = inner
                .entries
                .iter()
                .find(|e| e.internal_path == dev.path)
                .map(|e| (e.descriptor.session.clone(), e.descriptor.session_owner.clone()))
                .unwrap_or((None, None));
            let public_path = match inner.public_path_of.get(&dev.path) {
                Some(p) => p.clone(),
                None => {
                    inner.last_path_id += 1;
                    let p = inner.last_path_id.to_string();
                    inner.public_path_of.insert(dev.path.clone(), p.clone());
                    p
                }
            };

            new_entries.push(Entry {
                internal_path: dev.path.clone(),
                descriptor: Descriptor {
                    path: public_path,
                    device_type: dev.device_type,
                    product: dev.product,
                    vendor: dev.vendor,
                    api_type: "usb".to_string(), // forced, matching transformApiType
                    id: dev.id,
                    model: Some(dev.model),
                    session,
                    session_owner,
                },
            });
        }
        inner.entries = new_entries;
        let current: Vec<Descriptor> = inner.entries.iter().map(|e| e.descriptor.clone()).collect();
        drop(inner);

        if current != previous {
            let _ = self.descriptors_tx.send(current.clone());
        }
        current
    }

    fn internal_of_public<'a>(inner: &'a Inner, public: &str) -> Option<&'a Entry> {
        inner.entries.iter().find(|e| e.descriptor.path == public)
    }

    /// `/acquire/:path/:previous` — the whole intent→open→done flow, serialized per device.
    pub async fn acquire(
        &self,
        transport: &Transport,
        public_path: &str,
        previous: &str, // decimal session id or "null"
        session_owner: Option<String>,
    ) -> Result<String, String> {
        // resolve internal path
        let internal = {
            let inner = self.inner.lock().await;
            Self::internal_of_public(&inner, public_path)
                .map(|e| e.internal_path.clone())
                .ok_or_else(|| "device not found".to_string())?
        };

        let acquire_lock = Self::lock_named(&self.acquire_locks, &internal).await;
        // hold the per-device acquire lock across the whole flow (auto-times out at 4s)
        let _guard = tokio::time::timeout(std::time::Duration::from_secs(4), acquire_lock.lock())
            .await
            .map_err(|_| "sessions background did not respond".to_string())?;

        // validate previous == current session
        {
            let inner = self.inner.lock().await;
            let entry = Self::internal_of_public(&inner, public_path)
                .ok_or_else(|| "device not found".to_string())?;
            let current = entry.descriptor.session.clone();
            let previous_norm = if previous == "null" { None } else { Some(previous.to_string()) };
            if current != previous_norm {
                return Err("wrong previous session".to_string());
            }
        }

        // open the device (reset when stealing an existing session)
        transport.open(&internal, previous != "null").await?;

        // commit the new session
        let session = {
            let mut inner = self.inner.lock().await;
            inner.last_session_id += 1;
            let session = inner.last_session_id.to_string();
            if let Some(entry) = inner.entries.iter_mut().find(|e| e.internal_path == internal) {
                entry.descriptor.session = Some(session.clone());
                entry.descriptor.session_owner = session_owner;
            }
            session
        };
        self.notify().await;
        Ok(session)
    }

    /// `/release/:session`
    pub async fn release(&self, transport: &Transport, session: &str) -> Result<(), String> {
        let internal = self.internal_by_session(session).await.ok_or_else(|| "session not found".to_string())?;
        let acquire_lock = Self::lock_named(&self.acquire_locks, &internal).await;
        let _guard = tokio::time::timeout(std::time::Duration::from_secs(4), acquire_lock.lock())
            .await
            .map_err(|_| "sessions background did not respond".to_string())?;

        // Re-validate under the acquire lock: the session may have been stolen while we waited for
        // the lock (the Suite-reload race — old tab's release beacon vs new tab's acquire). Closing
        // here would tear down the NEW owner's live session. Mirrors SessionsBackground.releaseIntent.
        {
            let inner = self.inner.lock().await;
            let still_ours = inner.entries.iter().any(|e| {
                e.internal_path == internal && e.descriptor.session.as_deref() == Some(session)
            });
            if !still_ours {
                return Err("session not found".to_string());
            }
        }

        let _ = transport.close(&internal).await;

        let mut inner = self.inner.lock().await;
        if let Some(entry) = inner.entries.iter_mut().find(|e| e.internal_path == internal) {
            entry.descriptor.session = None;
            entry.descriptor.session_owner = None;
        }
        drop(inner);
        self.notify().await;
        Ok(())
    }

    /// map session → internal path (getPathBySession)
    pub async fn internal_by_session(&self, session: &str) -> Option<String> {
        self.inner
            .lock()
            .await
            .entries
            .iter()
            .find(|e| e.descriptor.session.as_deref() == Some(session))
            .map(|e| e.internal_path.clone())
    }

    /// Acquire the per-device I/O isolation lock (runInIsolation) for the duration of a call.
    pub async fn io_lock(&self, internal_path: &str) -> tokio::sync::OwnedMutexGuard<()> {
        let lock = Self::lock_named(&self.io_locks, internal_path).await;
        lock.lock_owned().await
    }

    async fn notify(&self) {
        let current = self.current_descriptors().await;
        let _ = self.descriptors_tx.send(current);
    }
}
