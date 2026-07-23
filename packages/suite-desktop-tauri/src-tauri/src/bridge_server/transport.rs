//! Device transport for the in-process bridge — the Rust port of `@trezor/transport-common`'s
//! UsbApi + `@trezor/transport`'s UdpApi. Two backends behind one interface:
//! - **UDP** (emulator): pings 127.0.0.1:21324, exchanges 64-byte datagrams. Lets the bridge be
//!   tested against trezor-user-env without a physical device.
//! - **USB** (real devices): enumeration via `nusb`, device I/O via `rusb`/libusb (vendored) —
//!   interrupt transfers on endpoints 0x01/0x81, config 1 / interface 0, 64-byte reports, with the
//!   JS UsbApi's reset-on-reacquire/close semantics. See the USB section below for why both.

use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::Mutex;

pub const CHUNK_SIZE: usize = 64;

// USB constants (transport-common/src/constants.ts)
const CONFIGURATION_ID: u8 = 1;
const INTERFACE_ID: u8 = 0;
const ENDPOINT_ID: u8 = 1;
const T1_HID_VENDOR: u16 = 0x534c;
const WEBUSB_BOOTLOADER_PRODUCT: u16 = 0x53c0;
const WEBUSB_FIRMWARE_PRODUCT: u16 = 0x53c1;
/// (vendorId, productId) enumerate filter
const TREZOR_USB_DESCRIPTORS: [(u16, u16); 4] = [
    (T1_HID_VENDOR, 0x0001),
    (0x1209, WEBUSB_BOOTLOADER_PRODUCT),
    (0x1209, WEBUSB_FIRMWARE_PRODUCT),
    (0x1209, 0x53c1),
];

const UDP_ADDR: &str = "127.0.0.1:21324";
const PING: &[u8] = b"PINGPING";
const PONG: &[u8] = b"PONGPONG";

const WRITE_TIMEOUT: std::time::Duration = std::time::Duration::from_secs(5);
// libusb treats a zero Duration as "no timeout": the read blocks until the device responds (which
// may be a while — e.g. the user confirming on-device), matching trezord's blocking read. Bounded by
// the per-device io_lock; a device unplug returns an error that unblocks it.
const READ_TIMEOUT: std::time::Duration = std::time::Duration::from_secs(0);

/// A discovered device, before session assignment (DescriptorApiLevel).
#[derive(Clone, Debug)]
pub struct DeviceDescriptor {
    /// internal path — the USB serial number, or the UDP "host:port"
    pub path: String,
    pub device_type: u8,
    pub product: Option<u16>,
    pub vendor: Option<u16>,
    pub id: Option<String>,
    pub model: u8,
}

#[derive(Clone)]
pub enum Transport {
    Udp(Arc<UdpTransport>),
    Usb(Arc<UsbTransport>),
}

impl Transport {
    /// `None` = enumeration failed (keep previous state); `Some(vec)` = authoritative snapshot.
    pub async fn enumerate(&self) -> Option<Vec<DeviceDescriptor>> {
        match self {
            Transport::Udp(t) => Some(t.enumerate().await),
            Transport::Usb(t) => t.enumerate().await,
        }
    }
    pub async fn open(&self, path: &str, reset: bool) -> Result<(), String> {
        match self {
            Transport::Udp(t) => t.open(path).await,
            Transport::Usb(t) => t.open(path, reset).await,
        }
    }
    pub async fn close(&self, path: &str) -> Result<(), String> {
        match self {
            Transport::Udp(_) => Ok(()),
            Transport::Usb(t) => t.close(path).await,
        }
    }
    pub async fn write(&self, path: &str, chunk: &[u8]) -> Result<(), String> {
        match self {
            Transport::Udp(t) => t.write(path, chunk).await,
            Transport::Usb(t) => t.write(path, chunk).await,
        }
    }
    pub async fn read(&self, path: &str) -> Result<Vec<u8>, String> {
        match self {
            Transport::Udp(t) => t.read(path).await,
            Transport::Usb(t) => t.read(path).await,
        }
    }
}

// ---------------------------------------------------------------------------------------------
// UDP (emulator)
// ---------------------------------------------------------------------------------------------

