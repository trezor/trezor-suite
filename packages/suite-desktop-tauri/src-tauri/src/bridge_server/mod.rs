//! In-process Trezor Bridge — a pure-Rust reimplementation of `@trezor/transport-bridge`'s
//! TrezordNode (the trezord HTTP daemon on 127.0.0.1:21328), replacing the bundled Node.js sidecar
//! so the Tauri bundle carries no Node runtime.
//!
//! Layers:
//! - `transport`  — device I/O (USB via nusb / UDP emulator)
//! - `protocol`   — v1 / bridge wire framing + 64-byte chunking
//! - `thp`        — THP (v2) transport framing (no crypto; the frontend owns the keys)
//! - `sessions`   — descriptor + session state machine
//! - `server`     — the trezord HTTP API
//!
//! The frontend's `BridgeTransport` talks to it exactly as it would to the Node bridge.

mod protocol;
mod server;
mod sessions;
mod thp;
mod transport;

use std::sync::Arc;

use server::BridgeState;
use sessions::Sessions;
use transport::{Transport, UdpTransport, UsbTransport};

/// Start the in-process bridge. `use_udp` selects the emulator transport (for tests / e2e); the
/// default USB transport serves physical devices. Returns immediately; the server runs on the
/// Tauri async runtime for the app lifetime.
pub fn start(use_udp: bool) {
    let transport = if use_udp {
        Transport::Udp(Arc::new(UdpTransport::new()))
    } else {
        Transport::Usb(Arc::new(UsbTransport::new()))
    };
    let sessions = Sessions::new();
    let state = Arc::new(BridgeState {
        transport: transport.clone(),
        sessions: sessions.clone(),
    });

    // hotplug poller — re-enumerate periodically so /listen resolves on connect/disconnect
    // (mirrors UdpApi/UsbApi listenLoop). USB could use nusb hotplug events; polling is simpler
    // and matches the emulator path.
    {
        let poll_state = state.clone();
        tauri::async_runtime::spawn(async move {
            loop {
                // Skip reconciliation on a transient enumeration failure — otherwise an empty list
                // from a momentary OS/nusb hiccup would wipe every live session (and its /listen).
                if let Some(devices) = poll_state.transport.enumerate().await {
                    poll_state.sessions.enumerate_done(devices).await;
                }
                tokio::time::sleep(std::time::Duration::from_millis(500)).await;
            }
        });
    }

    tauri::async_runtime::spawn(async move {
        server::run(state).await;
    });
}

/// Is the bridge port serving? (used by the desktopApi bridge/get-status contract)
pub fn service_up() -> bool {
    use std::net::{SocketAddr, TcpStream};
    "127.0.0.1:21328"
        .parse::<SocketAddr>()
        .ok()
        .and_then(|addr| TcpStream::connect_timeout(&addr, std::time::Duration::from_millis(400)).ok())
        .is_some()
}

#[cfg(test)]
mod integration_tests {
    //! End-to-end test of the sessions + protocol + transport stack against a mock UDP "Trezor"
    //! that speaks the v1 wire protocol — no hardware, no emulator, fully deterministic.
    use super::protocol::{self, Message};
    use super::sessions::Sessions;
    use super::transport::{Transport, UdpTransport};
    use std::sync::Arc;

    /// A fake device: PONGs pings (for enumerate), and for any v1 request reassembles it and
    /// replies with a canned v1 message (type 17 "Success", payload echoing the request type).
    async fn spawn_mock_device() -> String {
        let sock = tokio::net::UdpSocket::bind("127.0.0.1:0").await.unwrap();
        let addr = sock.local_addr().unwrap().to_string();
        tokio::spawn(async move {
            let mut buf = [0u8; 64];
            let mut peer: Option<std::net::SocketAddr> = None;
            let mut assembling: Vec<u8> = Vec::new();
            let mut want: usize = 0;
            loop {
                let (n, from) = match sock.recv_from(&mut buf).await {
                    Ok(v) => v,
                    Err(_) => break,
                };
                peer = Some(from);
                let data = &buf[..n];
                if data.starts_with(b"PINGPING") {
                    let _ = sock.send_to(b"PONGPONG", from).await;
                    continue;
                }
                // v1 chunk: first chunk starts 3f2323; continuation starts 3f
                if data.first() == Some(&0x3f) && data.get(1) == Some(&0x23) {
                    // new message
                    let msg_len = u32::from_be_bytes([data[5], data[6], data[7], data[8]]) as usize;
                    want = msg_len;
                    assembling = data[9..].to_vec();
                } else if data.first() == Some(&0x3f) {
                    assembling.extend_from_slice(&data[1..]);
                }
                if assembling.len() >= want {
                    // reply with a v1 "Success" (type 2) message echoing the first payload byte
                    let echo = assembling.first().copied().unwrap_or(0);
                    let reply = protocol::v1_encode(&Message { message_type: 2, payload: vec![echo, 0xEE] });
                    for chunk in protocol::create_chunks(&reply) {
                        if let Some(p) = peer {
                            let _ = sock.send_to(&chunk, p).await;
                        }
                    }
                    assembling.clear();
                    want = 0;
                }
            }
        });
        addr
    }

    #[tokio::test]
    async fn full_stack_enumerate_acquire_call_release() {
        let addr = spawn_mock_device().await;

        // point the UDP transport at the mock device's address
        let udp = UdpTransport::new_with_addr(&addr);
        let transport = Transport::Udp(Arc::new(udp));
        let sessions = Sessions::new();

        // enumerate → the mock pongs → one descriptor
        let devices = transport.enumerate().await.expect("udp enumerate never fails");
        let descriptors = sessions.enumerate_done(devices).await;
        assert_eq!(descriptors.len(), 1, "mock device should enumerate");
        let public_path = descriptors[0].path.clone();

        // acquire
        let session = sessions
            .acquire(&transport, &public_path, "null", Some("test".into()))
            .await
            .expect("acquire");
        assert_eq!(session, "1");

        // call: write a v1 GetFeatures (type 55, empty), read the mock's reply
        let internal = sessions.internal_by_session(&session).await.unwrap();
        let req = Message { message_type: 55, payload: vec![0xAB] };
        for chunk in protocol::create_chunks(&protocol::v1_encode(&req)) {
            transport.write(&internal, &chunk).await.unwrap();
        }
        let t2 = transport.clone();
        let p2 = internal.clone();
        let reply = protocol::read_v1_message(|| {
            let t = t2.clone();
            let p = p2.clone();
            async move { t.read(&p).await }
        })
        .await
        .expect("read reply");
        assert_eq!(reply.message_type, 2, "mock replies Success");
        assert_eq!(reply.payload, vec![0xAB, 0xEE], "payload round-trips through chunking");

        // release
        sessions.release(&transport, &session).await.expect("release");
        assert!(sessions.internal_by_session(&session).await.is_none());
    }
}
