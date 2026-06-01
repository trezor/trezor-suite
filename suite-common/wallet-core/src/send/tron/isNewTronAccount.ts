import { type Account } from '@suite-common/wallet-types';
import { getAccountIdentity } from '@suite-common/wallet-utils';
import TrezorConnect from '@trezor/connect';

export const isNewTronAccount = async (address: string, account: Account): Promise<boolean> => {
    if (!address) return false;
    const result = await TrezorConnect.getAccountInfo({
        coin: account.symbol,
        identity: getAccountIdentity(account),
        descriptor: address,
    });

    return result.success && (result.payload.empty ?? false);
};
