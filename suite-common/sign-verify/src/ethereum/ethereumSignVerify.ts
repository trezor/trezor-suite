import { type TrezorDevice } from '@suite-common/suite-types';
import { type Account } from '@suite-common/wallet-types';
import TrezorConnect from '@trezor/connect';

import { signMessageThunk, verifyMessageThunk } from '../signVerifyActions';

type SignEthereumMessageParams = {
    device: TrezorDevice;
    path: string | number[];
    message: string;
    hex: boolean;
};

export const signEthereumMessage = ({ device, path, message, hex }: SignEthereumMessageParams) =>
    TrezorConnect.ethereumSignMessage({ device, path, message, hex });

type VerifyEthereumMessageParams = {
    device: TrezorDevice;
    address: string;
    message: string;
    signature: string;
    hex: boolean;
};

export const verifyEthereumMessage = ({
    device,
    address,
    message,
    signature,
    hex,
}: VerifyEthereumMessageParams) =>
    TrezorConnect.ethereumVerifyMessage({ device, address, message, signature, hex });

type SignEthereumMessageThunkParams = Omit<SignEthereumMessageParams, 'device' | 'path'> & {
    account: Account;
};

/** An Ethereum account has a single address, so it always signs with the account's own path. */
export const signEthereumMessageThunk = ({ account, ...params }: SignEthereumMessageThunkParams) =>
    signMessageThunk({
        account,
        hex: params.hex,
        signMessage: device => signEthereumMessage({ ...params, device, path: account.path }),
    });

type VerifyEthereumMessageThunkParams = Omit<VerifyEthereumMessageParams, 'device'> & {
    account: Account;
};

export const verifyEthereumMessageThunk = ({
    account,
    ...params
}: VerifyEthereumMessageThunkParams) =>
    verifyMessageThunk({
        account,
        hex: params.hex,
        verifyMessage: device => verifyEthereumMessage({ ...params, device }),
    });
