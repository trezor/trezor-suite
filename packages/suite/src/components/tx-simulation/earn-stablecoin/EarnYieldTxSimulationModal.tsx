import { useMemo } from 'react';

import { type UserContextModalType } from '@suite/modal';
import { useServices } from '@suite-common/dependency-injection';
import { composeStablecoinYieldTxSimulationAction } from '@suite-common/earn-stablecoin';
import { selectNetworkConfigDeps } from '@suite-common/networks';
import { selectAccountByKey } from '@suite-common/wallet-core';

import { useSelector } from 'src/hooks/suite';

import { EarnYieldTxSimulationModalInner } from './EarnYieldTxSimulationModalInner';

type EarnYieldTxSimulationModalProps = Pick<
    UserContextModalType<'earn-yield-tx-simulation'>,
    'data' | 'decision'
> & {
    closeModal: () => void;
};

export function EarnYieldTxSimulationModal({
    data,
    decision,
    closeModal,
}: EarnYieldTxSimulationModalProps) {
    const networkConfigDeps = useServices(selectNetworkConfigDeps);

    const parsedData = useMemo(
        () =>
            composeStablecoinYieldTxSimulationAction(
                networkConfigDeps,
                data,
                globalThis.location.origin,
            ),
        [networkConfigDeps, data],
    );
    const account = useSelector(state =>
        parsedData ? selectAccountByKey(state, parsedData.accountKey) : null,
    );

    if (!parsedData || !account) return null;

    return (
        <EarnYieldTxSimulationModalInner
            account={account}
            action={parsedData.action}
            decision={decision}
            closeModal={closeModal}
        />
    );
}
