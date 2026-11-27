import { selectVisibleDeviceAccounts } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { getLidoDeployment } from '@trezor/network-ethereum-suite-common';

import { useSelector } from '#src/hooks/suite/useSelector';

export const useLidoEarnAccounts = (): readonly Account[] => {
    const accounts = useSelector(selectVisibleDeviceAccounts);

    return accounts.filter(account => getLidoDeployment(account.symbol) !== null);
};
