//! user-data handlers — Tauri equivalent of Electron `suite-desktop-core/src/libs/user-data.ts`
//! (`user-data/open`, `user-data/clear`).

use serde_json::{json, Value};
use std::path::{Path, PathBuf};
use std::process::Command;
use tauri::{AppHandle, Manager};

/// Resolve `directory` inside the user data dir, refusing path traversal (mirrors
/// `resolveDirectoryInUserDataDir`).
fn resolve_in_user_data(app: &AppHandle, directory: &str) -> Result<PathBuf, String> {
    let user_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("no user data dir: {e}"))?;

    // An absolute or drive/UNC-qualified `directory` would make PathBuf::join REPLACE the base and
    // escape the user-data dir (esp. on Windows: "C:/Windows", "\\\\server\\share"). Reject up front.
    let as_path = std::path::Path::new(directory);
    if as_path.is_absolute()
        || directory.contains(':')
        || directory.starts_with('\\')
        || directory.contains('\0')
    {
        return Err(format!(
            "Path traversal attempt detected, directory: \"{directory}\""
        ));
    }

    let joined = user_dir.join(directory.trim_start_matches(['/', '\\']));
    // reject any `..` component …
    if joined
        .components()
        .any(|c| matches!(c, std::path::Component::ParentDir))
    {
        return Err(format!(
            "Path traversal attempt detected, directory: \"{directory}\""
        ));
    }
    // … and assert the result is still contained in the user-data dir (Electron's startsWith check)
    if !joined.starts_with(&user_dir) {
        return Err(format!(
            "Path traversal attempt detected, directory: \"{directory}\""
        ));
    }
    Ok(joined)
}

/// Open a directory inside the user data dir in the OS file manager (`shell.openPath`).
pub fn open(app: &AppHandle, directory: &str) -> Value {
    let dir = match resolve_in_user_data(app, directory) {
        Ok(d) => d,
        Err(error) => return json!({ "success": false, "error": error }),
    };
    let _ = std::fs::create_dir_all(&dir);
    match open_path(&dir) {
        Ok(()) => json!({ "success": true }),
        Err(error) => json!({ "success": false, "error": error }),
    }
}

pub fn open_path(path: &Path) -> Result<(), String> {
    #[cfg(target_os = "macos")]
    let result = Command::new("open").arg(path).spawn();
    #[cfg(target_os = "linux")]
    let result = Command::new("xdg-open").arg(path).spawn();
    #[cfg(target_os = "windows")]
    let result = Command::new("explorer").arg(path).spawn();

    result.map(|_| ()).map_err(|e| e.to_string())
}

/// Clear the whole app data folder (`user-data/clear`), disabling autostart first — its
/// persistence lives in OS integration, not in the app data folder.
pub fn clear(app: &AppHandle) -> Value {
    crate::auto_start::set_enabled(false);
    let Ok(user_dir) = app.path().app_data_dir() else {
        return json!({ "success": false, "error": "no user data dir" });
    };
    match std::fs::remove_dir_all(&user_dir) {
        Ok(()) => json!({ "success": true }),
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => json!({ "success": true }),
        Err(e) => json!({ "success": false, "error": e.to_string() }),
    }
}
