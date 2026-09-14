import { createSuiteSyncUpdateError } from '@suite-common/suite-sync-storage';
import { type StaticSessionId } from '@trezor/connect';

import { suiteSyncErrorHandler } from './suiteSyncErrorHandler';

const LABEL = 'Savings for the house';
const XPUB =
    'xpub6CUGRUonZSQ4TWtTMmzXdrXDtypWKiKrhko4egpiMZbpiaQL2jkwSB1icqYh2cfDfVxdx4df189oLKnC5fSwqPfgyP3hooxujYzAu3fDVmz';
const deviceStaticSessionId: StaticSessionId = '1@2:3';

describe(suiteSyncErrorHandler.name, () => {
    let consoleErrorSpy: jest.SpyInstance;

    beforeEach(() => {
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        consoleErrorSpy.mockRestore();
    });

    it('reports a failed label write without the rejected row', () => {
        const dispatch = jest.fn();
        const error = createSuiteSyncUpdateError({
            caused: {
                type: 'Object',
                value: { accountDescriptor: XPUB, networkSymbol: 'btc', label: LABEL },
                reason: {
                    kind: 'Props',
                    errors: { label: { type: 'MaxLength', value: LABEL, max: 1000 } },
                },
            },
        });

        suiteSyncErrorHandler({ error, dispatch, deviceStaticSessionId });

        expect(dispatch).toHaveBeenCalledTimes(1);
        expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
        const reported = JSON.stringify(consoleErrorSpy.mock.calls);
        expect(reported).toContain('SuiteSyncUpdateError');
        expect(reported).toContain('MaxLength');
        expect(reported).not.toContain(LABEL);
        expect(reported).not.toContain(XPUB);
    });

    it('reports an error for an unknown device without its message', () => {
        const dispatch = jest.fn();

        suiteSyncErrorHandler({
            error: { type: 'RelayOther', message: `SQLITE_ERROR: no such column: ${LABEL}` },
            dispatch,
            deviceStaticSessionId: null,
        });

        expect(dispatch).toHaveBeenCalledTimes(1);
        expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
        expect(JSON.stringify(consoleErrorSpy.mock.calls)).toContain('RelayOther');
        expect(JSON.stringify(consoleErrorSpy.mock.calls)).not.toContain(LABEL);
    });
});
