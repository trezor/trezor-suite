import { type Account } from '@suite-common/wallet-types';

import { getHasSelectableSignatureFormat } from './getHasSelectableSignatureFormat';
import { signBitcoinMessage } from './signBitcoinMessage';
import { signMessageThunk } from '../signMessageThunk';

type SignBitcoinMessageThunkParams = {
    account: Account;
    path: string;
    message: string;
    hex: boolean;
    isElectrum: boolean;
};

const getSignatureFormat = (
    account: Account,
    isElectrum: boolean,
): 'electrum' | 'trezor' | undefined => {
    // Networks signing in a single format never offered the choice, so reporting one of its
    // values would invent an answer the user never gave.
    if (!getHasSelectableSignatureFormat(account)) {
        return undefined;
    }

    return isElectrum ? 'electrum' : 'trezor';
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
        signatureFormat: getSignatureFormat(account, isElectrum),
        signMessage: device =>
            signBitcoinMessage({ device, account, path, message, hex, isElectrum }),
    });
