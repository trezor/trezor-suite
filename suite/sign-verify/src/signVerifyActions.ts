import { type Dispatch } from 'redux';

import { type DeviceRootState, selectSelectedDevice } from '@suite-common/device';
import { notificationsActions } from '@suite-common/toast-notifications';
import { type WalletSettingsRootState, selectAddressDisplayType } from '@suite-common/wallet-core';
import { type Account, AddressDisplayOptions } from '@suite-common/wallet-types';
import type {
    SignVerifyCapability,
    SignVerifyOperationParams,
    SignVerifyOperationResult,
} from '@trezor/network-module-suite-types';

import * as SIGN_VERIFY from './signVerifyConstants';

export type SignVerifyRootState = DeviceRootState & WalletSettingsRootState;

type GetState = () => SignVerifyRootState;

export type SignVerifyAction =
    | { type: typeof SIGN_VERIFY.SIGN_SUCCESS; signSignature: string }
    | { type: typeof SIGN_VERIFY.VERIFY_SUCCESS };

const throwWhenFailed = <T>(response: SignVerifyOperationResult<T>) =>
    response.success
        ? Promise.resolve(response.payload)
        : Promise.reject(new Error(response.error.message));

const getStateParams = (
    account: Account,
    getState: GetState,
): Promise<SignVerifyOperationParams> => {
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

const onSignSuccess =
    (dispatch: Dispatch) => (result: { signature: string; additionalResult?: string }) => {
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
    (networkConfig: SignVerifyCapability, account: Account, address: string, path: string) =>
    (dispatch: Dispatch, getState: GetState) =>
        getStateParams(account, getState)
            .then(params =>
                networkConfig.showAddress
                    ? networkConfig.showAddress({ ...params, address, path })
                    : Promise.reject(new Error('ShowAddress not supported')),
            )
            .then(throwWhenFailed)
            .catch(onError(dispatch, 'verify-address-error'));

export const sign =
    (
        networkConfig: SignVerifyCapability,
        account: Account,
        path: string | number[],
        message: string,
        hex = false,
        signOption = false,
    ) =>
    (dispatch: Dispatch, getState: GetState) =>
        getStateParams(account, getState)
            .then(params =>
                networkConfig.sign({
                    ...params,
                    path,
                    message,
                    hex,
                    signOption,
                }),
            )
            .then(throwWhenFailed)
            .then(onSignSuccess(dispatch))
            .catch(onError(dispatch, 'sign-message-error'));

export const verify =
    (
        networkConfig: SignVerifyCapability,
        account: Account,
        address: string,
        message: string,
        signature: string,
        hex = false,
    ) =>
    (dispatch: Dispatch, getState: GetState) =>
        getStateParams(account, getState)
            .then(params =>
                networkConfig.verify
                    ? networkConfig.verify({
                          ...params,
                          address,
                          message,
                          signature,
                          hex,
                      })
                    : Promise.reject(new Error('Verifying not supported')),
            )
            .then(throwWhenFailed)
            .then(onVerifySuccess(dispatch))
            .catch(onError(dispatch, 'verify-message-error'));
