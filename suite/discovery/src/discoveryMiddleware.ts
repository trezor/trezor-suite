import { type UnknownAction } from 'redux';

import {
    type AuthenticityChecksRootState,
    selectDeviceNeedsInteractiveDeviceChecks,
    selectShouldDisplayDeviceCompromised,
} from '@suite/authenticity-checks';
import { type LocksRootState } from '@suite/locks';
import { type RouterRootState } from '@suite/router';
import { selectSelectedDevice } from '@suite-common/device';
import { type ThpRootState, selectThpAutoconnectStep } from '@suite-common/thp';
import {
    type WalletCoreCompoundRootState,
    observeSelectedDeviceThunk,
    selectShouldRediscover,
    startOrRestartDiscoveryThunk,
} from '@suite-common/wallet-core';
import { createMiddlewareWithExtraDeps } from '@trezor/redux-utils';

import {
    selectIsDeviceReadyToStartDiscovery,
    selectShouldRouterAppStartDiscovery,
} from './conditions';
import { getDiscoveryTrigger } from './getDiscoveryTrigger';

type DiscoveryMiddlewareState = AuthenticityChecksRootState &
    LocksRootState &
    RouterRootState &
    ThpRootState &
    WalletCoreCompoundRootState;

export const prepareDiscoveryMiddleware = createMiddlewareWithExtraDeps<
    void,
    UnknownAction,
    DiscoveryMiddlewareState
>(async (action, { dispatch, next, getState }): Promise<UnknownAction> => {
    // Pass action to next middleware, meaning that the code below runs *only after* the action has been completely processed in Redux.
    // Note: TS says next(action) generally isn't async, but the action may return anything; sometimes it's a Promise → needs to be awaited
    await next(action);

    const device = selectSelectedDevice(getState());
    if (!device) return action;

    const isObserveSelectedDeviceMatch = observeSelectedDeviceThunk.fulfilled.match(action);
    const { isDeviceBecomingAcquired, isDeviceBecomingConnected } = isObserveSelectedDeviceMatch
        ? action.payload
        : { isDeviceBecomingAcquired: false, isDeviceBecomingConnected: false };

    /*
     The following conditions always block discovery:
    */

    // 1. Discovery should only start on certain apps
    if (!selectShouldRouterAppStartDiscovery(getState())) return action;

    // 2. Device must be idle, not locked.
    const isDeviceReady = selectIsDeviceReadyToStartDiscovery(getState(), isDeviceBecomingAcquired);
    if (!isDeviceReady) return action;

    // 3. Discovery must be blocked while the compromised device warning is shown.
    if (selectShouldDisplayDeviceCompromised(getState())) return action;

    // 4. Discovery is delayed while interactive device checks are pending.
    if (selectDeviceNeedsInteractiveDeviceChecks(getState(), device)) return action;

    // 5. Discovery must be delayed if THP Autoconnect modal is open, because it is the only THP step that takes place
    //    *after* device acquisition, and also needs device interaction to complete (would block discovery).
    const isTHPAutoconnectModal = selectThpAutoconnectStep(getState()) === 'AutoconnectInfo';
    if (isTHPAutoconnectModal) return action;

    /*
     Start discovery only on the actions that map to a trigger:
    */
    const trigger = getDiscoveryTrigger({
        action,
        isDeviceBecomingAcquired,
        isDeviceBecomingConnected,
    });
    if (trigger === undefined) return action;

    // 6. Nothing to discover (discovery would be no-op). It's intentionally checked only after the action matched
    // a trigger, so it won't be called on every action, because the selector is expensive and not viable for memoization.
    const shouldRediscover = selectShouldRediscover(getState(), device);
    if (!shouldRediscover) return action;
    dispatch(startOrRestartDiscoveryThunk({ trigger }));

    return action;
});
