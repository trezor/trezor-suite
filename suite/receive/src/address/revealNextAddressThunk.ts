import { type Dispatch } from '@reduxjs/toolkit';

import { type DesktopAnalyticsDep, events } from '@suite/analytics';
import {
    type ReceiveRootState,
    receiveActions,
    selectCurrentFreshAddress,
} from '@suite-common/receive';
import { type AccountKey } from '@suite-common/wallet-types';

type RevealNextAddressThunkDeps = { services: DesktopAnalyticsDep };

export const revealNextAddressThunk =
    ({ accountKey }: { accountKey: AccountKey }) =>
    (dispatch: Dispatch, getState: () => ReceiveRootState, extra: RevealNextAddressThunkDeps) => {
        const currentFreshAddress = selectCurrentFreshAddress(getState(), accountKey);

        if (!currentFreshAddress) {
            return;
        }

        dispatch(
            receiveActions.showAddress({
                accountKey,
                path: currentFreshAddress.path,
                address: currentFreshAddress.address,
            }),
        );

        extra.services.analytics.report({ type: events.receiveAddAddressEvent.name });
    };
