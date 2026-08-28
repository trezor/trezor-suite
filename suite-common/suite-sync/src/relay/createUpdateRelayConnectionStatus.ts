import { type Dispatch } from '@reduxjs/toolkit';

import { exhaustive } from '@trezor/type-utils';
import { safeParseUrl } from '@trezor/utils';

import {
    addSuiteSyncRelayConnection,
    removeSuiteSyncRelayConnection,
    setSuiteSyncRelayConnection,
} from '../suiteSyncSlice';
import { type SuiteSyncRelayConnectionEvent } from './relayConnectionStatus';

export type UpdateRelayConnectionStatusDeps = {
    dispatch: Dispatch;
};

export type UpdateRelayConnectionStatus = (event: SuiteSyncRelayConnectionEvent) => void;

export const createUpdateRelayConnectionStatus =
    (deps: UpdateRelayConnectionStatusDeps): UpdateRelayConnectionStatus =>
    event => {
        const url = safeParseUrl(event.url);

        if (!url) return;

        // Evolu adds owner-specific query parameters to the transport URL. Relay identity only
        // consists of the protocol, host, and path, so query parameters and fragments are omitted.
        const relayUrl = `${url.protocol}//${url.host}${url.pathname}`;

        switch (event.type) {
            case 'add':
                deps.dispatch(addSuiteSyncRelayConnection({ url: relayUrl }));
                break;
            case 'remove':
                deps.dispatch(removeSuiteSyncRelayConnection({ url: relayUrl }));
                break;
            case 'connect':
            case 'disconnect':
                deps.dispatch(
                    setSuiteSyncRelayConnection({
                        state: event.type === 'connect' ? 'connected' : 'disconnected',
                        timestamp: Date.now(),
                        url: relayUrl,
                    }),
                );
                break;
            case 'error':
                deps.dispatch(
                    setSuiteSyncRelayConnection({
                        state: 'error',
                        timestamp: Date.now(),
                        url: relayUrl,
                        errorMessage: event.errorMessage,
                    }),
                );
                break;
            default:
                exhaustive(event);
        }
    };
