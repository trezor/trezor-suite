//! Tray icon — Tauri equivalent of Electron `modules/tray.ts`: shown only when
//! `traySettings.showOnTray`, context menu with bridge status/toggle, launch, hide-icon and quit.

use serde_json::json;
use std::sync::Mutex;
use tauri::menu::{MenuBuilder, MenuItemBuilder, PredefinedMenuItem};
use tauri::tray::TrayIconBuilder;
use tauri::{AppHandle, Emitter, Manager};

pub struct TrayState {
    icon: Mutex<Option<tauri::tray::TrayIcon>>,
}

impl TrayState {
    pub fn new() -> Self {
        TrayState {
            icon: Mutex::new(None),
        }
    }
}

/// (Re)build the tray according to settings + bridge status. Mirrors Electron `renderTray`.
pub fn render(app: &AppHandle) {
    let store = app.state::<crate::store::Store>();
    let visible = store
        .tray_settings()
        .get("showOnTray")
        .and_then(|v| v.as_bool())
        .unwrap_or(false);

    let tray_state = app.state::<TrayState>();
    if !visible {
        // drop destroys the OS tray icon
        *tray_state.icon.lock().unwrap() = None;
        return;
    }

    let bridge_running = {
        let bridge_state = app.state::<crate::bridge::BridgeState>();
        crate::bridge::status(&bridge_state)
            .get("process")
            .and_then(|v| v.as_bool())
            .unwrap_or(false)
    };

    let result: tauri::Result<()> = (|| {
        let bridge_label = if bridge_running {
            "🟢  Trezor Bridge is running"
        } else {
            "🔴  Trezor Bridge not running"
        };
        let bridge_item = MenuItemBuilder::with_id("tray-bridge-toggle", bridge_label).build(app)?;
        let launch = MenuItemBuilder::with_id("tray-launch", "Launch Trezor Suite").build(app)?;
        let hide_icon = MenuItemBuilder::with_id("tray-hide-icon", "Hide icon from tray").build(app)?;
        let quit = MenuItemBuilder::with_id("tray-quit", "Stop Trezor Bridge and Quit").build(app)?;
        let menu = MenuBuilder::new(app)
            .item(&bridge_item)
            .item(&PredefinedMenuItem::separator(app)?)
            .item(&launch)
            .item(&hide_icon)
            .item(&quit)
            .build()?;

        let mut builder = TrayIconBuilder::with_id("main-tray")
            .tooltip("Trezor Suite")
            .menu(&menu)
            .show_menu_on_left_click(true)
            .on_menu_event(|app, event| match event.id().as_ref() {
                "tray-bridge-toggle" => {
                    let state = app.state::<crate::bridge::BridgeState>();
                    if crate::bridge::process_running(&state) {
                        crate::bridge::stop(&state);
                    } else {
                        crate::bridge::spawn(app, &state);
                    }
                    crate::bridge::emit_status(app, &state);
                    render(app);
                }
                "tray-launch" => crate::http_receiver::focus_main_window(app),
                "tray-hide-icon" => {
                    let store = app.state::<crate::store::Store>();
                    store.set_tray_settings(&json!({ "showOnTray": false }));
                    let _ = app.emit("desktop://tray/settings", store.tray_settings());
                    render(app);
                }
                "tray-quit" => {
                    let state = app.state::<crate::bridge::BridgeState>();
                    crate::bridge::stop(&state);
                    app.exit(0);
                }
                _ => {}
            });
        if let Some(icon) = app.default_window_icon() {
            builder = builder.icon(icon.clone());
        }
        let tray = builder.build(app)?;
        *tray_state.icon.lock().unwrap() = Some(tray);
        Ok(())
    })();

    if let Err(e) = result {
        log::error!("tray: failed to render: {e}");
    }
}
