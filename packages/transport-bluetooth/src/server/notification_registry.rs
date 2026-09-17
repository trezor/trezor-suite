use std::sync::{Arc, Mutex};

use tokio::task::JoinHandle;

use crate::server::types::NotificationCharacteristic;

// One BLE notification stream created by `open_device`, owned by a single
// websocket connection (`peer`).
struct StreamEntry {
    peer: String,
    device_id: String,
    characteristic: NotificationCharacteristic,
    task: JoinHandle<()>,
}

/// A stream removed from the registry. `unsubscribe` is true when no other
/// connection keeps a stream for the same (device, characteristic) open, so
/// the caller should also drop the shared BLE-level subscription.
pub struct RemovedStream {
    pub device_id: String,
    pub characteristic: NotificationCharacteristic,
    pub unsubscribe: bool,
}

/// Central registry of notification stream tasks keyed by
/// (connection, device, characteristic). Every stream task must be registered
/// here so it is aborted when its websocket connection, device or stream is
/// closed — regardless of how many other clients stay connected.
#[derive(Clone, Default)]
pub struct NotificationRegistry {
    entries: Arc<Mutex<Vec<StreamEntry>>>,
}

impl NotificationRegistry {
    // A connection keeps at most one stream per (device, characteristic),
    // a previously registered one is aborted and replaced.
    pub fn register(
        &self,
        peer: String,
        device_id: String,
        characteristic: NotificationCharacteristic,
        task: JoinHandle<()>,
    ) {
        let Ok(mut entries) = self.entries.lock() else {
            task.abort();
            return;
        };

        let existing = entries.iter_mut().find(|entry| {
            entry.peer == peer
                && entry.device_id == device_id
                && entry.characteristic == characteristic
        });
        if let Some(entry) = existing {
            entry.task.abort();
            entry.task = task;
        } else {
            entries.push(StreamEntry {
                peer,
                device_id,
                characteristic,
                task,
            });
        }
    }

    // Abort and remove every stream matching all given filters. `None`
    // matches everything.
    pub fn remove(
        &self,
        peer: Option<&str>,
        device_id: Option<&str>,
        characteristic: Option<&NotificationCharacteristic>,
    ) -> Vec<RemovedStream> {
        let Ok(mut entries) = self.entries.lock() else {
            return Vec::new();
        };

        let mut kept = Vec::new();
        let mut removed = Vec::new();
        for entry in entries.drain(..) {
            let matches = peer.map_or(true, |peer| entry.peer == peer)
                && device_id.map_or(true, |id| entry.device_id == id)
                && characteristic.map_or(true, |ch| entry.characteristic == *ch);
            if matches {
                entry.task.abort();
                removed.push(entry);
            } else {
                kept.push(entry);
            }
        }
        *entries = kept;

        removed
            .into_iter()
            .map(|entry| {
                // The BLE subscription is shared between connections, release
                // it only with the last stream of the same device and
                // characteristic.
                let unsubscribe = !entries.iter().any(|other| {
                    other.device_id == entry.device_id
                        && other.characteristic == entry.characteristic
                });

                RemovedStream {
                    device_id: entry.device_id,
                    characteristic: entry.characteristic,
                    unsubscribe,
                }
            })
            .collect()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn dummy_task() -> JoinHandle<()> {
        tokio::spawn(std::future::pending::<()>())
    }

    fn stream_count(registry: &NotificationRegistry) -> usize {
        registry
            .entries
            .lock()
            .map(|entries| entries.len())
            .unwrap_or(0)
    }

    #[tokio::test]
    async fn aborts_client_streams_and_releases_last_ble_subscription() {
        let registry = NotificationRegistry::default();
        registry.register(
            "a".into(),
            "dev1".into(),
            NotificationCharacteristic::Read,
            dummy_task(),
        );
        registry.register(
            "b".into(),
            "dev1".into(),
            NotificationCharacteristic::Read,
            dummy_task(),
        );
        registry.register(
            "b".into(),
            "dev1".into(),
            NotificationCharacteristic::BatteryLevel,
            dummy_task(),
        );

        // Client "b" disconnects, its Read stream is shared with client "a".
        let removed = registry.remove(Some("b"), None, None);
        assert_eq!(removed.len(), 2);
        let read = removed
            .iter()
            .find(|stream| stream.characteristic == NotificationCharacteristic::Read)
            .unwrap();
        assert!(!read.unsubscribe);
        let battery = removed
            .iter()
            .find(|stream| stream.characteristic == NotificationCharacteristic::BatteryLevel)
            .unwrap();
        assert!(battery.unsubscribe);

        // Client "a" disconnects as the last subscriber.
        let removed = registry.remove(Some("a"), None, None);
        assert_eq!(removed.len(), 1);
        assert!(removed[0].unsubscribe);
        assert_eq!(stream_count(&registry), 0);
    }

    #[tokio::test]
    async fn replaces_reopened_stream() {
        let registry = NotificationRegistry::default();
        registry.register(
            "a".into(),
            "dev1".into(),
            NotificationCharacteristic::Read,
            dummy_task(),
        );
        registry.register(
            "a".into(),
            "dev1".into(),
            NotificationCharacteristic::Read,
            dummy_task(),
        );

        assert_eq!(stream_count(&registry), 1);
    }

    #[tokio::test]
    async fn removes_streams_of_disconnected_device() {
        let registry = NotificationRegistry::default();
        registry.register(
            "a".into(),
            "dev1".into(),
            NotificationCharacteristic::Read,
            dummy_task(),
        );
        registry.register(
            "b".into(),
            "dev1".into(),
            NotificationCharacteristic::Read,
            dummy_task(),
        );
        registry.register(
            "a".into(),
            "dev2".into(),
            NotificationCharacteristic::Read,
            dummy_task(),
        );

        let removed = registry.remove(None, Some("dev1"), None);

        assert_eq!(removed.len(), 2);
        assert!(removed.iter().all(|stream| stream.unsubscribe));
        assert_eq!(stream_count(&registry), 1);
    }
}
