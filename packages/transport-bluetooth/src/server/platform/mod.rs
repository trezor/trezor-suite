#[cfg(target_os = "linux")]
mod platform_linux;
#[cfg(target_os = "linux")]
pub use self::platform_linux::{get_device_address, is_device_paired};

#[cfg(target_os = "macos")]
mod platform_macos;
#[cfg(target_os = "macos")]
pub use self::platform_macos::{get_device_address, is_device_paired};

#[cfg(target_os = "windows")]
mod platform_windows;
#[cfg(target_os = "windows")]
pub use self::platform_windows::{get_device_address, is_device_paired};
