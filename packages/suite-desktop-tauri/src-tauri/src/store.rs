//! Persistent settings store — the Tauri equivalent of the Electron
//! `suite-desktop-core/src/libs/store.ts` (electron-store): one JSON file in the app data dir
//! holding window bounds and per-feature settings, with the same keys and defaults.

use serde_json::{json, Value};
use std::fs;
use std::io::Write;
use std::path::PathBuf;
use std::sync::Mutex;
use tauri::{AppHandle, Manager};

pub struct Store {
    path: Mutex<Option<PathBuf>>,
    data: Mutex<Value>,
}

impl Store {
    pub fn new() -> Self {
        Store {
            path: Mutex::new(None),
            data: Mutex::new(json!({})),
        }
    }

    /// Bind the store to `<app_data_dir>/store.json` and load it. Called once in setup.
    pub fn load(&self, app: &AppHandle) {
        let Ok(dir) = app.path().app_data_dir() else {
            return;
        };
        let _ = fs::create_dir_all(&dir);
        let path = dir.join("store.json");
        let data = fs::read_to_string(&path)
            .ok()
            .and_then(|s| serde_json::from_str::<Value>(&s).ok())
            .unwrap_or_else(|| json!({}));
        *self.data.lock().unwrap() = data;
        *self.path.lock().unwrap() = Some(path);
    }

    /// Atomically persist `data` to store.json: write a sibling temp file, fsync, then rename over
    /// the target (atomic replace on POSIX + Windows). A crash mid-write can never truncate the
    /// real file — the worst case is a leftover *.tmp, not lost settings (electron-store parity).
    fn write_snapshot(&self, data: &Value) {
        let path = self.path.lock().unwrap().clone();
        let Some(path) = path else { return };
        let Ok(s) = serde_json::to_string_pretty(data) else {
            return;
        };
        let tmp = path.with_extension("json.tmp");
        let write_ok = (|| -> std::io::Result<()> {
            let mut f = fs::File::create(&tmp)?;
            f.write_all(s.as_bytes())?;
            f.sync_all()?;
            Ok(())
        })()
        .is_ok();
        if write_ok {
            if fs::rename(&tmp, &path).is_err() {
                let _ = fs::remove_file(&tmp);
            }
        } else {
            let _ = fs::remove_file(&tmp);
        }
    }

    /// Merge a stored object over `default` so newly-added fields get their default (shared by get()
    /// and the read side of merge()).
    fn defaulted(stored: Option<&Value>, default: &Value) -> Value {
        match stored {
            Some(v) if !v.is_null() => {
                if let (Some(def), Some(cur)) = (default.as_object(), v.as_object()) {
                    let mut merged = def.clone();
                    for (k, val) in cur {
                        merged.insert(k.clone(), val.clone());
                    }
                    Value::Object(merged)
                } else {
                    v.clone()
                }
            }
            _ => default.clone(),
        }
    }

    pub fn get(&self, key: &str, default: Value) -> Value {
        let data = self.data.lock().unwrap();
        Self::defaulted(data.get(key), &default)
    }

    pub fn set(&self, key: &str, value: Value) {
        let snapshot = {
            let mut data = self.data.lock().unwrap();
            if let Some(obj) = data.as_object_mut() {
                obj.insert(key.to_string(), value);
            }
            data.clone()
        };
        self.write_snapshot(&snapshot);
    }

    /// Shallow-merge `patch` into the stored object under `key` (over its defaults). The whole
    /// read-modify-write happens under ONE lock so concurrent set_*_settings calls can't lose
    /// each other's writes (desktop_invoke commands run concurrently on the async runtime).
    pub fn merge(&self, key: &str, default: Value, patch: &Value) {
        let snapshot = {
            let mut data = self.data.lock().unwrap();
            let mut current = Self::defaulted(data.get(key), &default);
            if let (Some(cur), Some(p)) = (current.as_object_mut(), patch.as_object()) {
                for (k, v) in p {
                    cur.insert(k.clone(), v.clone());
                }
            }
            if let Some(obj) = data.as_object_mut() {
                obj.insert(key.to_string(), current);
            }
            data.clone()
        };
        self.write_snapshot(&snapshot);
    }

