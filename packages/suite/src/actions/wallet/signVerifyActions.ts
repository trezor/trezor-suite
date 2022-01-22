import TrezorConnect, { ButtonRequestMessage, UI, Unsuccessful, Success } from 'trezor-connect';
import { SIGN_VERIFY } from './constants';
import { addToast } from '@suite-actions/notificationActions';
import { PROTOCOL_SCHEME } from '@suite-constants/protocol';
import { openModal, openDeferredModal } from '@suite-actions/modalActions';
import { getProtocolInfo } from '@suite-utils/parseUri';
import { isHex } from '@wallet-utils/ethUtils';
import type { Dispatch, GetState, TrezorDevice } from '@suite-types';
import type { Account } from '@wallet-types';

export type SignVerifyAction =
    | { type: typeof SIGN_VERIFY.SIGN_SUCCESS; signSignature: string }
    | { type: typeof SIGN_VERIFY.VERIFY_SUCCESS };

type StateParams = {
    device: TrezorDevice;
    account: Account;
    coin: Account['symbol'];
    useEmptyPassphrase: boolean;
};

const getStateParams = (getState: GetState): Promise<StateParams> => {
    const {
        suite: { device },
        wallet: {
            selectedAccount: { account },
        },
    } = getState();

    return !device || !device.connected || !device.available || !account
        ? Promise.reject(new Error('Device not found'))
        : Promise.resolve({
              device,
              account,
              useEmptyPassphrase: device.useEmptyPassphrase,
              coin: account.symbol,
          });
};

const showAddressByNetwork =
    (dispatch: Dispatch, address: string, path: string) =>
    ({ account, device, coin, useEmptyPassphrase }: StateParams) => {
        const buttonRequestHandler = (event: ButtonRequestMessage['payload']) => {
            if (!event || event.code !== 'ButtonRequest_Address') return;
            dispatch(
                openModal({
                    type: 'address',
                    device,
                    address,
                    addressPath: path,
                    networkType: account.networkType,
                    symbol: account.symbol,
                }),
            );
        };
        const bindRequestButton = <T>(response: Promise<T>) => {
            TrezorConnect.on(UI.REQUEST_BUTTON, buttonRequestHandler);
            return response.finally(() =>
                TrezorConnect.off(UI.REQUEST_BUTTON, buttonRequestHandler),
            );
        };
        const params = {
            device,
            address,
            path,
            coin,
            useEmptyPassphrase,
        };
        switch (account.networkType) {
            case 'bitcoin':
                return bindRequestButton(TrezorConnect.getAddress(params));
            case 'ethereum':
                return bindRequestButton(TrezorConnect.ethereumGetAddress(params));
            default:
                return Promise.reject(new Error('ShowAddress not supported'));
        }
    };

const signByNetwork =
    (path: string | number[], message: string, hex: boolean, aopp: boolean) =>
    ({ account, device, coin, useEmptyPassphrase }: StateParams) => {
        const params = {
            device,
            path,
            coin,
            message,
            useEmptyPassphrase,
            hex,
            no_script_type: aopp,
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
            addToast({
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
        addToast({
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
            addToast({
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
    (path: string | number[], message: string, hex = false, aopp = false) =>
    (dispatch: Dispatch, getState: GetState) =>
        getStateParams(getState)
            .then(signByNetwork(path, message, hex, aopp))
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

export const importAopp = (symbol?: Account['symbol']) => async (dispatch: Dispatch) => {
    const uri = await dispatch(openDeferredModal({ type: 'qr-reader', allowPaste: true }));
    if (!uri) return;
    const info = getProtocolInfo(uri);
    if (info?.scheme !== PROTOCOL_SCHEME.AOPP) return;
    if (info.asset && symbol && info.asset !== symbol) return;
    return {
        asset: info.asset,
        message: info.msg,
        callback: info.callback,
        format: info.format,
    };
};

export const sendAopp =
    (address: string, sig: string, callback: string) =>
    async (dispatch: Dispatch, getState: GetState) => {
        const network = getState().wallet.selectedAccount.account?.networkType;
        const signature =
            network === 'ethereum' && isHex(sig) ? Buffer.from(sig, 'hex').toString('base64') : sig;

        const confirm = await dispatch(
            openDeferredModal({ type: 'send-aopp-message', address, signature, callback }),
        );
        if (!confirm) return;

        const { success, error } = await fetch(callback, {
            method: 'POST',
            headers: { 'content-type': 'application/json; charset=utf-8' },
            body: JSON.stringify({
                version: 0,
                address,
                signature,
            }),
        })
            .then(res => ({
                success: res.status === 204,
                error: undefined,
            }))
            .catch(err => ({
                success: false,
                error: err.message,
            }));

        if (success) dispatch(addToast({ type: 'aopp-success' }));
        else dispatch(addToast({ type: 'aopp-error', error }));
        return success;
    };
