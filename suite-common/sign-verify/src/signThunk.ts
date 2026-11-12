import { type Dispatch } from 'redux';

import { type AnalyticsDep, events } from '@suite-common/analytics';
import { notificationsActions } from '@suite-common/toast-notifications';
import { type Account } from '@suite-common/wallet-types';
import { type WithServices } from '@trezor/redux-utils';

import { getHasSelectableSignatureFormat } from './bitcoin/getHasSelectableSignatureFormat';
import { signBitcoinMessage } from './bitcoin/signBitcoinMessage';
import { signCardanoMessage } from './cardano/signCardanoMessage';
import { signEthereumMessage } from './ethereum/signEthereumMessage';
import { type SignVerifyRootState, type StateParams, getStateParams } from './getStateParams';
import * as SIGN_VERIFY from './signVerifyConstants';
import { asError, getFailureAttributes, onError } from './signVerifyFailure';

const signByNetwork =
    (
        path: string | number[],
        message: string,
        hex: boolean,
        isElectrum: boolean,
        isCose: boolean,
    ) =>
    ({ account, device }: StateParams) => {
        switch (account.networkType) {
            case 'bitcoin':
                return signBitcoinMessage({ device, account, path, message, hex, isElectrum });
            case 'ethereum':
                return signEthereumMessage({ device, path, message, hex });
            case 'cardano':
                return signCardanoMessage({ device, account, path, message, hex, isCose });
            default:
                return Promise.reject(new Error('Signing not supported'));
        }
    };

const onSignSuccess = (dispatch: Dispatch) => (result: { signature: string; pubKey?: string }) => {
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

export const signThunk =
    (
        account: Account,
        path: string | number[],
        message: string,
        hex = false,
        isElectrum = false,
        isCose = false,
    ) =>
    async (dispatch: Dispatch, getState: () => SignThunkState, extra: SignThunkDeps) => {
        const { analytics } = extra.services;
        // Networks signing in a single format never offered the choice, so reporting one of its
        // values would invent an answer the user never gave.
        const formatAttributes = getHasSelectableSignatureFormat(account)
            ? { signatureFormat: isElectrum ? ('electrum' as const) : ('trezor' as const) }
            : {};

        try {
            const stateParams = await getStateParams(account, getState);
            const response = await signByNetwork(
                path,
                message,
                hex,
                isElectrum,
                isCose,
            )(stateParams);

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
