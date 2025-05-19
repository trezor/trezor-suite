use crate::server::types::{AbortProcess, ChannelMessage};
use log::info;
use tokio::sync::broadcast::{channel, Receiver, Sender};

#[derive(Clone, Debug)]
pub struct ConnectionBroadcast {
    peer: String,
    sender: Sender<ChannelMessage>,
}

#[derive(Debug, thiserror::Error)]
pub enum ConnectionBroadcastError {
    #[error("IOError: {0}")]
    Io(#[from] std::io::Error),
}

impl ConnectionBroadcast {
    pub fn new(peer: String) -> Result<Self, ConnectionBroadcastError> {
        let (sender, _receiver) = channel::<ChannelMessage>(32);

        Ok(Self { peer, sender })
    }

    pub fn get_sender(&self) -> Sender<ChannelMessage> {
        self.sender.clone()
    }

    pub fn subscribe(&self) -> Receiver<ChannelMessage> {
        self.sender.subscribe()
    }

    pub fn same_channel(&self, broadcast: &ConnectionBroadcast) -> bool {
        self.sender.same_channel(&broadcast.get_sender())
    }

    pub fn send(&self, msg: ChannelMessage) {
        if let Err(err) = self.sender.send(msg.clone()) {
            info!("ConnectionBroadcast message {msg:?} not sent. {err}");
        }
    }

    // pub fn get_watcher<F, Fut>(&self) -> tokio::task::JoinHandle<()>
    // where
    //     F: Fn() -> Fut,
    //     Fut: std::future::Future<Output = ()>,
    pub fn get_abortable_task(
        &self,
        device_id: String,
        timeout: u32,
    ) -> (
        Sender<AbortProcess>,
        tokio::task::JoinHandle<()>,
        tokio::task::JoinHandle<()>,
    ) {
        let mut receiver = self.subscribe();

        let (sender, receiver2) = channel::<AbortProcess>(32);
        let sender_ref = sender.clone();
        let cancel_task = tokio::spawn(async move {
            info!("abortable_task/cancel_task start");
            while let Ok(ref event1) = receiver.recv().await {
                if let ChannelMessage::Abort(event) = event1 {
                    #[allow(clippy::single_match)] // see TODO below
                    match event {
                        AbortProcess::DeviceDisconnected(id) => {
                            info!("abortable_task/cancel_task run");
                            // peripheral_ref.disconnect().await;
                            sender_ref.send(AbortProcess::AbortedBySignal);
                            break;
                        }
                        // TODO: if ws connection is related to this device
                        _ => {} // ignore
                    };
                }
            }
            info!("abortable_task/cancel_task done");
        });

        // let peripheral_ref = peripheral.clone();
        let sender_ref = sender.clone();
        let timeout_task = tokio::spawn(async move {
            info!("connect_device/timeout_task start {timeout}");
            let tm = tokio::time::Duration::from_millis(timeout.into());
            tokio::time::sleep(tm).await;
            println!("connect_device/timeout_task run");
            // disconnect_device(device_path_clone, timeout).await;
            //  peripheral_ref.disconnect().await;
            info!("connect_device/timeout_task done");
            sender_ref.send(AbortProcess::AbortedByTimeout);
        });

        return (sender, cancel_task, timeout_task);

        /*
        return tokio::spawn(async move {
            while let Ok(event) = receiver.recv().await {
                match event {
                    ChannelMessage::Abort(event) => {
                        match event {
                            AbortProcess::DeviceDisconnected(id) => {
                                println!("Abort by DeviceDisconnected {device_id}");
                            }
                            AbortProcess::ClientDisconnected(id) => {
                                println!("Abort by ClientDisconnected {device_id}");
                            }
                            _ => {}
                        }
                        // if let AbortProcess::DeviceDisconnected(id) = event {
                        //     if device_id == id {
                        //         break;
                        //     }
                        //     //stop_scanning(&adapter).await;
                        //     // manager_ref.set_scanning(false).await;
                        //     // info!("Abort start_scan loop");
                        // }
                        // if let AbortProcess::ClientDisconnected = event {
                        //     // if device_id == id {
                        //     //     break;
                        //     // }
                        //     //stop_scanning(&adapter).await;
                        //     // manager_ref.set_scanning(false).await;
                        //     // info!("Abort start_scan loop");
                        // }
                        // match event {
                        //      => {
                        //         if current_id == id {
                        //             let device_path = format!("/org/bluez/{}", id);
                        //             let device_proxy = get_device_proxy(device_path, timeout);
                        //             let _result: Result<(), dbus::Error> = device_proxy
                        //                 .method_call("org.bluez.Device1", "CancelPairing", ())
                        //                 .await;
                        //             break;
                        //         }
                        //     }
                        //     // TODO: if ws connection is related to this device
                        //     _ => {} // ignore
                        // };
                    }
                    _ => {}
                }
                //     ChannelMessage::Notification(event) => {
                //         if let NotificationEvent::AdapterStateChanged { state } = event {
                //             match state {
                //                 AdapterState::Enabled => {
                //                     if manager_ref.is_scanning().await {
                //                         // TODO: server or client should decide when to restart scanning?
                //                         // start_scanning(&adapter);
                //                     }
                //                 }
                //                 _ => {
                //                     stop_scanning(&adapter).await;
                //                     manager_ref.set_scanning(false).await;
                //                 }
                //             }
                //         }
                //     }
                // }
            }

            println!("Abort task done!!!")
        });
        */
    }
}
