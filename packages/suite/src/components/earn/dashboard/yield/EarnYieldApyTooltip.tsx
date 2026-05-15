import { type ReactNode } from 'react';

import styled from 'styled-components';

import { type YieldDto } from '@suite-common/earn-stablecoin-api';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { Tooltip } from '@trezor/components';

import { ApyValue } from 'src/views/wallet/staking/components/ApyValue';

import { EarnYieldApyBreakdown } from './EarnYieldApyBreakdown';

const Abbr = styled.abbr`
    cursor: help;
    text-decoration: underline dotted ${({ theme }) => theme.contentSecondary};
    text-decoration-thickness: 1px;
    text-underline-offset: 3px;
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
}: EarnYieldApyTooltipProps) => {
    if (!children && !apyPercentage) {
        return <ApyValue apy={apyPercentage} />;
    }

    return (
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
};
