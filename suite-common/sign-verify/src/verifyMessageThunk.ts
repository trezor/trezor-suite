import { type Dispatch } from 'redux';

import { type AnalyticsDep, events } from '@suite-common/analytics';
import { notificationsActions } from '@suite-common/toast-notifications';
import { type TrezorDevice } from '@suite-common/suite-types';
import { type Account } from '@suite-common/wallet-types';
import { type SerializedError } from '@trezor/connect-common/src/constants/errors';
import { type WithServices } from '@trezor/redux-utils';
import { type Result } from '@trezor/type-utils';

import { type SignVerifyRootState, getStateParams } from './getStateParams';
import * as SIGN_VERIFY from './signVerifyConstants';
import { CANCEL_ERROR_CODES, asError, getFailureAttributes, onError } from './signVerifyFailure';

/**
 * What a verification attempt settled on.
 *
 * Rejecting the prompt on the device is not a verdict on the signature — the check never ran — so
 * it is reported apart from a signature that genuinely did not verify.
 */
export type VerifyMessageResult = 'verified' | 'failed' | 'cancelled';

const onVerifySuccess = (dispatch: Dispatch) => () => {
    dispatch(
        notificationsActions.addToast({
            type: 'verify-message-success',
        }),
    );
    dispatch({
        type: SIGN_VERIFY.VERIFY_SUCCESS,
    });

    return true;
};

type VerifyThunkState = SignVerifyRootState;

type VerifyThunkDeps = WithServices<AnalyticsDep>;

type VerifyMessageThunkParams = {
    account: Account;
    hex: boolean;
    verifyMessage: (device: TrezorDevice) => Promise<Result<unknown, SerializedError>>;
};

/**
 * What every network does around verifying a message: finds the device, reports the outcome and
 * tells the user. The network provides only the call that verifies.
 */
export const verifyMessageThunk =
    ({ account, hex, verifyMessage }: VerifyMessageThunkParams) =>
    async (
        dispatch: Dispatch,
        getState: () => VerifyThunkState,
        extra: VerifyThunkDeps,
    ): Promise<VerifyMessageResult> => {
        const { analytics } = extra.services;

        try {
            const { device } = await getStateParams(account, getState);
            const response = await verifyMessage(device);

            if (!response.success) {
                analytics.report({
                    type: events.coinVerifyMessageEvent.name,
                    payload: {
                        ...getFailureAttributes(response.error),
                        symbol: account.symbol,
                        hex,
                    },
                });

                if (CANCEL_ERROR_CODES.includes(response.error.code)) {
                    // The user backed out on the device, which says nothing about the signature.
                    // Still say so: the prompt disappearing with the form untouched leaves no other
                    // sign that the check was dropped rather than quietly failing.
                    dispatch(notificationsActions.addToast({ type: 'verify-message-cancelled' }));

                    return 'cancelled';
                }

                onError(dispatch, 'verify-message-error')(new Error(response.error.message));

                return 'failed';
            }

            analytics.report({
                type: events.coinVerifyMessageEvent.name,
                payload: { status: 'success', symbol: account.symbol, hex },
            });

            onVerifySuccess(dispatch)();

            return 'verified';
        } catch (error) {
            analytics.report({
                type: events.coinVerifyMessageEvent.name,
                payload: {
                    status: 'error',
                    error: asError(error).message,
                    symbol: account.symbol,
                    hex,
                },
            });

            onError(dispatch, 'verify-message-error')(asError(error));

            return 'failed';
        }
    };
