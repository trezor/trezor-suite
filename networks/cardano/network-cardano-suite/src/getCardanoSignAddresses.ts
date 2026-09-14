import { type SignAddresses, toSignAddresses } from '@suite/sign-verify';
import { type AccountWithNetworkType, type ReceiveInfo } from '@suite-common/wallet-types';
import { getStakingPath } from '@suite-common/wallet-utils';

export const getCardanoSignAddresses = (
    account: AccountWithNetworkType<'cardano'>,
    touchedAddresses: ReceiveInfo[],
): SignAddresses => ({
    ...toSignAddresses(
        [
            {
                path: getStakingPath(account),
                address: account.misc.staking.address,
            },
        ],
        'TR_STAKING_STAKE_ADDRESS',
    ),
    ...toSignAddresses(
        touchedAddresses.length ? touchedAddresses : (account.addresses?.unused || []).slice(0, 1),
        'TR_ADDRESSES_FRESH',
    ),
    ...toSignAddresses(account.addresses?.used?.slice().reverse() || [], 'TR_ADDRESSES_USED'),
    ...toSignAddresses(account.addresses?.change?.slice().reverse() || [], 'TR_ADDRESSES_CHANGE'),
});
