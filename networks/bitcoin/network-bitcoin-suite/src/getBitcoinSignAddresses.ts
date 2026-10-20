import { type Account, type ReceiveInfo } from '@suite-common/wallet-types';
import { type SignAddresses, toSignAddresses } from '@suite-lego/sign-verify';

export const getBitcoinSignAddresses = (
    account: Account,
    touchedAddresses: ReceiveInfo[],
): SignAddresses => ({
    ...toSignAddresses(
        touchedAddresses.length ? touchedAddresses : (account.addresses?.unused || []).slice(0, 1),
        'TR_ADDRESSES_FRESH',
    ),
    ...toSignAddresses(account.addresses?.used?.slice().reverse() || [], 'TR_ADDRESSES_USED'),
    ...toSignAddresses(account.addresses?.change?.slice().reverse() || [], 'TR_ADDRESSES_CHANGE'),
});
