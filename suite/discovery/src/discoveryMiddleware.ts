import { selectIsDeviceLocked } from '@suite/locks';
import { routerAppChanged } from '@suite/router';
import { connectPopupCallThunkInner } from '@suite-common/connect-popup';
import { deviceActions, selectSelectedDevice } from '@suite-common/device';
import { type AnyAction, createMiddlewareWithExtraDeps } from '@suite-common/redux-utils';
import { isDeviceAcquired } from '@suite-common/suite-utils';
import { selectThpAutoconnectStep, thpActions } from '@suite-common/thp';
import {
    accountsActions,
    changeNetworks,
    selectShouldRediscover,
    startOrRestartDiscoveryThunk,
} from '@suite-common/wallet-core';

import {
    isDeviceBecomingAcquired,
    isDeviceBecomingConnected,
    selectShouldRouterAppStartDiscovery,
} from './conditions';

export const prepareDiscoveryMiddleware = createMiddlewareWithExtraDeps(
    async (action, { dispatch, next, getState }): Promise<AnyAction> => {
        // We are only taking a snapshot, but yes, the same rules shall apply: prevState and nextState MUST NOT be used without a selector.
        // eslint-disable-next-line no-restricted-syntax
        const prevState: any = getState();

        // Pass action to next middleware, meaning that the code below runs *only after* the action has been completely processed in Redux.
        // Note: TS says next(action) generally isn't async, but the action may return anything; sometimes it's a Promise → needs to be awaited
        await next(action);

        // eslint-disable-next-line no-restricted-syntax
        const nextState: any = getState();

        const prevDevice = selectSelectedDevice(prevState);
        const device = selectSelectedDevice(nextState);
        const isDeviceLocked = selectIsDeviceLocked(nextState);

        const wasDeviceUpdated =
            !!prevDevice && !!device && deviceActions.updateSelectedDevice.match(action);
        const becomesAcquired =
            wasDeviceUpdated && isDeviceBecomingAcquired({ prevDevice, device });
        const becomesConnected =
            wasDeviceUpdated && isDeviceBecomingConnected({ prevDevice, device });

        /*
         The following conditions always block discovery:
        */

        // 1. Discovery should only start on certain apps
        if (!selectShouldRouterAppStartDiscovery(nextState)) return action;

        // 2. Device must be unlocked. The only exception is, when it is locked and just has been acquired.
        //    In that case, device-change is emitted right before acquireDevice ends (and unlocks the device).
        const isDeviceReady =
            device?.connected && isDeviceAcquired(device) && (!isDeviceLocked || becomesAcquired);
        if (!isDeviceReady) return action;

        // 3. Discovery must be delayed if THP Autoconnect modal is open, because it is the only THP step that takes place
        //    *after* device acquisition, and also needs device interaction to complete (would block discovery).
        const isTHPAutoconnectModal = selectThpAutoconnectStep(getState()) === 'AutoconnectInfo';
        const isTHPAutoconnectFinished = thpActions.finishAutoconnectFlow.match(action);
        if (isTHPAutoconnectModal) return action;

        /*
         Start discovery only on the following actions:
        */
        if (
            becomesAcquired ||
            becomesConnected ||
            isTHPAutoconnectFinished || // now that the THP Autoconnect was finished, resume the delayed discovery
            routerAppChanged.match(action) || // may no longer be one of the apps where discovery is disabled
            connectPopupCallThunkInner.fulfilled.match(action) ||
            deviceActions.selectDevice.match(action) ||
            changeNetworks.match(action) ||
            accountsActions.updateAccount.match(action) || // empty account can become nonempty
            accountsActions.changeAccountVisibility.match(action)
        ) {
            // 4. Nothing to discover (discovery would be no-op). It's intentionally inside the action matcher condition
            // so it won't be called on every action, because the selector is expensive and not viable for memoization.
            const shouldRediscover = selectShouldRediscover(getState(), device);
            if (!shouldRediscover) return action;
            dispatch(startOrRestartDiscoveryThunk());
        }

        return action;
    },
);
