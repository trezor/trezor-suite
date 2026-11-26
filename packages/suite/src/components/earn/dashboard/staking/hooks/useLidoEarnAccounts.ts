import { selectVisibleDeviceAccounts } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { getLidoDeployment } from '@trezor/network-ethereum-suite-common';

import { selectIsLidoStakingEnabled } from '#src/actions/wallet/lido/lidoStakingAccess';
import { useSelector } from '#src/hooks/suite/useSelector';

const NO_ACCOUNTS: readonly Account[] = [];

/**
 * The device accounts on a network Lido stakes on; each row decides whether it has anything to
 * show. None while Lido staking is not opted into, so the table then lists no Lido row.
 */
export const useLidoEarnAccounts = (): readonly Account[] => {
    const isLidoStakingEnabled = useSelector(selectIsLidoStakingEnabled);
    const accounts = useSelector(selectVisibleDeviceAccounts);

    if (!isLidoStakingEnabled) {
        return NO_ACCOUNTS;
    }

    return accounts.filter(account => getLidoDeployment(account.symbol) !== null);
};
