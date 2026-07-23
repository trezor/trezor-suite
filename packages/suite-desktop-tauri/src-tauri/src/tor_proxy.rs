//! Local HTTP forward-proxy with loopback bypass — the glue between the webview and Tor.
//!
//! Electron sets a Chromium session proxy, and Chromium implicitly bypasses loopback addresses,
//! so the bundled Bridge (127.0.0.1:21328) keeps working while everything else rides Tor.
//! WKWebView/WebKitGTK proxy configuration has no bypass list, so pointing the webview straight
//! at the Tor SOCKS port would send Bridge requests into Tor (which refuses private addresses).
//!
//! This forwarder reproduces the Chromium behavior: the webview proxies to
//! `http://127.0.0.1:<port>`, and each connection either goes DIRECT (loopback targets) or is
//! tunneled through the Tor SOCKS5 port (everything else). Supports CONNECT (https/wss) and
//! absolute-form plain HTTP (needed for .onion endpoints).

use std::sync::atomic::{AtomicU16, Ordering};
use tokio::io::{AsyncReadExt, AsyncWriteExt};
use tokio::net::TcpStream;

static FORWARDER_PORT: AtomicU16 = AtomicU16::new(0);

/// Start (or reuse) the forwarder; returns its local port.
pub async fn ensure_running(socks_addr: String) -> Result<u16, String> {
    let existing = FORWARDER_PORT.load(Ordering::SeqCst);
    if existing != 0 {
        // already running — the socks upstream address is re-read per connection via the state
        set_upstream(socks_addr);
        return Ok(existing);
    }

    let listener = tokio::net::TcpListener::bind("127.0.0.1:0")
        .await
        .map_err(|e| e.to_string())?;
    let port = listener.local_addr().map_err(|e| e.to_string())?.port();
    FORWARDER_PORT.store(port, Ordering::SeqCst);
    set_upstream(socks_addr);
    log::info!("tor-proxy: forwarder listening on 127.0.0.1:{port}");

    tokio::spawn(async move {
        loop {
            match listener.accept().await {
                Ok((stream, _)) => {
                    tokio::spawn(async move {
                        if let Err(e) = handle(stream).await {
                            log::debug!("tor-proxy: connection error: {e}");
                        }
                    });
                }
                Err(e) => log::error!("tor-proxy: accept: {e}"),
            }
        }
    });

    Ok(port)
}

static UPSTREAM: std::sync::Mutex<String> = std::sync::Mutex::new(String::new());

fn set_upstream(addr: String) {
    *UPSTREAM.lock().unwrap() = addr;
}

fn upstream() -> String {
    UPSTREAM.lock().unwrap().clone()
}

fn is_loopback(host: &str) -> bool {
    host == "localhost"
        || host == "::1"
        || host == "[::1]"
        || host.starts_with("127.")
        || host == "tauri.localhost"
}

async fn handle(mut client: TcpStream) -> Result<(), String> {
    // read the request head
    let mut buf = Vec::with_capacity(2048);
    let mut byte = [0u8; 1];
    while !buf.ends_with(b"\r\n\r\n") {
        let n = client.read(&mut byte).await.map_err(|e| e.to_string())?;
        if n == 0 {
            return Ok(());
        }
        buf.push(byte[0]);
        if buf.len() > 64 * 1024 {
            return Err("request head too large".into());
        }
    }
    let head = String::from_utf8_lossy(&buf).to_string();
    let mut lines = head.split("\r\n");
    let request_line = lines.next().unwrap_or_default().to_string();
    let mut parts = request_line.split_whitespace();
    let method = parts.next().unwrap_or_default().to_string();
    let target = parts.next().unwrap_or_default().to_string();

    if method == "CONNECT" {
        // target = host:port
        let (host, port) = split_host_port(&target, 443);
        let mut server = open_upstream(&host, port).await?;
        client
            .write_all(b"HTTP/1.1 200 Connection Established\r\n\r\n")
            .await
            .map_err(|e| e.to_string())?;
        let _ = tokio::io::copy_bidirectional(&mut client, &mut server).await;
        return Ok(());
    }

    // absolute-form plain HTTP: GET http://host[:port]/path HTTP/1.1
    let url = target;
    let without_scheme = url.strip_prefix("http://").ok_or("unsupported proxy request")?;
    let (authority, path) = match without_scheme.find('/') {
        Some(i) => (&without_scheme[..i], &without_scheme[i..]),
        None => (without_scheme, "/"),
    };
    let (host, port) = split_host_port(authority, 80);

    let mut server = open_upstream(&host, port).await?;

    // rewrite to origin-form, force connection close for simple relaying
    let version = request_line.split_whitespace().nth(2).unwrap_or("HTTP/1.1");
    let mut out = format!("{method} {path} {version}\r\n");
    for line in lines {
        if line.is_empty() {
            break;
        }
        let lower = line.to_ascii_lowercase();
        if lower.starts_with("proxy-connection:") || lower.starts_with("connection:") {
            continue;
        }
        out.push_str(line);
        out.push_str("\r\n");
    }
    out.push_str("Connection: close\r\n\r\n");
    server.write_all(out.as_bytes()).await.map_err(|e| e.to_string())?;

    let _ = tokio::io::copy_bidirectional(&mut client, &mut server).await;
    Ok(())
}

