import { type ReactNode } from 'react';

import { type StakingRateKind } from '@suite-common/earn-staking-common';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { isApyAvailable } from '@suite-common/wallet-utils';

import { StakingRateBreakdown } from './StakingRateBreakdown';
import { EarnRateTooltip } from '../common/EarnRateTooltip';

type StakingRateTooltipProps = {
    networkSymbol: NetworkSymbol;
    rate: number | null | undefined;
    rateKind: StakingRateKind | null;
    children: ReactNode;
};

export const StakingRateTooltip = ({
    networkSymbol,
    rate,
    rateKind,
    children,
}: StakingRateTooltipProps) => {
    if (rate == null || rateKind === null || !isApyAvailable(rate)) return children;

    return (
        <EarnRateTooltip
            content={
                <StakingRateBreakdown
                    networkSymbol={networkSymbol}
                    rate={rate}
                    rateKind={rateKind}
                />
            }
        >
            {children}
        </EarnRateTooltip>
    );
};
