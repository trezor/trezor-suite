import React from 'react';
import { Translation } from '@suite-components/Translation';
import { useCardanoStaking } from '@wallet-hooks/useCardanoStaking';
import { InfoBox } from '../primitives';

const ActionInProgress = () => {
    const { pendingStakeTx } = useCardanoStaking();
    if (!pendingStakeTx) return null;
    return (
        <InfoBox>
            <Translation id="TR_STAKING_TX_PENDING" values={{ txid: pendingStakeTx.txid }} />
        </InfoBox>
    );
};

export default ActionInProgress;
