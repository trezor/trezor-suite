import { type Dispatch } from '@reduxjs/toolkit';

import { notificationsActions } from '@suite-common/toast-notifications';
import { type YieldFlowType, yieldActions } from '@suite-common/wallet-core';

import { getDeviceErrorMessage } from '#src/utils/wallet/getDeviceErrorMessage';

import { isEvmBroadcastError } from '../evmTransaction';

export const getYieldErrorTranslationKey = (error: unknown) => {
    if (!(error instanceof Error)) {
        return 'TR_EARN_YIELD_ERROR_GENERIC';
    }

    if (isEvmBroadcastError(error)) {
        return 'TR_EARN_YIELD_ERROR_PUSH_FAILED';
    }

    return 'TR_EARN_YIELD_ERROR_GENERIC';
};

// Device problems are reported by a toast, like in Send and trading; other errors stay in the form.
export const getYieldDeviceErrorMessage = (error: unknown) =>
    error instanceof Error
        ? getDeviceErrorMessage({ code: error.cause, message: error.message })
        : undefined;

type ShowYieldSubmitErrorThunkParams = {
    flowType: YieldFlowType;
    flowKey: string;
    error: unknown;
};

export const showYieldSubmitErrorThunk =
    ({ flowType, flowKey, error }: ShowYieldSubmitErrorThunkParams) =>
    (dispatch: Dispatch) => {
        const deviceError = getYieldDeviceErrorMessage(error);

        if (deviceError) {
            dispatch(notificationsActions.addToast({ type: 'sign-tx-error', error: deviceError }));

            return;
        }

        dispatch(
            yieldActions.setError({ flowType, flowKey, error: getYieldErrorTranslationKey(error) }),
        );
    };

export const getYieldSubmitErrorAnalyticsMessage = (error: unknown) =>
    isEvmBroadcastError(error) ? 'push-failed' : 'submit-failed';
