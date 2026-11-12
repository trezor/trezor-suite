import { type TrezorDevice } from '@suite-common/suite-types';
import { type Account } from '@suite-common/wallet-types';
import TrezorConnect from '@trezor/connect';
import { asCoinSymbol } from '@trezor/connect-common';

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
