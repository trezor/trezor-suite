import { type TrezorDevice } from '@suite-common/suite-types';
import { type Account } from '@suite-common/wallet-types';
import TrezorConnect from '@trezor/connect';
import { asCoinSymbol } from '@trezor/connect-common';

import { getHasSelectableSignatureFormat } from './getHasSelectableSignatureFormat';
import { signMessageThunk, verifyMessageThunk } from '../signVerifyActions';

type SignBitcoinMessageParams = {
    device: TrezorDevice;
    account: Account;
    path: string | number[];
    message: string;
    hex: boolean;
    isElectrum: boolean;
};

export const signBitcoinMessage = ({
    device,
    account,
    path,
    message,
    hex,
    isElectrum,
}: SignBitcoinMessageParams) =>
    TrezorConnect.signMessage({
        device,
        path,
        coin: asCoinSymbol(account.symbol),
        message,
        hex,
        no_script_type: isElectrum,
    });

type VerifyBitcoinMessageParams = {
    device: TrezorDevice;
    account: Account;
    address: string;
    message: string;
    signature: string;
    hex: boolean;
};

export const verifyBitcoinMessage = ({
    device,
    account,
    address,
    message,
    signature,
    hex,
}: VerifyBitcoinMessageParams) =>
    TrezorConnect.verifyMessage({
        device,
        address,
        coin: asCoinSymbol(account.symbol),
        message,
        signature,
        hex,
    });

type SignBitcoinMessageThunkParams = Omit<SignBitcoinMessageParams, 'device' | 'path'> & {
    path: string;
};

export const signBitcoinMessageThunk = (params: SignBitcoinMessageThunkParams) =>
    signMessageThunk({
        account: params.account,
        hex: params.hex,
        // Networks signing in a single format never offered the choice, so reporting one of its
        // values would invent an answer the user never gave.
        signatureFormat: getHasSelectableSignatureFormat(params.account)
            ? params.isElectrum
                ? 'electrum'
                : 'trezor'
            : undefined,
        signMessage: device => signBitcoinMessage({ ...params, device }),
    });

export const verifyBitcoinMessageThunk = (params: Omit<VerifyBitcoinMessageParams, 'device'>) =>
    verifyMessageThunk({
        account: params.account,
        hex: params.hex,
        verifyMessage: device => verifyBitcoinMessage({ ...params, device }),
    });
