export const defaultMessages = {
    heading: 'Trezor Bridge status',
    version: 'version',
    'bridge.description':
        'Trezor Bridge is a small tool facilitating connection between Trezor devices and computer applications',
    devices: 'Devices',
    'devices.no.connected': 'No connected devices',
    'devices.connected.num': 'Connected devices: {number}',
    logs: 'Logs',
};

export type Messages = Record<keyof typeof defaultMessages, string>;
