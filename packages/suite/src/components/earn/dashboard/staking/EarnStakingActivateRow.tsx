import { Translation } from '@suite/intl';
import {
    formatStakingAmount,
    selectStakeableStakingProductDescriptorBySymbol,
    useNetworkStakingRate,
} from '@suite-common/earn-staking';
import { useFormatters } from '@suite-common/formatters';
import { type NetworkSymbol, getNetwork } from '@suite-common/wallet-config';

import { useSelector } from '#src/hooks/suite/useSelector';

import { EarnInactiveNetworkOpportunity } from '../common/EarnInactiveNetworkOpportunity';

interface EarnStakingActivateRowProps {
    symbol: NetworkSymbol;
    isCardLayout: boolean;
}

export const EarnStakingActivateRow = ({ symbol, isCardLayout }: EarnStakingActivateRowProps) => {
    const { CryptoAmountFormatter } = useFormatters();

    const { rate, rateKind } = useNetworkStakingRate({ networkSymbol: symbol });
    const limits = useSelector(
        state => selectStakeableStakingProductDescriptorBySymbol(state, symbol)?.limits ?? null,
    );

    const { displaySymbol } = getNetwork(symbol);

    const minStakingAmount =
        limits === null
            ? undefined
            : formatStakingAmount({
                  amount: limits.minStakeAmountForDashboard,
                  networkSymbol: symbol,
              });

    return (
        <EarnInactiveNetworkOpportunity
            symbol={symbol}
            rate={rate}
            rateKind={rateKind}
            isCardLayout={isCardLayout}
            note={
                <Translation
                    id="TR_EARN_STAKING_DASHBOARD_MINIMUM_STAKE"
                    values={{
                        amount: minStakingAmount
                            ? CryptoAmountFormatter.format(minStakingAmount, {
                                  symbol,
                                  isBalance: true,
                                  withSymbol: false,
                              })
                            : undefined,
                        displaySymbol,
                    }}
                />
            }
        />
    );
};
