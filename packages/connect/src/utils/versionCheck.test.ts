import { getCallerAppName } from './versionCheck';
import { ConnectSettings, Manifest } from '../types/settings';

const getSettings = (settings: Partial<ConnectSettings>) => settings as ConnectSettings;
const manifest = { email: 'dev@example.com', appUrl: 'https://example.com' };

describe(getCallerAppName.name, () => {
    it('returns undefined before the settings are known', () => {
        expect(getCallerAppName(undefined)).toBeUndefined();
    });

    it('prefers the label of a known host over the name declared by the caller', () => {
        const settings = getSettings({
            hostLabel: 'MetaMask',
            origin: 'https://example.com',
            manifest: { ...manifest, appName: 'Trezor Suite' },
        });

        expect(getCallerAppName(settings)).toBe('MetaMask');
    });

    it('uses the name from the manifest', () => {
        const settings = getSettings({
            origin: 'https://example.com',
            manifest: { ...manifest, appName: '  Example Wallet ' },
        });

        expect(getCallerAppName(settings)).toBe('Example Wallet');
    });

    it.each([undefined, '', '   '])('falls back to the origin for app name "%s"', appName => {
        const settings = getSettings({
            origin: 'https://example.com',
            // Older integrations omit `appName`, which parseManifest accepts.
            manifest: { ...manifest, appName } as Manifest,
        });

        expect(getCallerAppName(settings)).toBe('https://example.com');
    });

    it('truncates an overly long name from the manifest', () => {
        const settings = getSettings({ manifest: { ...manifest, appName: 'a'.repeat(1000) } });

        expect(getCallerAppName(settings)).toBe(`${'a'.repeat(64)}…`);
    });
});
