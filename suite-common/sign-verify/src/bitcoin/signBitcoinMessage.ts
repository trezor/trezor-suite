import { type TrezorDevice } from '@suite-common/suite-types';
import { type Account } from '@suite-common/wallet-types';
import TrezorConnect from '@trezor/connect';
import { asCoinSymbol } from '@trezor/connect-common';

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
