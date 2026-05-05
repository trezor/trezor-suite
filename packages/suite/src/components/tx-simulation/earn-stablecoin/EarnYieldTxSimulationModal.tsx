import { useMemo } from 'react';

import { type UserContextModalType } from '@suite/modal';
import { composeStablecoinYieldTxSimmulationAction } from '@suite-common/earn-stablecoin/src/tx-simulation';
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
    const parsedData = useMemo(() => composeStablecoinYieldTxSimmulationAction(data), [data]);
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
