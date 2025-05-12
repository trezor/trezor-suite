use crate::server::types::ChannelMessage;
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
}
