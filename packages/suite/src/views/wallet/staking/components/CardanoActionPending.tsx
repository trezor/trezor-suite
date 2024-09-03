import { Translation } from 'src/components/suite/Translation';
import { useCardanoStaking } from 'src/hooks/wallet/useCardanoStaking';
import { Banner } from '@trezor/components';

export const CardanoActionPending = () => {
    const { pendingStakeTx } = useCardanoStaking();

    if (!pendingStakeTx) return null;

    return (
        <Banner variant="info">
            <Translation id="TR_STAKING_TX_PENDING" values={{ txid: pendingStakeTx.txid }} />
        </Banner>
    );
};
