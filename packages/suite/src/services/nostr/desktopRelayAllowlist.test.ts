import { desktopApi } from '@trezor/suite-desktop-api';

import { syncDesktopRelayAllowlist } from './desktopRelayAllowlist';

jest.mock('@trezor/suite-desktop-api', () => ({
    __esModule: true,
    desktopApi: {
        available: true,
        setContactsRelayAllowedHosts: jest.fn(() => Promise.resolve()),
    },
}));

const mockSetContactsRelayAllowedHosts = jest.mocked(desktopApi.setContactsRelayAllowedHosts);

describe('syncDesktopRelayAllowlist', () => {
    beforeEach(() => {
        desktopApi.available = true;
        mockSetContactsRelayAllowedHosts.mockClear();
    });

    it('admits each relay hostname once and skips unparsable URLs', async () => {
        await syncDesktopRelayAllowlist([
            'wss://relay.example.com',
            'wss://relay.example.com:7447/nostr',
            'not a url',
            'ws://localhost:7777',
        ]);

        expect(mockSetContactsRelayAllowedHosts).toHaveBeenCalledWith([
            'relay.example.com',
            'localhost',
        ]);
    });

    it('clears the allowlist when no relay is configured', async () => {
        await syncDesktopRelayAllowlist([]);

        expect(mockSetContactsRelayAllowedHosts).toHaveBeenCalledWith([]);
    });

    it('does nothing outside the desktop app', async () => {
        desktopApi.available = false;

        await syncDesktopRelayAllowlist(['wss://relay.example.com']);

        expect(mockSetContactsRelayAllowedHosts).not.toHaveBeenCalled();
    });

    it('resolves even if the desktop app rejects the update', async () => {
        mockSetContactsRelayAllowedHosts.mockImplementationOnce(() =>
            Promise.reject(new Error('IPC failed')),
        );

        await expect(syncDesktopRelayAllowlist(['wss://relay.example.com'])).resolves.toBe(
            undefined,
        );
    });
});
