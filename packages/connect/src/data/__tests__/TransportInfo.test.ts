import { parseBridgeJSON } from '../TransportInfo';
import * as releases from '@trezor/connect-common/files/bridge/releases.json';

describe('TransportInfo', () => {
    test('parseBridgeJSON', () => {
        expect(parseBridgeJSON(releases)).toEqual({
            version: [2, 0, 27],
            directory: 'bridge/2.0.27/',
            packages: [
                {
                    name: 'Linux 64-bit (deb)',
                    platform: ['deb64'],
                    signature: undefined,
                    url: 'bridge/2.0.27/trezor-bridge_2.0.27_amd64.deb',
                },
                {
                    name: 'Linux 64-bit (rpm)',
                    platform: ['rpm64'],
                    signature: undefined,
                    url: 'bridge/2.0.27/trezor-bridge-2.0.27-1.x86_64.rpm',
                },
                {
                    name: 'Linux 32-bit (deb)',
                    platform: ['deb32'],
                    signature: undefined,
                    url: 'bridge/2.0.27/trezor-bridge_2.0.27_i386.deb',
                },
                {
                    name: 'Linux 32-bit (rpm)',
                    platform: ['rpm32'],
                    signature: undefined,
                    url: 'bridge/2.0.27/trezor-bridge-2.0.27-1.i386.rpm',
                },
                {
                    name: 'macOS',
                    platform: ['mac'],
                    signature: 'bridge/2.0.27/trezor-bridge-2.0.27.pkg.asc',
                    url: 'bridge/2.0.27/trezor-bridge-2.0.27.pkg',
                },
                {
                    name: 'Windows',
                    platform: ['win32', 'win64'],
                    signature: 'bridge/2.0.27/trezor-bridge-2.0.27-win32-install.exe.asc',
                    url: 'bridge/2.0.27/trezor-bridge-2.0.27-win32-install.exe',
                },
            ],
            changelog: '',
        });
    });
});