pub struct UdpTransport {
    sockets: Mutex<HashMap<String, Arc<tokio::net::UdpSocket>>>,
    /// emulator address to probe on enumerate (overridable for tests)
    addr: String,
}

impl UdpTransport {
    pub fn new() -> Self {
        Self::new_with_addr(UDP_ADDR)
    }

    pub fn new_with_addr(addr: &str) -> Self {
        UdpTransport {
            sockets: Mutex::new(HashMap::new()),
            addr: addr.to_string(),
        }
    }

    async fn socket_for(&self, path: &str) -> Result<Arc<tokio::net::UdpSocket>, String> {
        let mut guard = self.sockets.lock().await;
        if let Some(s) = guard.get(path) {
            return Ok(s.clone());
        }
        let sock = tokio::net::UdpSocket::bind("127.0.0.1:0")
            .await
            .map_err(|e| e.to_string())?;
        sock.connect(path).await.map_err(|e| e.to_string())?;
        let sock = Arc::new(sock);
        guard.insert(path.to_string(), sock.clone());
        Ok(sock)
    }

    pub async fn enumerate(&self) -> Vec<DeviceDescriptor> {
        // ping the emulator; if it pongs, report one emulator device
        let ok = async {
            let sock = self.socket_for(&self.addr).await.ok()?;
            sock.send(PING).await.ok()?;
            let mut buf = [0u8; 64];
            let n = tokio::time::timeout(std::time::Duration::from_millis(500), sock.recv(&mut buf))
                .await
                .ok()?
                .ok()?;
            if &buf[..n.min(PONG.len())] == PONG {
                Some(())
            } else {
                None
            }
        }
        .await;

        if ok.is_some() {
            vec![DeviceDescriptor {
                path: self.addr.clone(),
                device_type: 5, // TypeEmulator
                product: None,
                vendor: None,
                id: Some(self.addr.clone()),
                model: 0,
            }]
        } else {
            vec![]
        }
    }

    pub async fn open(&self, path: &str) -> Result<(), String> {
        self.socket_for(path).await.map(|_| ())
    }

    pub async fn write(&self, path: &str, chunk: &[u8]) -> Result<(), String> {
        let sock = self.socket_for(path).await?;
        sock.send(chunk).await.map_err(|e| e.to_string())?;
        Ok(())
    }

    pub async fn read(&self, path: &str) -> Result<Vec<u8>, String> {
        let sock = self.socket_for(path).await?;
        let mut buf = [0u8; 64];
        loop {
            let n = sock.recv(&mut buf).await.map_err(|e| e.to_string())?;
            // skip PONG keep-alives
            if &buf[..n.min(PONG.len())] == PONG {
                continue;
            }
            return Ok(buf[..n].to_vec());
        }
    }
}

// ---------------------------------------------------------------------------------------------
// USB (real devices): enumerate via nusb, I/O via rusb (libusb)
// ---------------------------------------------------------------------------------------------
//
// nusb enumerates reliably (and gives the serial without opening the device), but its async
// interrupt-OUT transfers never complete on macOS — the write future just hangs, so a `/call`
// never returns and the device never reaches the app. libusb (via rusb, the same C library
// node-usb and trezord use) does reliable synchronous interrupt I/O, so device I/O goes through
// rusb. Trezor endpoints are interrupt (0x01 OUT, 0x81 IN) on every model. rusb calls are blocking,
// wrapped in `spawn_blocking`.

struct OpenUsbDevice {
    handle: rusb::DeviceHandle<rusb::GlobalContext>,
}

pub struct UsbTransport {
    open: Mutex<HashMap<String, Arc<OpenUsbDevice>>>,
}

impl UsbTransport {
    pub fn new() -> Self {
        UsbTransport {
            open: Mutex::new(HashMap::new()),
        }
    }

    fn is_trezor(vid: u16, pid: u16) -> bool {
        TREZOR_USB_DESCRIPTORS.contains(&(vid, pid))
    }

