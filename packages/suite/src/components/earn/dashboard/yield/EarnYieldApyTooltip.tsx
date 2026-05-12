import { type ReactNode } from 'react';

import styled from 'styled-components';

import { type YieldDto } from '@suite-common/earn-stablecoin-api';
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
    children?: ReactNode;
};

export const EarnYieldApyTooltip = ({
    vault,
    apyPercentage,
    networkSymbol,
    children,
}: EarnYieldApyTooltipProps) => (
    <Tooltip
        content={
            <EarnYieldApyBreakdown
                rewards={vault.rewardRate.components}
                networkSymbol={networkSymbol}
                underlyingToken={vault.token}
            />
        }
        maxWidth={600}
        placement="top"
    >
        <Abbr>{children ?? <ApyValue apy={apyPercentage} />}</Abbr>
    </Tooltip>
);
