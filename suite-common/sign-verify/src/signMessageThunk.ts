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
import { asError, getFailureAttributes } from './signVerifyFailure';
import { type SignVerifyRootState } from './signVerifyRootState';

export type SignedMessage = { signature: string; pubKey?: string };

export type SignatureFormat = 'trezor' | 'electrum';

type SignMessageThunkParams<TSignedMessage extends SignedMessage> = {
    account: Account;
    hex: boolean;
    /** Only for networks where the user picks the signature format; others never offered it. */
    signatureFormat?: SignatureFormat;
    signMessage: (device: TrezorDevice) => Promise<Result<TSignedMessage, SerializedError>>;
};

type SignMessageThunkDeps = WithServices<AnalyticsDep>;

/**
 * What every network does around signing a message: finds the device, reports the outcome and
 * tells the user. The network module provides only the call that signs.
 */
export const signMessageThunk =
    <TSignedMessage extends SignedMessage>({
        account,
        hex,
        signatureFormat,
        signMessage,
    }: SignMessageThunkParams<TSignedMessage>) =>
    async (
        dispatch: Dispatch,
        getState: () => SignVerifyRootState,
        extra: SignMessageThunkDeps,
    ): Promise<TSignedMessage | false> => {
        const { analytics } = extra.services;
        const formatAttributes = signatureFormat === undefined ? {} : { signatureFormat };

        const reportError = (error: Error) => {
            dispatch(
                notificationsActions.addToast({ type: 'sign-message-error', error: error.message }),
            );

            return false as const;
        };

        try {
            const response = await signMessage(getSignVerifyDevice(getState));

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

                return reportError(new Error(response.error.message));
            }

            analytics.report({
                type: events.coinSignMessageEvent.name,
                payload: { status: 'success', symbol: account.symbol, hex, ...formatAttributes },
            });

            dispatch(notificationsActions.addToast({ type: 'sign-message-success' }));
            dispatch({ type: SIGN_VERIFY.SIGN_SUCCESS, signSignature: response.payload.signature });

            return response.payload;
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

            return reportError(asError(error));
        }
    };
