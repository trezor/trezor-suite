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

    if (!result.success) return false;

    // Transaction history does not imply on-chain activation: an address that has only
    // ever received TRC-20 tokens is not `empty`, yet sending TRX to it still triggers
    // account creation and its activation fee. Every activated account is granted the
    // 600 free-bandwidth allotment, so a missing or zero totalFreeBandwidth means the
    // account does not exist on-chain yet.
    return (
        result.payload.empty || (result.payload.misc?.tronResources?.totalFreeBandwidth ?? 0) === 0
    );
};
