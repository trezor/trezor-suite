import { useNetworkStakingRate } from '@suite-common/earn-staking';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type AccountKey, type AssetBalance } from '@suite-common/wallet-types';
import { isApyAvailable } from '@suite-common/wallet-utils';
import { Badge } from '@trezor/components';

import { AssetTableRowView } from '#src/components/wallet/assets/AssetTableRowView';
import { StakingRateText } from '#src/components/wallet/assets/StakingRateText';
import { useOpenAccountStaking } from '#src/components/wallet/assets/useOpenAccountStaking';

type AccountStakingRowProps = {
    accountKey: AccountKey;
    networkSymbol: NetworkSymbol;
    /** Left out for a stake inside the balance, which the coin's row already shows. */
    balance: AssetBalance | null;
};

/**
 * A Home asset row with what one account stakes of its coin, and the rate the stake earns, drawn as
 * the mobile staking row is, with a piggy bank and no price; it opens the account's Staking.
 */
export const AccountStakingRow = ({
    accountKey,
    networkSymbol,
    balance,
}: AccountStakingRowProps) => {
    const openAccountStaking = useOpenAccountStaking({ from: 'account-overview' });
    const { rate, rateKind } = useNetworkStakingRate({ networkSymbol, accountKey });

    return (
        <AssetTableRowView
            isStaking
            networkSymbol={networkSymbol}
            badge={
                isApyAvailable(rate) &&
                rateKind !== null && (
                    <Badge intent="brand" size="small">
                        <StakingRateText rate={rate} rateKind={rateKind} />
                    </Badge>
                )
            }
            balance={balance}
            onOpen={() => openAccountStaking(networkSymbol)}
            data-testid={`@wallet/account-asset/${networkSymbol}/staking`}
        />
    );
};
