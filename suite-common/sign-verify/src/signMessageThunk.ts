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
import { asError, getFailureAttributes, onError } from './signVerifyFailure';

export type SignedMessage = { signature: string; pubKey?: string };

const onSignSuccess = (dispatch: Dispatch) => (result: SignedMessage) => {
    dispatch(
        notificationsActions.addToast({
            type: 'sign-message-success',
        }),
    );
    dispatch({
        type: SIGN_VERIFY.SIGN_SUCCESS,
        signSignature: result.signature,
    });

    return result;
};

type SignThunkState = SignVerifyRootState;

type SignThunkDeps = WithServices<AnalyticsDep>;

type SignMessageThunkParams = {
    account: Account;
    hex: boolean;
    /** Only for networks where the user picks the signature format; others never offered it. */
    signatureFormat?: 'trezor' | 'electrum';
    signMessage: (device: TrezorDevice) => Promise<Result<SignedMessage, SerializedError>>;
};

/**
 * What every network does around signing a message: finds the device, reports the outcome and
 * tells the user. The network provides only the call that signs.
 */
export const signMessageThunk =
    ({ account, hex, signatureFormat, signMessage }: SignMessageThunkParams) =>
    async (
        dispatch: Dispatch,
        getState: () => SignThunkState,
        extra: SignThunkDeps,
    ): Promise<SignedMessage | false> => {
        const { analytics } = extra.services;
        const formatAttributes = signatureFormat === undefined ? {} : { signatureFormat };

        try {
            const { device } = await getStateParams(account, getState);
            const response = await signMessage(device);

            if (!response.success) {
                analytics.report({
                    type: events.coinSignMessageEvent.name,
                    payload: {
                        ...getFailureAttributes(response.error),
                        symbol: account.symbol,
                        hex,
                        ...formatAttributes,
                    },
                });

                return onError(dispatch, 'sign-message-error')(new Error(response.error.message));
            }

            analytics.report({
                type: events.coinSignMessageEvent.name,
                payload: { status: 'success', symbol: account.symbol, hex, ...formatAttributes },
            });

            return onSignSuccess(dispatch)(response.payload);
        } catch (error) {
            analytics.report({
                type: events.coinSignMessageEvent.name,
                payload: {
                    status: 'error',
                    error: asError(error).message,
                    symbol: account.symbol,
                    hex,
                    ...formatAttributes,
                },
            });

            return onError(dispatch, 'sign-message-error')(asError(error));
        }
    };
