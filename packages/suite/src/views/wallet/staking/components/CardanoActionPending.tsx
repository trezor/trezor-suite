import React from 'react';
import { Translation } from 'src/components/suite/Translation';
import { useCardanoStaking } from 'src/hooks/wallet/useCardanoStaking';
import { Warning } from '@trezor/components';

export const CardanoActionPending = () => {
    const { pendingStakeTx } = useCardanoStaking();

    if (!pendingStakeTx) return null;

    return (
        <Warning variant="info">
            <Translation id="TR_STAKING_TX_PENDING" values={{ txid: pendingStakeTx.txid }} />
        </Warning>
    );
};
