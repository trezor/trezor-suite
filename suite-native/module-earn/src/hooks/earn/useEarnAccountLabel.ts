import { selectNetworkConfigDeps } from '@suite-common/networks';
import { useServices } from '@suite-common/dependency-injection';
import { useSelector } from 'react-redux';

import { getNetwork } from '@suite-common/wallet-config';
import { type Account } from '@suite-common/wallet-types';
import { selectAccountLabel } from '@suite-native/accounts';
import { type CombinedLabelingState } from '@suite-native/labeling';

export const useEarnAccountLabel = (account: Account | null | undefined) => {
    const networkConfigDeps = useServices(selectNetworkConfigDeps);

    const customAccountLabel = useSelector((state: CombinedLabelingState) =>
        account
            ? selectAccountLabel(state, account.deviceState, account.descriptor, account.symbol)
            : null,
    );

    return account
        ? (customAccountLabel ?? getNetwork(networkConfigDeps, account.symbol).name)
        : '';
};
