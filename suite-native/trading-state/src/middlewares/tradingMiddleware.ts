import { type UnknownAction, isAnyOf } from '@reduxjs/toolkit';

import { deviceActions, selectSelectedDevice } from '@suite-common/device';
import { createMiddlewareWithExtraDeps } from '@suite-common/redux-utils';
import { formDraftActions } from '@suite-common/wallet-core';

import { buyActions, exchangeActions, sellActions, tradingActions } from '../reducers';
import { getFormDraftKeyByTradeType } from '../utils';

export const prepareTradingMiddleware = createMiddlewareWithExtraDeps(
    (action: UnknownAction, { dispatch, next, getState }) => {
        let skipRemoveDraftCheck = false;

        // When user starts with read-only device and then connects the physical device,
        // we want to skip removing drafts and clearing accounts.
        if (isAnyOf(deviceActions.selectDevice)(action) && action.payload?.connected === true) {
            const { id: nextId, instance: nextInstance } = action.payload;
            const prevDevice = selectSelectedDevice(getState());
            const isSameWallet =
                prevDevice && nextId === prevDevice.id && nextInstance === prevDevice.instance;

            if (isSameWallet) {
                skipRemoveDraftCheck = true;
            }
        }

        next(action);

        if (skipRemoveDraftCheck) {
            return action;
        }

        if (isAnyOf(deviceActions.selectDevice)(action)) {
            dispatch(tradingActions.clearSelectedAccounts());
        }

        if (
            isAnyOf(
                deviceActions.selectDevice,
                tradingActions.setTradingEnvironment,
                buyActions.clearState,
                exchangeActions.clearState,
                sellActions.clearState,
            )(action)
        ) {
            dispatch(formDraftActions.removeDraft({ key: getFormDraftKeyByTradeType('sell') }));
            dispatch(formDraftActions.removeDraft({ key: getFormDraftKeyByTradeType('exchange') }));
        }

        return action;
    },
);
