use btleplug::platform::Peripheral;

pub trait PlatformDevice {
    async fn is_paired(peripheral: &Peripheral) -> Result<bool, Box<dyn std::error::Error + Send + Sync>>;

    fn get_address(peripheral: Peripheral) -> String;
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