    /// Deletes all items from the store (`store/clear`).
    pub fn clear(&self) {
        let snapshot = {
            let mut data = self.data.lock().unwrap();
            *data = json!({});
            data.clone()
        };
        self.write_snapshot(&snapshot);
    }

    // --- typed accessors (defaults mirror libs/store.ts) ------------------------------------

    pub fn win_bounds(&self) -> Value {
        self.get("winBounds", json!({ "width": 1280, "height": 720 }))
    }

    pub fn set_win_bounds(&self, bounds: Value) {
        let w = bounds.get("width").and_then(|v| v.as_f64()).unwrap_or(0.0);
        let h = bounds.get("height").and_then(|v| v.as_f64()).unwrap_or(0.0);
        // save only non zero dimensions
        if w > 0.0 && h > 0.0 {
            self.set("winBounds", bounds);
        }
    }

    pub fn update_settings(&self) -> Value {
        self.get(
            "updateSettings",
            json!({ "allowPrerelease": false, "isAutomaticUpdateEnabled": false }),
        )
    }

    pub fn set_update_settings(&self, patch: &Value) {
        self.merge(
            "updateSettings",
            json!({ "allowPrerelease": false, "isAutomaticUpdateEnabled": false }),
            patch,
        );
    }

    pub fn theme_settings(&self) -> String {
        self.get("themeSettings", json!("system"))
            .as_str()
            .unwrap_or("system")
            .to_string()
    }

    pub fn set_theme_settings(&self, theme: &str) {
        self.set("themeSettings", json!(theme));
    }

    fn tor_defaults() -> Value {
        json!({
            "running": false,
            "port": 9050,
            "controlPort": 9051,
            "host": "127.0.0.1",
            "useExternalTor": false,
            "externalPort": 9050,
            "torDataDir": "",
        })
    }

    pub fn tor_settings(&self) -> Value {
        self.get("torSettings", Self::tor_defaults())
    }

    pub fn set_tor_settings(&self, patch: &Value) {
        self.merge("torSettings", Self::tor_defaults(), patch);
    }

    pub fn bridge_settings(&self) -> Value {
        self.get(
            "bridgeSettings",
            json!({ "doNotStartOnStartup": false, "legacy": false }),
        )
    }

    pub fn set_bridge_settings(&self, patch: &Value) {
        self.merge(
            "bridgeSettings",
            json!({ "doNotStartOnStartup": false, "legacy": false }),
            patch,
        );
    }

    pub fn tray_settings(&self) -> Value {
        self.get("traySettings", json!({ "showOnTray": false }))
    }

    pub fn set_tray_settings(&self, patch: &Value) {
        self.merge("traySettings", json!({ "showOnTray": false }), patch);
    }

    fn connect_defaults() -> Value {
        json!({
            "disableWs": false,
            "autoStartDontAskAgain": false,
            "hasUsedConnectWs": false,
        })
    }

    pub fn connect_settings(&self) -> Value {
        self.get("connectSettings", Self::connect_defaults())
    }

    pub fn set_connect_settings(&self, patch: &Value) {
        self.merge("connectSettings", Self::connect_defaults(), patch);
    }

    pub fn bio_auth_settings(&self) -> Value {
        self.get("bioAuthSettings", json!({}))
    }

    pub fn set_bio_auth_settings(&self, patch: &Value) {
        self.merge("bioAuthSettings", json!({}), patch);
    }

    pub fn mcp_settings(&self) -> Value {
        self.get("mcpSettings", json!({ "enabled": false, "port": 21340 }))
    }

    pub fn set_mcp_settings(&self, patch: &Value) {
        self.merge("mcpSettings", json!({ "enabled": false, "port": 21340 }), patch);
    }
}
