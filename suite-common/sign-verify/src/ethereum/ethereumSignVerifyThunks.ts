import { type Account } from '@suite-common/wallet-types';
import TrezorConnect from '@trezor/connect';

import { signMessageThunk } from '../signMessageThunk';
import { verifyMessageThunk } from '../verifyMessageThunk';

type SignEthereumMessageThunkParams = {
    account: Account;
    message: string;
    hex: boolean;
};

/** An Ethereum account has a single address, so it always signs with the account's own path. */
export const signEthereumMessageThunk = ({
    account,
    message,
    hex,
}: SignEthereumMessageThunkParams) =>
    signMessageThunk({
        account,
        hex,
        signMessage: device =>
            TrezorConnect.ethereumSignMessage({ device, path: account.path, message, hex }),
    });

type VerifyEthereumMessageThunkParams = {
    account: Account;
    address: string;
    message: string;
    signature: string;
    hex: boolean;
};

export const verifyEthereumMessageThunk = ({
    account,
    address,
    message,
    signature,
    hex,
}: VerifyEthereumMessageThunkParams) =>
    verifyMessageThunk({
        account,
        hex,
        verifyMessage: device =>
            TrezorConnect.ethereumVerifyMessage({ device, address, message, signature, hex }),
    });