fn split_host_port(authority: &str, default_port: u16) -> (String, u16) {
    // [::1]:8080 form
    if let Some(rest) = authority.strip_prefix('[') {
        if let Some(end) = rest.find(']') {
            let host = &rest[..end];
            let port = rest[end + 1..]
                .strip_prefix(':')
                .and_then(|p| p.parse().ok())
                .unwrap_or(default_port);
            return (format!("[{host}]"), port);
        }
    }
    match authority.rsplit_once(':') {
        Some((host, port)) if port.chars().all(|c| c.is_ascii_digit()) => {
            (host.to_string(), port.parse().unwrap_or(default_port))
        }
        _ => (authority.to_string(), default_port),
    }
}

/// Overall deadline for establishing an upstream connection (bounds a half-open Tor SOCKS port or
/// a hung circuit so a webview request can never hang forever).
const UPSTREAM_TIMEOUT: std::time::Duration = std::time::Duration::from_secs(30);

/// DIRECT for loopback, SOCKS5 (Tor) for everything else.
async fn open_upstream(host: &str, port: u16) -> Result<TcpStream, String> {
    if is_loopback(host) {
        return TcpStream::connect((host.trim_matches(['[', ']']), port))
            .await
            .map_err(|e| format!("direct connect {host}:{port}: {e}"));
    }
    match tokio::time::timeout(UPSTREAM_TIMEOUT, socks5_connect(&upstream(), host, port)).await {
        Ok(result) => result,
        Err(_) => Err(format!("socks5 connect to {host}:{port} timed out")),
    }
}

/// Minimal SOCKS5 client (no auth, domain addressing — hostname resolution happens in Tor,
/// avoiding DNS leaks).
async fn socks5_connect(socks_addr: &str, host: &str, port: u16) -> Result<TcpStream, String> {
    let mut stream = TcpStream::connect(socks_addr)
        .await
        .map_err(|e| format!("socks connect {socks_addr}: {e}"))?;

    stream.write_all(&[0x05, 0x01, 0x00]).await.map_err(|e| e.to_string())?;
    let mut resp = [0u8; 2];
    stream.read_exact(&mut resp).await.map_err(|e| e.to_string())?;
    if resp != [0x05, 0x00] {
        return Err("socks5 greeting failed".into());
    }

    let host_bytes = host.as_bytes();
    if host_bytes.len() > 255 {
        return Err("hostname too long".into());
    }
    let mut req = vec![0x05, 0x01, 0x00, 0x03, host_bytes.len() as u8];
    req.extend_from_slice(host_bytes);
    req.extend_from_slice(&port.to_be_bytes());
    stream.write_all(&req).await.map_err(|e| e.to_string())?;

    let mut reply = [0u8; 4];
    stream.read_exact(&mut reply).await.map_err(|e| e.to_string())?;
    if reply[1] != 0x00 {
        return Err(format!("socks5 connect refused (code {})", reply[1]));
    }
    // consume BND.ADDR + BND.PORT
    match reply[3] {
        0x01 => {
            let mut skip = [0u8; 6];
            stream.read_exact(&mut skip).await.map_err(|e| e.to_string())?;
        }
        0x03 => {
            let mut len = [0u8; 1];
            stream.read_exact(&mut len).await.map_err(|e| e.to_string())?;
            let mut skip = vec![0u8; len[0] as usize + 2];
            stream.read_exact(&mut skip).await.map_err(|e| e.to_string())?;
        }
        0x04 => {
            let mut skip = [0u8; 18];
            stream.read_exact(&mut skip).await.map_err(|e| e.to_string())?;
        }
        _ => return Err("socks5 malformed reply".into()),
    }

    Ok(stream)
}
