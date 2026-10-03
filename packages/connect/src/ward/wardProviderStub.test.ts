import { parseConnectSettings } from '@trezor/connect-common/src/data/connectSettings';
import type { Logger } from '@trezor/utils';

import { createWardProviderStub } from './wardProviderStub';

const noopLogger = { debug: () => {} } as any;

describe('wardProvider registration', () => {
    it('the stub fails the pull rather than answering it', () => {
        expect(() => createWardProviderStub(noopLogger).serveEntry({ entry_key: 'ff' })).toThrow(
            'wardProvider.serveEntry is not implemented',
        );
    });

    it('logs the refusal without any byte of the request', () => {
        const logger = {
            info: jest.fn(),
            debug: jest.fn(),
            log: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
        } satisfies Logger;
        const entryKey = 'a1'.repeat(32);
        const stagedEntryKey = 'b2'.repeat(32);
        const stagedCommit = 'c3'.repeat(32);

        expect(() =>
            createWardProviderStub(logger).serveEntry({
                entry_key: entryKey,
                staged: { entry_key: stagedEntryKey, commit: stagedCommit },
            }),
        ).toThrow('wardProvider.serveEntry is not implemented');

        expect(logger.debug).toHaveBeenCalled();

        const loggedText = Object.values(logger)
            .flatMap(method => method.mock.calls)
            .map(call => JSON.stringify(call))
            .join('\n');

        [entryKey, stagedEntryKey, stagedCommit].forEach(requestBytes =>
            expect(loggedText).not.toContain(requestBytes),
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
