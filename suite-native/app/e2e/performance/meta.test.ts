import { isDeviceLogFile } from './deviceLogs';
import { resolveDevice, resolvePlatform } from './meta';

const detoxConfig = {
    devices: {
        simulator: { type: 'ios.simulator', device: { type: 'iPhone 11' } },
        emulator: { type: 'android.emulator', device: { avdName: 'Pixel_6_API_34' } },
    },
    configurations: {
        'ios.sim.release': { device: 'simulator', app: 'ios.release' },
        'android.emu.release': { device: 'emulator', app: 'android.release' },
        'android.emu.debug': { device: 'emulator', app: 'android.debug' },
    },
};

describe('resolvePlatform', () => {
    it.each([
        [['android.emu.release'], 'android'],
        [['android.emu.release', 'android.emu.debug'], 'android'],
        [['ios.sim.release'], 'ios'],
        [[], 'unknown'],
        [['android.emu.release', 'ios.sim.release'], 'unknown'],
        [['whatever'], 'unknown'],
    ])('reads %s as %s', (configurations, expected) => {
        expect(resolvePlatform(configurations)).toBe(expected);
    });
});

describe('resolveDevice', () => {
    it('names the emulator behind a configuration', () => {
        expect(resolveDevice(detoxConfig, ['android.emu.release'])).toBe('Pixel_6_API_34');
    });

    it('names the simulator behind a configuration', () => {
        expect(resolveDevice(detoxConfig, ['ios.sim.release'])).toBe('iPhone 11');
    });

    it('names each distinct device once', () => {
        expect(
            resolveDevice(detoxConfig, [
                'android.emu.release',
                'android.emu.debug',
                'ios.sim.release',
            ]),
        ).toBe('Pixel_6_API_34, iPhone 11');
    });

    it('falls back to unknown for a configuration it cannot resolve', () => {
        expect(resolveDevice(detoxConfig, ['android.attached.release'])).toBe('unknown');
        expect(resolveDevice({}, ['android.emu.release'])).toBe('unknown');
    });
});

describe('isDeviceLogFile', () => {
    it.each([
        ['device.log', true],
        ['emulator-5554 2026-09-17 10-11-12.startup.log', true],
        ['detox_pid_4242.log', false],
        ['detox_pid_4242.json.log', false],
        ['test.png', false],
    ])('reads %s as a device log: %s', (fileName, expected) => {
        expect(isDeviceLogFile(fileName)).toBe(expected);
    });
});
