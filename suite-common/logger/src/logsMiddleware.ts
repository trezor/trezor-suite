import { isAnyOf } from '@reduxjs/toolkit';

import { analyticsActions } from '@suite-common/analytics-redux';
import { deviceActions } from '@suite-common/device';
import { discreetModeActions } from '@suite-common/discreet-mode';
import { createMiddleware } from '@suite-common/redux-utils';
import {
    accountsActions,
    blockchainActions,
    changeNetworks,
    setBaseCurrency,
} from '@suite-common/wallet-core';
import { getAccountIdentifier } from '@suite-common/wallet-utils';
import { DEVICE, TRANSPORT } from '@trezor/connect';

import { addLog } from './logsSlice';

export const logsMiddleware = createMiddleware((action, { next, dispatch }) => {
    if (changeNetworks.match(action)) {
        dispatch(
            addLog({
                action,
                type: action.type,
            }),
        );
    }

    if (deviceActions.addButtonRequest.match(action)) {
        if (action.payload.buttonRequest) {
            dispatch(
                addLog({
                    type: action.type,
                    payload: {
                        code: action.payload.buttonRequest.code,
                    },
                }),
            );
        }
    }

    if (
        isAnyOf(
            setBaseCurrency,
            analyticsActions.enableAnalytics,
            analyticsActions.disableAnalytics,
        )(action) ||
        discreetModeActions.setDiscreetMode.match(action)
    ) {
        dispatch(addLog({ type: action.type, payload: { ...action, type: undefined } }));
    }

    if (
        isAnyOf(deviceActions.updateSelectedDevice, deviceActions.setRememberDevice)(action) ||
        action.type === DEVICE.CONNECT ||
        action.type === DEVICE.DISCONNECT
    ) {
        dispatch(
            addLog({
                type: action.type,
                payload: {
                    ...action.payload,
                    firmwareReleaseConfigInfo: undefined,
                    unavailableCapabilities: undefined,
                },
            }),
        );
    }

    if (isAnyOf(accountsActions.createAccount, accountsActions.updateAccount)(action)) {
        dispatch(addLog({ type: action.type, payload: { ...action.payload } }));
    }

    if (action.type === TRANSPORT.START) {
        dispatch(
            addLog({
                type: action.type,
                payload: {
                    type: action.payload.type,
                    version: action.payload.version,
                },
            }),
        );
    }
    if (action.type === TRANSPORT.ERROR) {
        dispatch(addLog({ type: action.type, payload: { error: action.payload.error } }));
    }

    if (isAnyOf(accountsActions.updateSelectedAccount)(action)) {
        if (action.payload.account) {
            dispatch(
                addLog({
                    type: action.type,
                    payload: {
                        account: {
                            ...getAccountIdentifier(action.payload.account),
                            index: action.payload.account.index,
                            path: action.payload.account.path,
                        },
                    },
                }),
            );
        } else {
            dispatch(
                addLog({
                    type: action.type,
                    payload: { ...action, type: undefined },
                }),
            );
        }
    }

    if (blockchainActions.setBackend.match(action)) {
        dispatch(addLog({ type: action.type, payload: { ...action.payload, urls: undefined } }));
    }

    return next(action);
});
