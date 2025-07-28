use crate::server::{
    adapter_manager::AdapterManager, types::ConnectDeviceParams, ConnectionBroadcast,
};
use btleplug::platform::Peripheral;

#[derive(Clone, Debug)]
pub struct ConnectDeviceContext {
    pub manager: AdapterManager,
    pub params: ConnectDeviceParams,
    #[allow(dead_code)]
    pub broadcast: ConnectionBroadcast, // only for linux
}

pub type PlatformError = Box<dyn std::error::Error + Send + Sync>;

pub trait PlatformDevice {
    async fn is_paired(peripheral: &Peripheral) -> Result<bool, PlatformError>;

    fn get_address(peripheral: Peripheral) -> String;

    async fn connect(ctx: ConnectDeviceContext) -> Result<(), PlatformError>;

    async fn forget(id: String) -> Result<(), PlatformError>;
}

#[cfg(target_os = "linux")]
mod linux;
#[cfg(target_os = "linux")]
pub type BluetoothDevice = self::linux::LinuxDevice;

#[cfg(target_os = "macos")]
mod macos;
#[cfg(target_os = "macos")]
pub type BluetoothDevice = self::macos::MacosDevice;

#[cfg(target_os = "windows")]
mod windows;
#[cfg(target_os = "windows")]
pub type BluetoothDevice = self::windows::WindowsDevice;
