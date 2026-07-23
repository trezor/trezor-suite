//! macOS-only native integrations:
//! - bio-auth (Touch ID) via LocalAuthentication — Electron `modules/bioAuthModule.ts`
//!   (`systemPreferences.canPromptTouchID` / `promptTouchID`)
//! - power-monitor suspend notification via NSWorkspace — Electron `modules/power-monitor.ts`

use block2::RcBlock;
use objc2::runtime::Bool;
use objc2_app_kit::NSWorkspace;
use objc2_foundation::{NSNotification, NSString};
use objc2_local_authentication::{LAContext, LAPolicy};
use serde_json::{json, Value};
use std::ptr::NonNull;
use std::sync::Mutex;
use std::time::{Duration, Instant};
use tauri::{AppHandle, Emitter, Manager};

const PROMPT_REASON: &str = "Trezor Suite: validation BIO authentication to access the Suite UI";
const BLUR_LOCK_TIMEOUT: Duration = Duration::from_secs(5 * 60);
const MASTER_LOCK_TIMEOUT: Duration = Duration::from_secs(24 * 60 * 60);

#[derive(Default)]
struct BioAuthInner {
    validated_at: Option<Instant>,
    blurred_at: Option<Instant>,
}

/// Validation state with the same semantics as the Electron BioAuth class: validation expires
/// 24h after success, or 5 minutes after the window loses focus.
///
/// Both fields live under one mutex — they were previously two, which allowed an AB-BA
/// lock-ordering deadlock between `is_validated` (tokio worker) and `on_focus_change` (event loop).
pub struct BioAuthState {
    inner: Mutex<BioAuthInner>,
}

impl BioAuthState {
    pub fn new() -> Self {
        BioAuthState {
            inner: Mutex::new(BioAuthInner::default()),
        }
    }

    pub fn mark_validated(&self) {
        let mut s = self.inner.lock().unwrap();
        s.validated_at = Some(Instant::now());
        s.blurred_at = None;
    }

    pub fn is_validated(&self) -> bool {
        let s = self.inner.lock().unwrap();
        let Some(at) = s.validated_at else {
            return false;
        };
        if at.elapsed() > MASTER_LOCK_TIMEOUT {
            return false;
        }
        if let Some(blur) = s.blurred_at {
            if blur.elapsed() > BLUR_LOCK_TIMEOUT {
                return false;
            }
        }
        true
    }

    pub fn on_focus_change(&self, focused: bool) {
        let mut s = self.inner.lock().unwrap();
        if focused {
            // only clear the pending blur timeout if it has not expired yet
            if let Some(blur) = s.blurred_at {
                if blur.elapsed() > BLUR_LOCK_TIMEOUT {
                    s.validated_at = None;
                }
            }
            s.blurred_at = None;
        } else if s.blurred_at.is_none() {
            s.blurred_at = Some(Instant::now());
        }
    }
}

pub fn bio_auth_available() -> bool {
    unsafe {
        let ctx = LAContext::new();
        ctx.canEvaluatePolicy_error(LAPolicy::DeviceOwnerAuthenticationWithBiometrics)
            .is_ok()
    }
}

/// Prompt Touch ID and block until the user responds (call from a blocking task).
pub fn bio_auth_validate(message: Option<String>) -> Result<(), String> {
    let (tx, rx) = std::sync::mpsc::channel::<Result<(), String>>();

    unsafe {
        let ctx = LAContext::new();
        if let Err(e) = ctx.canEvaluatePolicy_error(LAPolicy::DeviceOwnerAuthenticationWithBiometrics)
        {
            return Err(format!("bio auth not available: {}", e.localizedDescription()));
        }
        let reason = NSString::from_str(message.as_deref().unwrap_or(PROMPT_REASON));
        let block = RcBlock::new(
            move |success: Bool, error: *mut objc2_foundation::NSError| {
                let result = if success.as_bool() {
                    Ok(())
                } else {
                    let message = error
                        .as_ref()
                        .map(|e| e.localizedDescription().to_string())
                        .unwrap_or_else(|| "validation failed".to_string());
                    Err(message)
                };
                let _ = tx.send(result);
            },
        );
        ctx.evaluatePolicy_localizedReason_reply(
            LAPolicy::DeviceOwnerAuthenticationWithBiometrics,
            &reason,
            &block,
        );
    }

    rx.recv_timeout(Duration::from_secs(180))
        .unwrap_or_else(|_| Err("validation timed out".to_string()))
}

/// Background watcher that pushes bio-auth state changes to the renderer, mirroring Electron's
/// BioAuthModule timers/pollers:
/// - the validation lock EXPIRES silently on read in is_validated(); poll for the true→false edge
///   and emit `bio-auth/validation-status-changed=false` so BioAuthGuard re-shows the lock overlay
///   after the 24h master / 5-min blur timeout;
/// - biometric availability can change at runtime (enroll/remove a fingerprint); emit
///   `bio-auth/bio-auth-availability-changed` on change.
pub fn spawn_bio_auth_watcher(app: &AppHandle) {
    let app = app.clone();
    tauri::async_runtime::spawn(async move {
        let mut prev_validated = app.state::<BioAuthState>().is_validated();
        let mut prev_available = bio_auth_available();
        loop {
            tokio::time::sleep(Duration::from_secs(10)).await;

            let validated = app.state::<BioAuthState>().is_validated();
            if prev_validated && !validated {
                let _ = app.emit("desktop://bio-auth/validation-status-changed", false);
            }
            prev_validated = validated;

            let available = bio_auth_available();
            if available != prev_available {
                let _ = app.emit("desktop://bio-auth/bio-auth-availability-changed", available);
                prev_available = available;
            }
        }
    });
}

/// NSWorkspace will-sleep → `power-monitor/suspend` renderer event. Must be called on the main
/// thread (Tauri setup). The observer lives for the app lifetime.
pub fn register_power_monitor(app: &AppHandle) {
    let app = app.clone();
    unsafe {
        let workspace = NSWorkspace::sharedWorkspace();
        let center = workspace.notificationCenter();
        let block = RcBlock::new(move |_note: NonNull<NSNotification>| {
            log::info!("power-monitor: suspend event detected");
            let _ = app.emit("desktop://power-monitor/suspend", Value::Null);
        });
        let observer = center.addObserverForName_object_queue_usingBlock(
            Some(objc2_app_kit::NSWorkspaceWillSleepNotification),
            None,
            None,
            &block,
        );
        // keep the observer alive forever
        std::mem::forget(observer);
    }
    let _ = json!(null); // keep serde_json import used
}
