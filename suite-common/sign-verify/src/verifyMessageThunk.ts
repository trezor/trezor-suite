import { type Dispatch } from 'redux';

import { type AnalyticsDep, events } from '@suite-common/analytics';
import { type TrezorDevice } from '@suite-common/suite-types';
import { notificationsActions } from '@suite-common/toast-notifications';
import { type Account } from '@suite-common/wallet-types';
import { type SerializedError } from '@trezor/connect-common/src/constants/errors';
import { type WithServices } from '@trezor/redux-utils';
import { type Result } from '@trezor/type-utils';

import { getSignVerifyDevice } from './getSignVerifyDevice';
import * as SIGN_VERIFY from './signVerifyConstants';
import { asError, getFailureAttributes, isCancelError } from './signVerifyFailure';
import { type SignVerifyRootState } from './signVerifyRootState';

/**
 * What a verification attempt settled on.
 *
 * Rejecting the prompt on the device is not a verdict on the signature — the check never ran — so
 * it is reported apart from a signature that genuinely did not verify.
 */
export type VerifyMessageResult = 'verified' | 'failed' | 'cancelled';

type VerifyMessageThunkParams = {
    account: Account;
    hex: boolean;
    verifyMessage: (device: TrezorDevice) => Promise<Result<unknown, SerializedError>>;
};

type VerifyMessageThunkDeps = WithServices<AnalyticsDep>;

/**
 * What every network does around verifying a message: finds the device, reports the outcome and
 * tells the user. The network module provides only the call that verifies.
 */
export const verifyMessageThunk =
    ({ account, hex, verifyMessage }: VerifyMessageThunkParams) =>
    async (
        dispatch: Dispatch,
        getState: () => SignVerifyRootState,
        extra: VerifyMessageThunkDeps,
    ): Promise<VerifyMessageResult> => {
        const { analytics } = extra.services;

        const reportError = (error: Error) => {
            dispatch(
                notificationsActions.addToast({
                    type: 'verify-message-error',
                    error: error.message,
                }),
            );

            return 'failed' as const;
        };

        try {
            const response = await verifyMessage(getSignVerifyDevice(getState));

            if (!response.success) {
                analytics.report({
                    type: events.coinVerifyMessageEvent.name,
                    payload: {
                        ...getFailureAttributes(response.error),
                        symbol: account.symbol,
                        hex,
                    },
                });

                if (isCancelError(response.error)) {
                    // The user backed out on the device, which says nothing about the signature.
                    // Still say so: the prompt disappearing with the form untouched leaves no other
                    // sign that the check was dropped rather than quietly failing.
                    dispatch(notificationsActions.addToast({ type: 'verify-message-cancelled' }));

                    return 'cancelled';
                }

                return reportError(new Error(response.error.message));
            }

            analytics.report({
                type: events.coinVerifyMessageEvent.name,
                payload: { status: 'success', symbol: account.symbol, hex },
            });

            dispatch(notificationsActions.addToast({ type: 'verify-message-success' }));
            dispatch({ type: SIGN_VERIFY.VERIFY_SUCCESS });

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

            return reportError(asError(error));
        }
    };
