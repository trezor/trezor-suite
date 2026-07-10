import { useEffect, useRef } from 'react';

import { events, selectDesktopAnalyticsDep } from '@suite/analytics';
import { Translation } from '@suite/intl';
import { useServices } from '@suite-common/dependency-injection';
import { Icon, Row, Text, Tooltip } from '@trezor/components';
import { InfoIcon } from '@trezor/icons';

const HINT_TOOLTIP_REPORT_DELAY_MS = 1000;

export const EarnStakingVsYieldHint = () => {
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

    const handleMouseEnter = () => {
        if (reportTimerRef.current !== null) {
            clearTimeout(reportTimerRef.current);
        }
        reportTimerRef.current = setTimeout(() => {
            analytics.report({
                type: events.yieldInteractionEvent.name,
                payload: {
                    element: 'staking-vs-yield-tooltip',
                },
            });
            reportTimerRef.current = null;
        }, HINT_TOOLTIP_REPORT_DELAY_MS);
    };

    const handleMouseLeave = () => {
        if (reportTimerRef.current !== null) {
            clearTimeout(reportTimerRef.current);
            reportTimerRef.current = null;
        }
    };

    return (
        <Tooltip
            hasArrow
            content={
                <Text typographyStyle="body-sm">
                    <Translation id="TR_EARN_STAKING_VS_YIELD_DESCRIPTION" />
                </Text>
            }
        >
            <div onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
                <Row gap={4} alignItems="center">
                    <Icon as={InfoIcon} size={16} intent="neutral" priority="secondary" />
                    <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                        <Translation id="TR_EARN_STAKING_VS_YIELD_TITLE" />
                    </Text>
                </Row>
            </div>
        </Tooltip>
    );
};
