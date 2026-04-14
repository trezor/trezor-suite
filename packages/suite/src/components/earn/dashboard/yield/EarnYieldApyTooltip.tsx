import styled from 'styled-components';

import { type YieldDto } from '@suite-common/earn-api';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { Tooltip } from '@trezor/components';

import { ApyValue } from 'src/views/wallet/staking/components/ApyValue';

import { EarnYieldApyBreakdown } from './EarnYieldApyBreakdown';

const Abbr = styled.abbr`
    border-bottom: 1px dotted ${({ theme }) => theme.contentSecondary};
    cursor: help;
    text-decoration: none;
`;

type EarnYieldApyTooltipProps = {
    vault: YieldDto;
    apyPercentage: number | null;
    networkSymbol: NetworkSymbol;
};

export const EarnYieldApyTooltip = ({
    vault,
    apyPercentage,
    networkSymbol,
}: EarnYieldApyTooltipProps) => {
    const { components: rewards } = vault.rewardRate;

    if (!rewards?.length) {
        return <ApyValue apy={apyPercentage} />;
    }

    return (
        <Tooltip
            content={<EarnYieldApyBreakdown rewards={rewards} networkSymbol={networkSymbol} />}
            maxWidth={600}
            placement="top"
            hasArrow
        >
            <Abbr>
                <ApyValue apy={apyPercentage} />
            </Abbr>
        </Tooltip>
    );
};