    fn device_type(vid: u16, pid: u16, version_major: u8) -> u8 {
        let bootloader = pid == WEBUSB_BOOTLOADER_PRODUCT;
        if version_major == 2 {
            if bootloader { 4 } else { 3 } // TypeT2Boot / TypeT2
        } else if bootloader {
            2 // TypeT1WebusbBoot
        } else if vid == T1_HID_VENDOR {
            0 // TypeT1Hid
        } else {
            1 // TypeT1Webusb
        }
    }

    /// `None` means enumeration itself failed (transient nusb/OS error) — the caller must keep the
    /// previous descriptor state, NOT reconcile against an empty list (which would wipe every live
    /// session). `Some(vec)` (possibly empty) is an authoritative snapshot.
    pub async fn enumerate(&self) -> Option<Vec<DeviceDescriptor>> {
        let list = match nusb::list_devices() {
            Ok(l) => l,
            Err(e) => {
                log::error!("bridge/usb: list_devices failed: {e}");
                return None;
            }
        };
        let mut out = Vec::new();
        let mut bootloader_counter = 0u32;
        for info in list {
            let (vid, pid) = (info.vendor_id(), info.product_id());
            if !Self::is_trezor(vid, pid) {
                continue;
            }
            let serial = info.serial_number().map(|s| s.to_string());
            let path = match &serial {
                Some(s) if !s.is_empty() => s.clone(),
                _ => {
                    bootloader_counter += 1;
                    format!("bootloader{bootloader_counter}")
                }
            };
            // nusb DeviceInfo exposes bcdDevice via device_version()? fall back to 2 (modern)
            let version_major = 2;
            out.push(DeviceDescriptor {
                path,
                device_type: Self::device_type(vid, pid, version_major),
                product: Some(pid),
                vendor: Some(vid),
                id: serial,
                model: 0,
            });
        }
        Some(out)
    }

    /// Blocking: find the Trezor whose serial number matches `path`, open it, and claim interface 0.
    /// `reset` mirrors the JS UsbApi openInternal: a re-acquire (previous session exists) resets the
    /// device before claiming, clearing any stuck endpoint state from the prior session.
    fn rusb_open(path: &str, reset: bool) -> Result<rusb::DeviceHandle<rusb::GlobalContext>, String> {
        // Bootloader devices report no serial, so enumerate() gives them a synthetic "bootloaderN"
        // path that no real serial can match. Match those by "first trezor with an empty serial"
        // instead (only one bootloader device is realistically attached during a firmware update).
        let want_serialless = path.starts_with("bootloader");
        for dev in rusb::devices().map_err(|e| e.to_string())?.iter() {
            let Ok(desc) = dev.device_descriptor() else { continue };
            if !Self::is_trezor(desc.vendor_id(), desc.product_id()) {
                continue;
            }
            let handle = match dev.open() {
                Ok(h) => h,
                Err(_) => continue,
            };
            let serial = handle.read_serial_number_string_ascii(&desc).unwrap_or_default();
            let matches = if want_serialless {
                serial.is_empty()
            } else {
                serial == path
            };
            if !matches {
                continue;
            }
            // detach any kernel driver (Trezor One's HID interface), then claim interface 0.
            let _ = handle.set_auto_detach_kernel_driver(true);
            // Only (re)select config 1 if the device isn't already configured that way. Calling
            // set_configuration unconditionally sends a SET_CONFIGURATION that RESETS the device and
            // desyncs the endpoints, so a reopen's first write times out — the exact "reopen breaks"
            // bug. Skipping it when already configured keeps reopen clean.
            if handle.active_configuration().ok() != Some(CONFIGURATION_ID) {
                let _ = handle.set_active_configuration(CONFIGURATION_ID);
            }
            // re-acquire: reset like the JS transport (best-effort — it can fail on some platforms)
            if reset {
                let _ = handle.reset();
            }
            handle
                .claim_interface(INTERFACE_ID)
                .map_err(|e| format!("claim-interface: {e}"))?;
            // A previous session may have left queued IN reports (e.g. an interrupted multi-report
            // response); drain them so the next read returns a fresh response. Don't stop on the
            // first timeout — macOS/libusb can need a moment to re-arm the interrupt pipe — only
            // after two consecutive empty reads. (Do NOT clear_halt here — on a healthy endpoint it
            // resets the USB data toggle and desyncs the device, breaking transfers.)
            let mut junk = [0u8; CHUNK_SIZE];
            let mut empties = 0;
            for _ in 0..32 {
                match handle.read_interrupt(
                    0x80 | ENDPOINT_ID,
                    &mut junk,
                    std::time::Duration::from_millis(100),
                ) {
                    Ok(n) if n > 0 => empties = 0,
                    _ => {
                        empties += 1;
                        if empties >= 2 {
                            break;
                        }
                    }
                }
            }
            return Ok(handle);
        }
        Err("device not found".to_string())
    }

