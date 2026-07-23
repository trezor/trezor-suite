//! Application menu — Tauri equivalent of Electron `libs/menu.ts` + `modules/shortcuts.ts`
//! (the shortcuts live on the menu items as accelerators).

use tauri::menu::{MenuBuilder, MenuItemBuilder, SubmenuBuilder};
use tauri::{AppHandle, Emitter};

pub fn build(app: &AppHandle) -> tauri::Result<()> {
    #[cfg(target_os = "macos")]
    let app_menu = SubmenuBuilder::new(app, "Trezor Suite")
        .about(None)
        .separator()
        .services()
        .separator()
        .hide()
        .hide_others()
        .show_all()
        .separator()
        .quit()
        .build()?;

    let restart = MenuItemBuilder::with_id("app-restart", "Restart").build(app)?;
    let file = {
        let builder = SubmenuBuilder::new(app, "File").item(&restart);
        if cfg!(target_os = "macos") {
            builder.close_window().build()?
        } else {
            builder.quit().build()?
        }
    };

    let find = MenuItemBuilder::with_id("find-show", "Find")
        .accelerator("CmdOrCtrl+F")
        .build(app)?;
    let edit = SubmenuBuilder::new(app, "Edit")
        .undo()
        .redo()
        .separator()
        .cut()
        .copy()
        .paste()
        .select_all()
        .separator()
        .item(&find)
        .build()?;

    let reload = MenuItemBuilder::with_id("view-reload", "Reload")
        .accelerator("CmdOrCtrl+R")
        .build(app)?;
    let force_reload = MenuItemBuilder::with_id("view-force-reload", "Force Reload")
        .accelerator("CmdOrCtrl+Shift+R")
        .build(app)?;
    let zoom_reset = MenuItemBuilder::with_id("zoom-reset", "Actual Size")
        .accelerator("CmdOrCtrl+0")
        .build(app)?;
    let zoom_in = MenuItemBuilder::with_id("zoom-in", "Zoom In")
        .accelerator("CmdOrCtrl+=")
        .build(app)?;
    let zoom_out = MenuItemBuilder::with_id("zoom-out", "Zoom Out")
        .accelerator("CmdOrCtrl+-")
        .build(app)?;
    let view = {
        let mut builder = SubmenuBuilder::new(app, "View")
            .item(&reload)
            .item(&force_reload);
        // Electron strips toggleDevTools outside dev; Tauri only has devtools in debug builds
        #[cfg(debug_assertions)]
        {
            let devtools = MenuItemBuilder::with_id("toggle-devtools", "Toggle Developer Tools")
                .accelerator("F12")
                .build(app)?;
            builder = builder.item(&devtools);
        }
        builder = builder
            .separator()
            .item(&zoom_reset)
            .item(&zoom_in)
            .item(&zoom_out)
            .separator()
            .fullscreen();
        builder.build()?
    };

    let window = SubmenuBuilder::new(app, "Window").minimize().maximize().build()?;

    let guide = MenuItemBuilder::with_id("guide-open", "Guide").build(app)?;
    let support = MenuItemBuilder::with_id("guide-support", "Support and feedback").build(app)?;
    let shortcuts = MenuItemBuilder::with_id("guide-shortcuts", "Keyboard shortcuts").build(app)?;
    let website = MenuItemBuilder::with_id("trezor-website", "Trezor website").build(app)?;
    let help = SubmenuBuilder::new(app, "Help")
        .item(&guide)
        .item(&support)
        .item(&shortcuts)
        .separator()
        .item(&website)
        .build()?;

    let mut menu_builder = MenuBuilder::new(app);
    #[cfg(target_os = "macos")]
    {
        menu_builder = menu_builder.item(&app_menu);
    }
    let menu = menu_builder
        .item(&file)
        .item(&edit)
        .item(&view)
        .item(&window)
        .item(&help)
        .build()?;
    app.set_menu(menu)?;

    app.on_menu_event(|app, event| {
        let emit = |channel: &str| {
            let _ = app.emit(&format!("desktop://{channel}"), serde_json::Value::Null);
        };
        match event.id().as_ref() {
            "app-restart" => crate::window::restart(app),
            "find-show" => emit("find:show"),
            "view-reload" => crate::window::reload(app),
            "view-force-reload" => crate::window::reload(app),
            #[cfg(debug_assertions)]
            "toggle-devtools" => {
                if let Some(win) = crate::window::main_window(app) {
                    if win.is_devtools_open() {
                        win.close_devtools();
                    } else {
                        win.open_devtools();
                    }
                }
            }
            "zoom-reset" => crate::window::zoom_by(app, None),
            "zoom-in" => crate::window::zoom_by(app, Some(0.1)),
            "zoom-out" => crate::window::zoom_by(app, Some(-0.1)),
            "guide-open" => emit("guide/open"),
            "guide-support" => emit("guide/open-support-feedback"),
            "guide-shortcuts" => emit("guide/open-shortcuts"),
            "trezor-website" => crate::external_links::open(app, "https://trezor.io/"),
            _ => {}
        }
    });

    Ok(())
}
