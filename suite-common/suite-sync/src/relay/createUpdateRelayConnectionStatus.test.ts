import { type Dispatch } from '@reduxjs/toolkit';

import { createUpdateRelayConnectionStatus } from './createUpdateRelayConnectionStatus';

describe(createUpdateRelayConnectionStatus.name, () => {
    it.each([
        ['add', 'suiteSync/addSuiteSyncRelayConnection'],
        ['remove', 'suiteSync/removeSuiteSyncRelayConnection'],
        ['connect', 'suiteSync/setSuiteSyncRelayConnection'],
        ['disconnect', 'suiteSync/setSuiteSyncRelayConnection'],
        ['error', 'suiteSync/setSuiteSyncRelayConnection'],
    ] as const)('dispatches the %s relay event', (type, expectedActionType) => {
        const dispatch = jest.fn() as Dispatch;
        const updateRelayConnectionStatus = createUpdateRelayConnectionStatus({ dispatch });

        updateRelayConnectionStatus({
            type,
            url: 'https://relay.example/evolu/?ownerId=secret',
            ...(type === 'error' && { errorMessage: 'Connection failed' }),
        });

        expect(dispatch).toHaveBeenCalledWith(
            expect.objectContaining({
                type: expectedActionType,
                payload: expect.objectContaining({ url: 'https://relay.example/evolu/' }),
            }),
        );
    });

    it('ignores an event with an invalid relay URL', () => {
        const dispatch = jest.fn() as Dispatch;
        const updateRelayConnectionStatus = createUpdateRelayConnectionStatus({ dispatch });

        updateRelayConnectionStatus({ type: 'add', url: 'invalid URL' });

        expect(dispatch).not.toHaveBeenCalled();
    });
});