    pub async fn open(&self, path: &str, reset: bool) -> Result<(), String> {
        // Already open: a plain re-open (reset=false) reuses the handle, but a session STEAL
        // (reset=true, i.e. acquire with a non-null previous) must reset the device first — exactly
        // as the JS openInternal does — to interrupt the previous owner's pending read_interrupt
        // (which holds the io_lock and the claimed interface on an infinite READ_TIMEOUT). Without
        // this the stolen session's first /call deadlocks on the io_lock forever.
        {
            let existing = {
                let map = self.open.lock().await;
                map.contains_key(path)
            };
            if existing {
                if !reset {
                    return Ok(());
                }
                if let Some(dev) = self.open.lock().await.remove(path) {
                    tokio::task::spawn_blocking(move || {
                        let _ = dev.handle.reset();
                        drop(dev);
                    })
                    .await
                    .map_err(|e| format!("reset join: {e}"))?;
                }
            }
        }
        let p = path.to_string();
        let handle = tokio::task::spawn_blocking(move || Self::rusb_open(&p, reset))
            .await
            .map_err(|e| format!("open join: {e}"))??;
        self.open
            .lock()
            .await
            .insert(path.to_string(), Arc::new(OpenUsbDevice { handle }));
        Ok(())
    }

    pub async fn close(&self, path: &str) -> Result<(), String> {
        let dev = self.open.lock().await.remove(path);
        if let Some(dev) = dev {
            // Mirror the JS closeDevice: reset() INTERRUPTS pending transfers. Without it a /read
            // long-poll blocked in read_interrupt (infinite timeout) would keep its Arc — and the
            // claimed interface — alive forever, so the next acquire fails with "exclusive access".
            tokio::task::spawn_blocking(move || {
                let _ = dev.handle.reset();
                drop(dev); // releases the interface + closes the device (last Arc may be the reader's)
            })
            .await
            .map_err(|e| format!("close join: {e}"))?;
        }
        Ok(())
    }

    async fn device(&self, path: &str) -> Result<Arc<OpenUsbDevice>, String> {
        self.open
            .lock()
            .await
            .get(path)
            .cloned()
            .ok_or_else(|| "device not found".to_string())
    }

    /// Translate a libusb transfer error into the canonical transport-common error the client can
    /// classify, and evict a dead handle so a replug of the same device can re-open (otherwise the
    /// stale handle lingers in the map forever and every replug fails until app restart).
    async fn classify_io<T>(&self, path: &str, res: Result<T, rusb::Error>, ctx: &str) -> Result<T, String> {
        match res {
            Ok(v) => Ok(v),
            Err(rusb::Error::NoDevice) | Err(rusb::Error::NotFound) => {
                self.open.lock().await.remove(path);
                Err("device disconnected during action".to_string())
            }
            Err(e) => Err(format!("{ctx}: {e}")),
        }
    }

    pub async fn write(&self, path: &str, chunk: &[u8]) -> Result<(), String> {
        let dev = self.device(path).await?;
        let mut buf = [0u8; CHUNK_SIZE];
        buf[..chunk.len().min(CHUNK_SIZE)].copy_from_slice(&chunk[..chunk.len().min(CHUNK_SIZE)]);
        let res = tokio::task::spawn_blocking(move || {
            dev.handle.write_interrupt(ENDPOINT_ID, &buf, WRITE_TIMEOUT).map(|_| ()) // OUT 0x01
        })
        .await
        .map_err(|e| format!("write join: {e}"))?;
        self.classify_io(path, res, "transferOut").await
    }

