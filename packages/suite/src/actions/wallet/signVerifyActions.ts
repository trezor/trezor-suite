import TrezorConnect, { Unsuccessful, Success } from '@trezor/connect';
import { notificationsActions } from '@suite-common/toast-notifications';
import { selectDevice } from '@suite-common/wallet-core';

import type { Dispatch, GetState, TrezorDevice } from 'src/types/suite';
import type { Account } from 'src/types/wallet';

import { SIGN_VERIFY } from './constants';
import { AddressDisplayOptions, selectAddressDisplayType } from 'src/reducers/suite/suiteReducer';

export type SignVerifyAction =
    | { type: typeof SIGN_VERIFY.SIGN_SUCCESS; signSignature: string }
    | { type: typeof SIGN_VERIFY.VERIFY_SUCCESS };

type StateParams = {
    device: TrezorDevice;
    account: Account;
    coin: Account['symbol'];
    useEmptyPassphrase: boolean;
    chunkify?: boolean;
};

const getStateParams = (getState: GetState): Promise<StateParams> => {
    const {
        wallet: {
            selectedAccount: { account },
        },
    } = getState();
    const device = selectDevice(getState());
    const addressDisplayType = selectAddressDisplayType(getState());

    return !device || !device.connected || !device.available || !account
        ? Promise.reject(new Error('Device not found'))
        : Promise.resolve({
              device,
              account,
              useEmptyPassphrase: device.useEmptyPassphrase,
              coin: account.symbol,
              chunkify: addressDisplayType === AddressDisplayOptions.CHUNKED,
          });
};

const showAddressByNetwork =
    (_: Dispatch, address: string, path: string) =>
    ({ account, device, coin, useEmptyPassphrase, chunkify }: StateParams) => {
        const params = {
            device,
            address,
            path,
            coin,
            useEmptyPassphrase,
            chunkify,
        };
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
    (path: string | number[], message: string, hex: boolean, isElectrum: boolean) =>
    ({ account, device, coin, useEmptyPassphrase }: StateParams) => {
        const params = {
            device,
            path,
            coin,
            message,
            useEmptyPassphrase,
            hex,
            no_script_type: isElectrum,
        };

        switch (account.networkType) {
            case 'bitcoin':
                return TrezorConnect.signMessage(params);
            case 'ethereum':
                return TrezorConnect.ethereumSignMessage(params);
            default:
                return Promise.reject(new Error('Signing not supported'));
        }
    };

const verifyByNetwork =
    (address: string, message: string, signature: string, hex: boolean) =>
    ({ account, device, coin, useEmptyPassphrase }: StateParams) => {
        const params = {
            device,
            address,
            coin,
            message,
            signature,
            useEmptyPassphrase,
            hex,
        };
        switch (account.networkType) {
            case 'bitcoin':
                return TrezorConnect.verifyMessage(params);
            case 'ethereum':
                return TrezorConnect.ethereumVerifyMessage(params);
            default:
                return Promise.reject(new Error('Verifying not supported'));
        }
    };

const onSignSuccess =
    (dispatch: Dispatch) =>
    ({ signature }: { signature: string }) => {
        dispatch(
            notificationsActions.addToast({
                type: 'sign-message-success',
            }),
        );
        dispatch({
            type: SIGN_VERIFY.SIGN_SUCCESS,
            signSignature: signature,
        });

        return signature;
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

const throwWhenFailed = <T>(response: Unsuccessful | Success<T>) =>
    response.success
        ? Promise.resolve(response.payload)
        : Promise.reject(new Error(response.payload.error));

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
    (path: string | number[], message: string, hex = false, isElectrum = false) =>
    (dispatch: Dispatch, getState: GetState) =>
        getStateParams(getState)
            .then(signByNetwork(path, message, hex, isElectrum))
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
