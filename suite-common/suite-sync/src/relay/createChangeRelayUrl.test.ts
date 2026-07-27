import type { UnknownAction } from '@reduxjs/toolkit';

import { mock } from '@suite-common/dependency-injection';

import { setSuiteSyncRelayUrl } from '../suiteSyncSlice';
import { type ChangeRelayUrlDeps, createChangeRelayUrl } from './createChangeRelayUrl';

describe(createChangeRelayUrl.name, () => {
    it('saves relay url and reconnects all storages', async () => {
        const actions: UnknownAction[] = [];

        const deps: ChangeRelayUrlDeps = {
            dispatch: (action: any) => actions.push(action),
            getIsTorEnabled: mock(() => true),
            reconnectAllRelays: mock(() => Promise.resolve()),
        };

        const changeRelayUrl = createChangeRelayUrl(deps);
        await changeRelayUrl({ relayUrl: 'http://localhost:4000' });

        expect(actions).toStrictEqual([
            {
                payload: { url: 'http://localhost:4000' },
                type: setSuiteSyncRelayUrl.type,
            },
        ]);
        expect(deps.reconnectAllRelays).toHaveBeenCalledWith({ isTorEnabled: true });
    });

    it('saves empty relay url and reconnects all storages', async () => {
        const actions: UnknownAction[] = [];

        const deps: ChangeRelayUrlDeps = {
            dispatch: (action: any) => actions.push(action),
            getIsTorEnabled: mock(() => false),
            reconnectAllRelays: mock(() => Promise.resolve()),
        };

        const changeRelayUrl = createChangeRelayUrl(deps);
        await changeRelayUrl({ relayUrl: '' });

        expect(actions).toStrictEqual([
            {
                payload: { url: '' },
                type: setSuiteSyncRelayUrl.type,
            },
        ]);
        expect(deps.reconnectAllRelays).toHaveBeenCalledWith({ isTorEnabled: false });
    });
});
