import { type Dispatch } from 'redux';

import { type AnalyticsDep, events } from '@suite-common/analytics';
import { notificationsActions } from '@suite-common/toast-notifications';
import { type Account } from '@suite-common/wallet-types';
import { type SignBitcoinMessageDep } from '@trezor/network-bitcoin-suite-common';
import { isSupportedBitcoinNetwork } from '@trezor/network-bitcoin-types';
import { type SignCardanoMessageDep } from '@trezor/network-cardano-suite-common';
import { isSupportedCardanoNetwork } from '@trezor/network-cardano-types';
import { type SignEthereumMessageDep } from '@trezor/network-ethereum-suite-common';
import { type WithServices } from '@trezor/redux-utils';

import { getHasSelectableSignatureFormat } from './bitcoin/getHasSelectableSignatureFormat';
import { type SignVerifyRootState, type StateParams, getStateParams } from './getStateParams';
import * as SIGN_VERIFY from './signVerifyConstants';
import { asError, getFailureAttributes, onError } from './signVerifyFailure';

type SignByNetworkServices = SignBitcoinMessageDep & SignEthereumMessageDep & SignCardanoMessageDep;

const signByNetwork =
    (
        services: SignByNetworkServices,
        path: string,
        message: string,
        hex: boolean,
        isElectrum: boolean,
        isCose: boolean,
    ) =>
    ({ account, device }: StateParams) => {
        const { symbol } = account;

        if (isSupportedBitcoinNetwork(symbol)) {
            return services.signBitcoinMessage({ device, symbol, path, message, hex, isElectrum });
        }

        if (account.networkType === 'ethereum') {
            return services.signEthereumMessage({ device, path, message, hex });
        }

        if (isSupportedCardanoNetwork(symbol)) {
            return services.signCardanoMessage({
                device,
                symbol,
                accountIndex: account.index,
                accountType: account.accountType,
                path,
                message,
                hex,
                isCose,
            });
        }

        return Promise.reject(new Error('Signing not supported'));
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

type SignThunkDeps = WithServices<AnalyticsDep & SignByNetworkServices>;

export const signThunk =
    (
        account: Account,
        path: string,
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
                extra.services,
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
