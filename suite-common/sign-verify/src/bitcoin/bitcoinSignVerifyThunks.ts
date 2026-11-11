import { type Account } from '@suite-common/wallet-types';
import TrezorConnect from '@trezor/connect';
import { asCoinSymbol } from '@trezor/connect-common';

import { getHasSelectableSignatureFormat } from './getHasSelectableSignatureFormat';
import { signMessageThunk } from '../signMessageThunk';
import { verifyMessageThunk } from '../verifyMessageThunk';

type SignBitcoinMessageThunkParams = {
    account: Account;
    path: string;
    message: string;
    hex: boolean;
    /** Signs in the Electrum-compatible format instead of BIP-137. */
    isElectrum: boolean;
};

export const signBitcoinMessageThunk = ({
    account,
    path,
    message,
    hex,
    isElectrum,
}: SignBitcoinMessageThunkParams) =>
    signMessageThunk({
        account,
        hex,
        // Networks signing in a single format never offered the choice, so reporting one of its
        // values would invent an answer the user never gave.
        signatureFormat: getHasSelectableSignatureFormat(account)
            ? isElectrum
                ? 'electrum'
                : 'trezor'
            : undefined,
        signMessage: device =>
            TrezorConnect.signMessage({
                device,
                path,
                coin: asCoinSymbol(account.symbol),
                message,
                hex,
                no_script_type: isElectrum,
            }),
    });

type VerifyBitcoinMessageThunkParams = {
    account: Account;
    address: string;
    message: string;
    signature: string;
    hex: boolean;
};

export const verifyBitcoinMessageThunk = ({
    account,
    address,
    message,
    signature,
    hex,
}: VerifyBitcoinMessageThunkParams) =>
    verifyMessageThunk({
        account,
        hex,
        verifyMessage: device =>
            TrezorConnect.verifyMessage({
                device,
                address,
                coin: asCoinSymbol(account.symbol),
                message,
                signature,
                hex,
            }),
    });
