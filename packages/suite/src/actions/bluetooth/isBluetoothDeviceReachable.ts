import { type DesktopBluetoothDevice } from './DesktopBluetoothDevice';

/**
 * Desktop bluetooth device in any of these connection status types means that it is present, visible and at least some contact has been made, even if not yet "connected" in the full sense.
 * IMPORTANT: device regularly advertises when in `disconnected` and not paired state
 */
export const isBluetoothDeviceReachable = (device: DesktopBluetoothDevice) =>
    ['paired', 'pairing', 'connecting', 'connected'].includes(device.connectionStatus.type);
