import { type TrezorDevice } from '@suite-common/suite-types';
import { type Account } from '@suite-common/wallet-types';
import { getPublicKeyForNetworkType } from '@suite-common/wallet-utils';
import { getDerivationType } from '@trezor/network-cardano-suite-common';

type ShowXpubOnDeviceOptions = { showOnTrezor?: boolean };

export const showXpubOnDevice = (
    device: TrezorDevice,
    account: Account,
    { showOnTrezor = true }: ShowXpubOnDeviceOptions = {},
) =>
    getPublicKeyForNetworkType({
        device,
        networkType: account.networkType,
        path: account.path,
        coin: account.symbol,
        showOnTrezor,
        derivationType: getDerivationType(account.accountType),
    });
