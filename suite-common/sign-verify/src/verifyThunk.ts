import { type Dispatch } from 'redux';

import { type AnalyticsDep, events } from '@suite-common/analytics';
import { notificationsActions } from '@suite-common/toast-notifications';
import { type Account } from '@suite-common/wallet-types';
import { type WithServices } from '@trezor/redux-utils';

import { verifyBitcoinMessage } from './bitcoin/verifyBitcoinMessage';
import { verifyEthereumMessage } from './ethereum/verifyEthereumMessage';
import { type SignVerifyRootState, type StateParams, getStateParams } from './getStateParams';
import * as SIGN_VERIFY from './signVerifyConstants';
import { CANCEL_ERROR_CODES, asError, getFailureAttributes, onError } from './signVerifyFailure';

/**
 * What a verification attempt settled on.
 *
 * Rejecting the prompt on the device is not a verdict on the signature — the check never ran — so
 * it is reported apart from a signature that genuinely did not verify.
 */
export type VerifyMessageResult = 'verified' | 'failed' | 'cancelled';

const verifyByNetwork =
    (address: string, message: string, signature: string, hex: boolean) =>
    ({ account, device }: StateParams) => {
        const params = { device, address, message, signature, hex };

        switch (account.networkType) {
            case 'bitcoin':
                return verifyBitcoinMessage({ ...params, account });
            case 'ethereum':
                return verifyEthereumMessage(params);
            default:
                return Promise.reject(new Error('Verifying not supported'));
        }
    };

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

export const verifyThunk =
    (account: Account, address: string, message: string, signature: string, hex = false) =>
    async (
        dispatch: Dispatch,
        getState: () => VerifyThunkState,
        extra: VerifyThunkDeps,
    ): Promise<VerifyMessageResult> => {
        const { analytics } = extra.services;

        try {
            const stateParams = await getStateParams(account, getState);
            const response = await verifyByNetwork(address, message, signature, hex)(stateParams);

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
