//! External links — Tauri equivalent of Electron `modules/external-links.ts`: only http(s) URLs
//! may leave the app, and they open in the user's default browser. (The Electron build shows a
//! native confirmation dialog when Tor is running; here the renderer intercept opens links
//! directly — noted as a parity delta in the README.)

use tauri::AppHandle;

/// Only http/https URLs may leave the app (Electron `config.allowedProtocols`). Parse the URL and
/// check the scheme exactly — a `starts_with` prefix check is too weak, and the value comes from
/// the renderer (`__external-link`), so it must not be trusted verbatim.
fn is_http_url(url: &str) -> bool {
    match tauri::Url::parse(url) {
        Ok(u) => u.scheme() == "http" || u.scheme() == "https",
        Err(_) => false,
    }
}

pub fn open(_app: &AppHandle, url: &str) {
    if !is_http_url(url) {
        log::error!("external-links: refusing to open non-http(s) url");
        return;
    }
    log::info!("external-links: opening url in default browser");

    #[cfg(target_os = "macos")]
    let result = std::process::Command::new("open").arg(url).spawn();
    #[cfg(target_os = "linux")]
    let result = std::process::Command::new("xdg-open").arg(url).spawn();
    // Avoid cmd.exe: `start` re-parses its command line (&, |, ^, %, "), which is injectable.
    // rundll32 + FileProtocolHandler passes the URL as a single argument to the shell API.
    #[cfg(target_os = "windows")]
    let result = std::process::Command::new("rundll32")
        .args(["url.dll,FileProtocolHandler", url])
        .spawn();

    if let Err(e) = result {
        log::error!("external-links: failed to open url: {e}");
    }
}