    pub async fn read(&self, path: &str) -> Result<Vec<u8>, String> {
        let dev = self.device(path).await?;
        let res = tokio::task::spawn_blocking(move || {
            // libusb can surface zero-length interrupt packets; skip them and keep reading until a
            // real report arrives, like trezord/node-usb do.
            loop {
                let mut buf = vec![0u8; CHUNK_SIZE];
                let n = dev.handle.read_interrupt(0x80 | ENDPOINT_ID, &mut buf, READ_TIMEOUT)?; // IN 0x81
                if n == 0 {
                    continue;
                }
                buf.truncate(n);
                return Ok(buf);
            }
        })
        .await
        .map_err(|e| format!("read join: {e}"))?;
        self.classify_io(path, res, "transferIn").await
    }
}

#[cfg(test)]
mod nusb_smoke {
    /// Diagnostic: does nusb enumerate ANY usb device on this host? (run with --nocapture)
    #[test]
    fn list_all() {
        match nusb::list_devices() {
            Ok(list) => {
                let devs: Vec<_> = list.collect();
                eprintln!("nusb sees {} usb device(s):", devs.len());
                for d in &devs {
                    let is_trezor = super::UsbTransport::is_trezor(d.vendor_id(), d.product_id());
                    eprintln!(
                        "  vid={:04x} pid={:04x} class={:02x} serial={:?} product={:?}{}",
                        d.vendor_id(),
                        d.product_id(),
                        d.class(),
                        d.serial_number(),
                        d.product_string(),
                        if is_trezor { "  <<< TREZOR" } else { "" },
                    );
                    for i in d.interfaces() {
                        eprintln!(
                            "      iface #{} class={:02x} subclass={:02x} protocol={:02x}",
                            i.interface_number(),
                            i.class(),
                            i.subclass(),
                            i.protocol(),
                        );
                    }
                }
            }
            Err(e) => eprintln!("nusb::list_devices ERROR: {e}"),
        }
    }

    /// Live round-trip: GetFeatures → Features over the real USB transport. Verifies interrupt
    /// transfers work end-to-end. Early-returns (CI-safe) if no device is attached.
    #[tokio::test(flavor = "multi_thread", worker_threads = 4)]
    async fn trezor_getfeatures_roundtrip() {
        use super::super::protocol::{create_chunks, read_v1_message, v1_encode, Message};
        let t = std::sync::Arc::new(super::UsbTransport::new());
        let devs = t.enumerate().await.unwrap_or_default();
        let Some(d) = devs.first() else {
            eprintln!("no trezor attached — skipping");
            return;
        };
        let path = d.path.clone();
        let get_features = Message { message_type: 0x0037, payload: vec![] };
        // Two cycles with a close+reopen between — reproduces the app's per-session acquire/release
        // (first acquire previous=null → no reset, re-acquire → reset). Reads the FULL multi-report
        // response like the server's v1_read, so no reports are left queued between cycles.
        for cycle in 0..2 {
            eprintln!("cycle {cycle}: opening {path}...");
            t.open(&path, cycle > 0).await.expect("open");
            for chunk in create_chunks(&v1_encode(&get_features)) {
                tokio::time::timeout(std::time::Duration::from_secs(8), t.write(&path, &chunk))
                    .await
                    .expect("write timed out")
                    .expect("write err");
            }
            let t2 = t.clone();
            let p2 = path.clone();
            let msg = tokio::time::timeout(
                std::time::Duration::from_secs(8),
                read_v1_message(move || {
                    let t3 = t2.clone();
                    let p3 = p2.clone();
                    async move { t3.read(&p3).await }
                }),
            )
            .await
            .expect("read timed out")
            .expect("read err");
            eprintln!(
                "cycle {cycle}: msg type = {} payload {} bytes (17=Features OK)",
                msg.message_type,
                msg.payload.len()
            );
            assert_eq!(msg.message_type, 17, "expected Features(17)");
            t.close(&path).await.expect("close");
        }
        eprintln!("both cycles OK — reopen works");
    }

