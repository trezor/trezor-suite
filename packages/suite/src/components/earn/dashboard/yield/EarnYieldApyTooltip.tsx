import { type ReactNode, useEffect, useRef } from 'react';

import styled from 'styled-components';

import { selectDesktopAnalyticsDep } from '@suite/analytics';
import { events } from '@suite-common/analytics';
import { useServices } from '@suite-common/dependency-injection';
import { type YieldDtoV2 } from '@suite-common/earn-stablecoin-api';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { Text, Tooltip } from '@trezor/components';

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
    vault: YieldDtoV2;
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
    const { analytics } = useServices(selectDesktopAnalyticsDep);
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
        return (
            <Text typographyStyle="body-sm-strong" intent="neutral" priority="primary">
                <ApyValue apy={apyPercentage} />
            </Text>
        );
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
            tooltipMaxWidth={600}
            placement="top"
        >
            <Text typographyStyle="body-sm-strong" intent="neutral" priority="primary">
                <Abbr
                    data-testid="@earn/dashboard/apy-percentage"
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                >
                    {children ?? <ApyValue apy={apyPercentage} />}
                </Abbr>
            </Text>
        </Tooltip>
    );
};
