//! Auto-start (launch on login) — Tauri equivalent of Electron
//! `suite-desktop-core/src/libs/auto-start.ts`. Linux mirrors the Electron implementation exactly
//! (XDG autostart .desktop file); macOS uses a LaunchAgent plist (Tauri has no Electron
//! `setLoginItemSettings`); Windows uses the registry Run key.

#[cfg(target_os = "linux")]
const LINUX_AUTOSTART_FILE: &str = "Trezor-Suite.desktop";
#[cfg(target_os = "macos")]
const MAC_LAUNCH_AGENT: &str = "io.trezor.suite.tauri.plist";

fn exe_path() -> String {
    if let Ok(appimage) = std::env::var("APPIMAGE") {
        if !appimage.is_empty() {
            return appimage;
        }
    }
    std::env::current_exe()
        .map(|p| p.to_string_lossy().into_owned())
        .unwrap_or_default()
}

#[cfg(target_os = "linux")]
fn autostart_file() -> Option<std::path::PathBuf> {
    let home = std::env::var("HOME").ok()?;
    Some(
        std::path::Path::new(&home)
            .join(".config/autostart")
            .join(LINUX_AUTOSTART_FILE),
    )
}

#[cfg(target_os = "macos")]
fn launch_agent_file() -> Option<std::path::PathBuf> {
    let home = std::env::var("HOME").ok()?;
    Some(
        std::path::Path::new(&home)
            .join("Library/LaunchAgents")
            .join(MAC_LAUNCH_AGENT),
    )
}

pub fn is_enabled() -> bool {
    #[cfg(target_os = "linux")]
    {
        autostart_file().map(|f| f.exists()).unwrap_or(false)
    }
    #[cfg(target_os = "macos")]
    {
        launch_agent_file().map(|f| f.exists()).unwrap_or(false)
    }
    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("reg")
            .args([
                "query",
                r"HKCU\Software\Microsoft\Windows\CurrentVersion\Run",
                "/v",
                "TrezorSuiteTauri",
            ])
            .output()
            .map(|o| o.status.success())
            .unwrap_or(false)
    }
}

pub fn set_enabled(enabled: bool) {
    #[cfg(target_os = "linux")]
    {
        let Some(file) = autostart_file() else { return };
        if enabled {
            // Flatpak: the sandboxed current_exe() (/app/...) is not runnable from a host autostart
            // entry, so launch via `flatpak run` (unquoted), matching Electron getLinuxExecutable().
            let exec = if std::env::var("container").is_ok() || std::env::var("FLATPAK_ID").is_ok() {
                "flatpak run io.trezor.suite --bridge-daemon".to_string()
            } else {
                format!("\"{}\" --bridge-daemon", exe_path())
            };
            let desktop = format!(
                "[Desktop Entry]\nType=Application\nVersion=1.0\nName=Trezor Suite\n\
                 Comment=Trezor Suite startup script\nExec={exec}\n\
                 StartupNotify=false\nTerminal=false\n",
            );
            if let Some(dir) = file.parent() {
                let _ = std::fs::create_dir_all(dir);
            }
            let _ = std::fs::write(&file, desktop);
        } else if file.exists() {
            let _ = std::fs::remove_file(&file);
        }
    }
    #[cfg(target_os = "macos")]
    {
        let Some(file) = launch_agent_file() else { return };
        if enabled {
            let plist = format!(
                r#"<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key><string>io.trezor.suite.tauri</string>
    <key>ProgramArguments</key>
    <array><string>{}</string><string>--bridge-daemon</string></array>
    <key>RunAtLoad</key><true/>
</dict>
</plist>
"#,
                exe_path()
            );
            if let Some(dir) = file.parent() {
                let _ = std::fs::create_dir_all(dir);
            }
            let _ = std::fs::write(&file, plist);
        } else if file.exists() {
            let _ = std::fs::remove_file(&file);
        }
    }
    #[cfg(target_os = "windows")]
    {
        if enabled {
            let _ = std::process::Command::new("reg")
                .args([
                    "add",
                    r"HKCU\Software\Microsoft\Windows\CurrentVersion\Run",
                    "/v",
                    "TrezorSuiteTauri",
                    "/t",
                    "REG_SZ",
                    "/d",
                    &format!("\"{}\" --bridge-daemon", exe_path()),
                    "/f",
                ])
                .output();
        } else {
            let _ = std::process::Command::new("reg")
                .args([
                    "delete",
                    r"HKCU\Software\Microsoft\Windows\CurrentVersion\Run",
                    "/v",
                    "TrezorSuiteTauri",
                    "/f",
                ])
                .output();
        }
    }
}
