import { type Dispatch } from 'redux';

import { type DesktopAnalyticsDep } from '@suite/analytics';
import {
    type SignVerifyRootState,
    type VerifyMessageResult,
    asError,
    getFailureAttributes,
    getSignVerifyStateParams,
    isCancelledError,
    notifyError,
    notifySignSuccess,
    notifyVerifyCancelled,
    notifyVerifySuccess,
    reportSignMessage,
    reportVerifyMessage,
} from '@suite/sign-verify';
import { type WithServices } from '@suite-common/redux-utils';
import { type Account } from '@suite-common/wallet-types';
import { type GetTrezorConnectDep, asCoinSymbol } from '@trezor/connect-common';

import { getHasSelectableSignatureFormat } from './getHasSelectableSignatureFormat';

export type BitcoinSignVerifyConnectDep = GetTrezorConnectDep<
    'getAddress' | 'signMessage' | 'verifyMessage'
>;

type ShowAddressThunkState = SignVerifyRootState;

type SignThunkState = SignVerifyRootState;

type SignThunkDeps = WithServices<DesktopAnalyticsDep>;

type VerifyThunkState = SignVerifyRootState;

type VerifyThunkDeps = WithServices<DesktopAnalyticsDep>;

export type BitcoinSignVerifyActions = ReturnType<typeof createBitcoinSignVerifyActions>;

export const createBitcoinSignVerifyActions = ({
    getTrezorConnect,
}: BitcoinSignVerifyConnectDep) => {
    const showAddressThunk =
        (account: Account, address: string, path: string) =>
        (dispatch: Dispatch, getState: () => ShowAddressThunkState) =>
            getSignVerifyStateParams(account, getState)
                .then(({ device, coin, chunkify }) =>
                    getTrezorConnect().getAddress({
                        device,
                        address,
                        path,
                        coin: asCoinSymbol(coin),
                        chunkify,
                    }),
                )
                .then(response =>
                    response.success
                        ? Promise.resolve(response.payload)
                        : Promise.reject(new Error(response.error.message)),
                )
                .catch(notifyError(dispatch, 'verify-address-error'));

    const signThunk =
        (
            account: Account,
            path: string | number[],
            message: string,
            hex = false,
            isElectrum = false,
        ) =>
        async (dispatch: Dispatch, getState: () => SignThunkState, extra: SignThunkDeps) => {
            const { analytics } = extra.services;
            // Accounts signing in a single format never offered the choice, so reporting one of its
            // values would invent an answer the user never gave.
            const formatAttributes = getHasSelectableSignatureFormat(account)
                ? { signatureFormat: isElectrum ? ('electrum' as const) : ('trezor' as const) }
                : {};

            try {
                const { device, coin } = await getSignVerifyStateParams(account, getState);
                const response = await getTrezorConnect().signMessage({
                    device,
                    path,
                    coin: asCoinSymbol(coin),
                    message,
                    hex,
                    no_script_type: isElectrum,
                });

                if (!response.success) {
                    reportSignMessage(analytics, {
                        ...getFailureAttributes(response.error),
                        symbol: account.symbol,
                        hex,
                        ...formatAttributes,
                    });

                    return notifyError(
                        dispatch,
                        'sign-message-error',
                    )(new Error(response.error.message));
                }

                reportSignMessage(analytics, {
                    status: 'success',
                    symbol: account.symbol,
                    hex,
                    ...formatAttributes,
                });

                return notifySignSuccess(dispatch)(response.payload);
            } catch (error) {
                reportSignMessage(analytics, {
                    status: 'error',
                    error: asError(error).message,
                    symbol: account.symbol,
                    hex,
                    ...formatAttributes,
                });

                return notifyError(dispatch, 'sign-message-error')(asError(error));
            }
        };

    const verifyThunk =
        (account: Account, address: string, message: string, signature: string, hex = false) =>
        async (
            dispatch: Dispatch,
            getState: () => VerifyThunkState,
            extra: VerifyThunkDeps,
        ): Promise<VerifyMessageResult> => {
            const { analytics } = extra.services;

            try {
                const { device, coin } = await getSignVerifyStateParams(account, getState);
                const response = await getTrezorConnect().verifyMessage({
                    device,
                    address,
                    coin: asCoinSymbol(coin),
                    message,
                    signature,
                    hex,
                });

                if (!response.success) {
                    reportVerifyMessage(analytics, {
                        ...getFailureAttributes(response.error),
                        symbol: account.symbol,
                        hex,
                    });

                    if (isCancelledError(response.error)) {
                        // The user backed out on the device, which says nothing about the
                        // signature. Still say so: the prompt disappearing with the form untouched
                        // leaves no other sign that the check was dropped rather than quietly
                        // failing.
                        notifyVerifyCancelled(dispatch);

                        return 'cancelled';
                    }

                    notifyError(
                        dispatch,
                        'verify-message-error',
                    )(new Error(response.error.message));

                    return 'failed';
                }

                reportVerifyMessage(analytics, {
                    status: 'success',
                    symbol: account.symbol,
                    hex,
                });

                notifyVerifySuccess(dispatch);

                return 'verified';
            } catch (error) {
                reportVerifyMessage(analytics, {
                    status: 'error',
                    error: asError(error).message,
                    symbol: account.symbol,
                    hex,
                });

                notifyError(dispatch, 'verify-message-error')(asError(error));

                return 'failed';
            }
        };

    return { showAddressThunk, signThunk, verifyThunk };
};
