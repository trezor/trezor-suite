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
import { type GetTrezorConnectDep } from '@trezor/connect-common';

export type EthereumSignVerifyConnectDep = GetTrezorConnectDep<
    'ethereumGetAddress' | 'ethereumSignMessage' | 'ethereumVerifyMessage'
>;

type ShowAddressThunkState = SignVerifyRootState;

type SignThunkState = SignVerifyRootState;

type SignThunkDeps = WithServices<DesktopAnalyticsDep>;

type VerifyThunkState = SignVerifyRootState;

type VerifyThunkDeps = WithServices<DesktopAnalyticsDep>;

export type EthereumSignVerifyActions = ReturnType<typeof createEthereumSignVerifyActions>;

export const createEthereumSignVerifyActions = ({
    getTrezorConnect,
}: EthereumSignVerifyConnectDep) => {
    const showAddressThunk =
        (account: Account, address: string, path: string) =>
        (dispatch: Dispatch, getState: () => ShowAddressThunkState) =>
            getSignVerifyStateParams(account, getState)
                .then(({ device, chunkify }) =>
                    getTrezorConnect().ethereumGetAddress({
                        device,
                        address,
                        path,
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
        (account: Account, path: string | number[], message: string, hex = false) =>
        async (dispatch: Dispatch, getState: () => SignThunkState, extra: SignThunkDeps) => {
            const { analytics } = extra.services;

            try {
                const { device } = await getSignVerifyStateParams(account, getState);
                const response = await getTrezorConnect().ethereumSignMessage({
                    device,
                    path,
                    message,
                    hex,
                });

                if (!response.success) {
                    reportSignMessage(analytics, {
                        ...getFailureAttributes(response.error),
                        symbol: account.symbol,
                        hex,
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
                });

                return notifySignSuccess(dispatch)(response.payload);
            } catch (error) {
                reportSignMessage(analytics, {
                    status: 'error',
                    error: asError(error).message,
                    symbol: account.symbol,
                    hex,
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
                const { device } = await getSignVerifyStateParams(account, getState);
                const response = await getTrezorConnect().ethereumVerifyMessage({
                    device,
                    address,
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
                        // The user backed out on the device, which says nothing about the signature.
                        // Still say so: the prompt disappearing with the form untouched leaves no other
                        // sign that the check was dropped rather than quietly failing.
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
