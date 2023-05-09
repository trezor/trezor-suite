import React from 'react';
import { Translation } from '@suite-components/Translation';
import { useCardanoStaking } from '@wallet-hooks/useCardanoStaking';
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
