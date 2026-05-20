import { type ReactNode, useEffect, useRef } from 'react';

import styled from 'styled-components';

import { events } from '@suite/analytics';
import { type YieldDto } from '@suite-common/earn-stablecoin-api';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { Tooltip } from '@trezor/components';

import { useAnalytics } from 'src/support/useAnalytics';
import { ApyValue } from 'src/views/wallet/staking/components/ApyValue';

import { EarnYieldApyBreakdown } from './EarnYieldApyBreakdown';

const APY_TOOLTIP_REPORT_DELAY_MS = 1000;

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
    const analytics = useAnalytics();
    const reportTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(
        () => () => {
            if (reportTimerRef.current !== null) {
                clearTimeout(reportTimerRef.current);
            }
        },
        [],
    );

    if (!children && !apyPercentage) {
        return <ApyValue apy={apyPercentage} />;
    }

    const handleMouseEnter = () => {
        if (reportTimerRef.current !== null) {
            clearTimeout(reportTimerRef.current);
        }
        reportTimerRef.current = setTimeout(() => {
            analytics.report({
                type: events.yieldInteractionEvent.name,
                payload: {
                    element: 'apy-tooltip',
                    networkSymbol,
                    vaultId: vault.id,
                },
            });
            reportTimerRef.current = null;
        }, APY_TOOLTIP_REPORT_DELAY_MS);
    };

    const handleMouseLeave = () => {
        if (reportTimerRef.current !== null) {
            clearTimeout(reportTimerRef.current);
            reportTimerRef.current = null;
        }
    };

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
            <Abbr onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
                {children ?? <ApyValue apy={apyPercentage} />}
            </Abbr>
        </Tooltip>
    );
};
