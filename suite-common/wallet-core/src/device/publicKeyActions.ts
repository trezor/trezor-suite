import { type TrezorDevice } from '@suite-common/suite-types';
import { type Account } from '@suite-common/wallet-types';
import { getDerivationType, getPublicKeyForNetworkType } from '@suite-common/wallet-utils';

export const showXpubOnDevice = (device: TrezorDevice, account: Account) =>
    getPublicKeyForNetworkType({
        device,
        networkType: account.networkType,
        path: account.path,
        coin: account.symbol,
        showOnTrezor: true,
        derivationType: getDerivationType(account.accountType),
    });
