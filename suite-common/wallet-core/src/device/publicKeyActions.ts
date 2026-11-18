import { type TrezorDevice } from '@suite-common/suite-types';
import { type Account } from '@suite-common/wallet-types';
import { getPublicKeyForNetworkType } from '@suite-common/wallet-utils';
import { getDerivationType } from '@trezor/network-cardano-suite-common';

export const showXpubOnDevice = (device: TrezorDevice, account: Account) =>
    getPublicKeyForNetworkType({
        device,
        networkType: account.networkType,
        path: account.path,
        coin: account.symbol,
        showOnTrezor: true,
        derivationType: getDerivationType(account.accountType),
    });
