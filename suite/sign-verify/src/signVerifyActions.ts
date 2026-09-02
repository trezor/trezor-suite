import { type Dispatch } from 'redux';

import { type DesktopAnalyticsDep, events } from '@suite/analytics';
import { type DeviceRootState, selectSelectedDevice } from '@suite-common/device';
import { type WithServices } from '@suite-common/redux-utils';
import { type TrezorDevice } from '@suite-common/suite-types';
import { notificationsActions } from '@suite-common/toast-notifications';
import { type WalletSettingsRootState, selectAddressDisplayType } from '@suite-common/wallet-core';
import { type Account, AddressDisplayOptions } from '@suite-common/wallet-types';
import {
    getAddressParameters,
    getDerivationType,
    getNetworkId,
    getProtocolMagic,
    getStakingPath,
} from '@suite-common/wallet-utils';
import TrezorConnect, { PROTO } from '@trezor/connect';
import { asCoinSymbol, getSerializedPath } from '@trezor/connect-common';
import { type ErrorCode, type SerializedError } from '@trezor/connect-common/src/constants/errors';
import { type Result } from '@trezor/type-utils';

import * as SIGN_VERIFY from './signVerifyConstants';
import { getHasSelectableSignatureFormat } from './signVerifyUtils';

export type SignVerifyRootState = DeviceRootState & WalletSettingsRootState;

const CANCEL_ERROR_CODES: ErrorCode[] = ['Method_Cancel', 'Failure_ActionCancelled'];

const getFailureAttributes = ({ code }: SerializedError) => ({
    status: CANCEL_ERROR_CODES.includes(code) ? ('cancelled' as const) : ('error' as const),
    error: code,
});

const asError = (error: unknown) => (error instanceof Error ? error : new Error(String(error)));

export type SignVerifyAction =
    | { type: typeof SIGN_VERIFY.SIGN_SUCCESS; signSignature: string }
    | { type: typeof SIGN_VERIFY.VERIFY_SUCCESS };

type StateParams = {
    device: TrezorDevice;
    account: Account;
    coin: Account['symbol'];
    chunkify?: boolean;
};

const throwWhenFailed = <T>(response: Result<T, SerializedError>) =>
    response.success
        ? Promise.resolve(response.payload)
        : Promise.reject(new Error(response.error.message));

const getStateParams = (
    account: Account,
    getState: () => SignVerifyRootState,
): Promise<StateParams> => {
    const device = selectSelectedDevice(getState());
    const addressDisplayType = selectAddressDisplayType(getState());

    return !device || !device.connected || !device.available
        ? Promise.reject(new Error('Device not found'))
        : Promise.resolve({
              device,
              account,
              coin: account.symbol,
              chunkify: addressDisplayType === AddressDisplayOptions.CHUNKED,
          });
};

const showAddressByNetwork =
    (_: Dispatch, address: string, path: string) =>
    ({ account, device, coin, chunkify }: StateParams) => {
        const params = { device, address, path, coin: asCoinSymbol(coin), chunkify };

        switch (account.networkType) {
            case 'bitcoin':
                return TrezorConnect.getAddress(params);
            case 'ethereum':
                return TrezorConnect.ethereumGetAddress(params);
            default:
                return Promise.reject(new Error('ShowAddress not supported'));
        }
    };

const signByNetwork =
    (
        path: string | number[],
        message: string,
        hex: boolean,
        isElectrum: boolean,
        isCose: boolean,
    ) =>
    ({ account, device, coin }: StateParams) => {
        const params = {
            device,
            path,
            coin: asCoinSymbol(coin),
            message,
            hex,
            no_script_type: isElectrum,
        };

        switch (account.networkType) {
            case 'bitcoin':
                return TrezorConnect.signMessage(params);
            case 'ethereum':
                return TrezorConnect.ethereumSignMessage(params);
            case 'cardano': {
                const payload = hex ? message : Buffer.from(message, 'utf8').toString('hex');
                const serializedPath = typeof path === 'string' ? path : getSerializedPath(path);
                const stakingPath = getStakingPath(account);
                const addressParameters =
                    path === stakingPath
                        ? {
                              addressType: PROTO.CardanoAddressType.REWARD,
                              stakingPath,
                          }
                        : getAddressParameters(account, serializedPath);

                return TrezorConnect.cardanoSignMessage({
                    ...params,
                    payload,
                    addressParameters,
                    protocolMagic: getProtocolMagic(account.symbol),
                    networkId: getNetworkId(),
                    derivationType: getDerivationType(account.accountType),
                }).then(response =>
                    response.success
                        ? {
                              ...response,
                              payload: {
                                  signature: response.payload.coseSignature,
                                  pubKey: isCose
                                      ? response.payload.coseKey
                                      : response.payload.pubKey,
                                  address: response.payload.headers.protected.address,
                              },
                          }
                        : response,
                );
            }
            default:
                return Promise.reject(new Error('Signing not supported'));
        }
    };

export const isVerifySupported = (account?: Account) => {
    switch (account?.networkType) {
        case 'bitcoin':
        case 'ethereum':
            return true;
        default:
            return false;
    }
};

const verifyByNetwork =
    (address: string, message: string, signature: string, hex: boolean) =>
    ({ account, device, coin }: StateParams) => {
        const params = { device, address, coin: asCoinSymbol(coin), message, signature, hex };

        switch (account.networkType) {
            case 'bitcoin':
                return TrezorConnect.verifyMessage(params);
            case 'ethereum':
                return TrezorConnect.ethereumVerifyMessage(params);
            default:
                return Promise.reject(new Error('Verifying not supported'));
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

const onError =
    (
        dispatch: Dispatch,
        type: 'sign-message-error' | 'verify-message-error' | 'verify-address-error',
    ) =>
    (error: Error) => {
        dispatch(
            notificationsActions.addToast({
                type,
                error: error.message,
            }),
        );

        return false as const;
    };

type ShowAddressThunkState = SignVerifyRootState;

export const showAddressThunk =
    (account: Account, address: string, path: string) =>
    (dispatch: Dispatch, getState: () => ShowAddressThunkState) =>
        getStateParams(account, getState)
            .then(showAddressByNetwork(dispatch, address, path))
            .then(throwWhenFailed)
            .catch(onError(dispatch, 'verify-address-error'));

type SignThunkState = SignVerifyRootState;

type SignThunkDeps = WithServices<DesktopAnalyticsDep>;

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

type VerifyThunkState = SignVerifyRootState;

type VerifyThunkDeps = WithServices<DesktopAnalyticsDep>;

export const verifyThunk =
    (account: Account, address: string, message: string, signature: string, hex = false) =>
    async (dispatch: Dispatch, getState: () => VerifyThunkState, extra: VerifyThunkDeps) => {
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

                return onError(dispatch, 'verify-message-error')(new Error(response.error.message));
            }

            analytics.report({
                type: events.coinVerifyMessageEvent.name,
                payload: { status: 'success', symbol: account.symbol, hex },
            });

            return onVerifySuccess(dispatch)();
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

            return onError(dispatch, 'verify-message-error')(asError(error));
        }
    };
