import {
    type EvoluError,
    type OwnerId,
    type ReadonlyStore,
    createUnknownError,
} from '@evolu/common';

import { type SuiteSyncInternalErrorHandler } from '@suite-common/suite-sync-types';

import { createEvoluErrorHandler } from './createEvoluErrorHandler';

const LABEL = 'Savings for the house';
const OWNER_ID = 'yg0UgROParTpm60ltI3hDw' as OwnerId;

const createEvoluErrorStore = (error: EvoluError | null): ReadonlyStore<EvoluError | null> => ({
    get: () => error,
    subscribe: () => () => {},
    [Symbol.dispose]: () => {},
});

describe(createEvoluErrorHandler.name, () => {
    it('maps a quota error to RelayQuotaExceeded with its owner id', () => {
        const errorHandler = jest.fn<ReturnType<SuiteSyncInternalErrorHandler>, [unknown]>();
        const store = createEvoluErrorStore({ type: 'ProtocolQuotaError', ownerId: OWNER_ID });

        createEvoluErrorHandler(store, errorHandler)();

        expect(errorHandler).toHaveBeenCalledWith({
            type: 'RelayQuotaExceeded',
            ownerId: OWNER_ID,
        });
    });

    it('reports other errors by type only', () => {
        const errorHandler = jest.fn<ReturnType<SuiteSyncInternalErrorHandler>, [unknown]>();
        const store = createEvoluErrorStore(
            createUnknownError(new Error(`SQLITE_ERROR: no such column: ${LABEL}`)),
        );

        createEvoluErrorHandler(store, errorHandler)();

        expect(errorHandler).toHaveBeenCalledWith({ type: 'RelayOther', message: 'UnknownError' });
        expect(JSON.stringify(errorHandler.mock.calls)).not.toContain(LABEL);
    });

    it('ignores an empty error store', () => {
        const errorHandler = jest.fn<ReturnType<SuiteSyncInternalErrorHandler>, [unknown]>();

        createEvoluErrorHandler(createEvoluErrorStore(null), errorHandler)();

        expect(errorHandler).not.toHaveBeenCalled();
    });
});