    /// Live round-trip via rusb (libusb) — the reliable path. Verifies GetFeatures → Features works
    /// where nusb's async interrupt-OUT never completes on macOS. CI-safe (early-return, no device).
    #[test]
    fn rusb_getfeatures_roundtrip() {
        use super::super::protocol::{create_chunks, v1_encode, Message};
        use rusb::UsbContext;
        let ctx = match rusb::Context::new() {
            Ok(c) => c,
            Err(e) => {
                eprintln!("rusb ctx: {e}");
                return;
            }
        };
        let devices = ctx.devices().expect("devices");
        for device in devices.iter() {
            let Ok(desc) = device.device_descriptor() else { continue };
            if !super::UsbTransport::is_trezor(desc.vendor_id(), desc.product_id()) {
                continue;
            }
            eprintln!("rusb: trezor {:04x}:{:04x}", desc.vendor_id(), desc.product_id());
            let mut handle = match device.open() {
                Ok(h) => h,
                Err(e) => {
                    eprintln!("rusb open: {e}");
                    return;
                }
            };
            let _ = handle.set_auto_detach_kernel_driver(true);
            if let Err(e) = handle.claim_interface(0) {
                eprintln!("rusb claim: {e}");
                return;
            }
            // drain any stale IN data left by earlier experiments so we read a fresh response
            let mut junk = [0u8; 64];
            while handle
                .read_interrupt(0x81, &mut junk, std::time::Duration::from_millis(100))
                .map(|n| n > 0)
                .unwrap_or(false)
            {
                eprintln!("  drained a stale IN report");
            }
            let enc = v1_encode(&Message { message_type: 0x0037, payload: vec![] });
            for chunk in create_chunks(&enc) {
                let n = handle
                    .write_interrupt(0x01, &chunk, std::time::Duration::from_secs(2))
                    .expect("write_interrupt");
                eprintln!("rusb wrote {n} bytes");
            }
            let mut resp = Vec::new();
            for attempt in 0..15 {
                let mut buf = [0u8; 64];
                match handle.read_interrupt(0x81, &mut buf, std::time::Duration::from_secs(2)) {
                    Ok(0) => {
                        eprintln!("  read attempt {attempt}: ZLP, retry");
                        continue;
                    }
                    Ok(n) => {
                        resp = buf[..n].to_vec();
                        break;
                    }
                    Err(e) => {
                        eprintln!("  read attempt {attempt}: {e}");
                        std::thread::sleep(std::time::Duration::from_millis(50));
                    }
                }
            }
            eprintln!("rusb read {} bytes, head: {:02x?}", resp.len(), &resp[..9.min(resp.len())]);
            assert!(resp.len() >= 5, "no response");
            let msg_type = u16::from_be_bytes([resp[3], resp[4]]);
            eprintln!("rusb msg type = {msg_type} (17=Features OK)");
            assert_eq!(msg_type, 17, "expected Features");
            let _ = handle.release_interface(0);
            return;
        }
        eprintln!("no trezor attached — skipping");
    }

    /// Diagnostic: open the Trezor and print each endpoint's transfer type (bulk vs interrupt) —
    /// determines whether `bulk_in`/`bulk_out` is the correct nusb transfer.
    #[test]
    fn trezor_endpoints() {
        let Ok(list) = nusb::list_devices() else {
            eprintln!("list_devices failed");
            return;
        };
        for info in list {
            if !super::UsbTransport::is_trezor(info.vendor_id(), info.product_id()) {
                continue;
            }
            eprintln!("TREZOR {:04x}:{:04x}", info.vendor_id(), info.product_id());
            let dev = match info.open() {
                Ok(d) => d,
                Err(e) => {
                    eprintln!("  open failed: {e}");
                    continue;
                }
            };
            let cfg = match dev.active_configuration() {
                Ok(c) => c,
                Err(e) => {
                    eprintln!("  active_configuration failed: {e}");
                    continue;
                }
            };
            for iface in cfg.interface_alt_settings() {
                eprintln!(
                    "  iface #{} class={:02x} alt={}",
                    iface.interface_number(),
                    iface.class(),
                    iface.alternate_setting(),
                );
                for ep in iface.endpoints() {
                    eprintln!(
                        "    ep addr={:#04x} type={:?} max_packet={}",
                        ep.address(),
                        ep.transfer_type(),
                        ep.max_packet_size(),
                    );
                }
            }
        }
    }
}
