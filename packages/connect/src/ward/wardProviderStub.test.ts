import { parseConnectSettings } from '@trezor/connect-common/src/data/connectSettings';

import { createWardProviderStub } from './wardProviderStub';

const noopLogger = { debug: () => {} } as any;

describe('wardProvider registration', () => {
    it('the stub fails the pull rather than answering it', () => {
        expect(() => createWardProviderStub(noopLogger).serveEntry({ entry_key: 'ff' })).toThrow(
            'wardProvider.serveEntry is not implemented',
        );
    });

    it('a host-supplied provider survives settings parsing', () => {
        const wardProvider = { serveEntry: () => ({ proof: [] }) };

        expect(parseConnectSettings({ wardProvider }).wardProvider).toBe(wardProvider);
    });

    it('is absent when the host supplies nothing (core substitutes the stub)', () => {
        expect(parseConnectSettings({}).wardProvider).toBeUndefined();
    });
});
