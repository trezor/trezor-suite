pub mod close_device;
pub mod connect_device;
pub mod disconnect_device;
pub mod enumerate;
pub mod forget_device;
pub mod get_info;
pub mod open_device;
pub mod read;
pub mod set_state;
pub mod start_scan;
pub mod stop_scan;
pub mod write;

#[cfg(target_os = "linux")]
mod connect_device_linux;
#[cfg(target_os = "linux")]
pub use self::connect_device_linux::connect_device_linux;

#[cfg(target_os = "windows")]
mod connect_device_windows;
#[cfg(target_os = "windows")]
pub use self::connect_device_windows::connect_device_windows;

#[cfg(target_os = "macos")]
mod connect_device_macos;
#[cfg(target_os = "macos")]
pub use self::connect_device_macos::connect_device_macos;

pub use self::close_device::close_device;
pub use self::connect_device::connect_device;
pub use self::disconnect_device::disconnect_device;
pub use self::enumerate::enumerate;
pub use self::forget_device::forget_device;
pub use self::get_info::get_info;
pub use self::open_device::open_device;
pub use self::read::read;
pub use self::set_state::set_state;
pub use self::start_scan::start_scan;
pub use self::stop_scan::stop_scan;
pub use self::write::write;
