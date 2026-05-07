import { selectSelectedDevice } from '@suite-common/device';
import { notificationsActions } from '@suite-common/toast-notifications';
import { selectAddressDisplayType } from '@suite-common/wallet-core';
import { AddressDisplayOptions } from '@suite-common/wallet-types';
import {
    getAddressParameters,
    getDerivationType,
    getNetworkId,
    getProtocolMagic,
    getStakingPath,
} from '@suite-common/wallet-utils';
import TrezorConnect, { PROTO } from '@trezor/connect';
// eslint-disable-next-line @typescript-eslint/no-restricted-imports -- TODO: extract pathUtils to a shared location and remove this exception (see #27376 deferred work)
import { getSerializedPath } from '@trezor/connect/src/utils/pathUtils';
import { type SerializedError } from '@trezor/connect-common/src/constants/errors';
import { type Result } from '@trezor/type-utils';

import type { Dispatch, GetState, TrezorDevice } from 'src/types/suite';
import type { Account } from 'src/types/wallet';

import { SIGN_VERIFY } from './constants';

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

const getStateParams = (getState: GetState): Promise<StateParams> => {
    const {
        wallet: {
            selectedAccount: { account },
        },
    } = getState();
    const device = selectSelectedDevice(getState());
    const addressDisplayType = selectAddressDisplayType(getState());

    return !device || !device.connected || !device.available || !account
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
        const params = { device, address, path, coin, chunkify };

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
        const params = { device, path, coin, message, hex, no_script_type: isElectrum };

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
        const params = { device, address, coin, message, signature, hex };

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

export const showAddress =
    (address: string, path: string) => (dispatch: Dispatch, getState: GetState) =>
        getStateParams(getState)
            .then(showAddressByNetwork(dispatch, address, path))
            .then(throwWhenFailed)
            .catch(onError(dispatch, 'verify-address-error'));

export const sign =
    (path: string | number[], message: string, hex = false, isElectrum = false, isCose = false) =>
    (dispatch: Dispatch, getState: GetState) =>
        getStateParams(getState)
            .then(signByNetwork(path, message, hex, isElectrum, isCose))
            .then(throwWhenFailed)
            .then(onSignSuccess(dispatch))
            .catch(onError(dispatch, 'sign-message-error'));

export const verify =
    (address: string, message: string, signature: string, hex = false) =>
    (dispatch: Dispatch, getState: GetState) =>
        getStateParams(getState)
            .then(verifyByNetwork(address, message, signature, hex))
            .then(throwWhenFailed)
            .then(onVerifySuccess(dispatch))
            .catch(onError(dispatch, 'verify-message-error'));
