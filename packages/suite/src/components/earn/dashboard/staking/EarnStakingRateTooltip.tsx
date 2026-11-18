import styled from 'styled-components';

import { Translation } from '@suite/intl';
import { type StakingRateKind } from '@suite-common/earn-staking-common';
import { Text, Tooltip } from '@trezor/components';

import { ApyValue } from '#src/views/wallet/staking/components/ApyValue';

const Abbr = styled.abbr`
    cursor: help;
    text-decoration: underline dotted ${({ theme }) => theme.contentSecondary};
    text-decoration-thickness: 1px;
    text-underline-offset: 3px;
`;

interface EarnStakingRateTooltipProps {
    rateKind: StakingRateKind | null;
    rate: number | null;
}

export const EarnStakingRateTooltip = ({ rateKind, rate }: EarnStakingRateTooltipProps) => {
    if (!rate) {
        return (
            <Text typographyStyle="body-sm">
                <Translation id="TR_EARN_NOT_AVAILABLE" />
            </Text>
        );
    }

    return (
        <Tooltip
            content={
                <Translation
                    id={
                        rateKind === 'apr'
                            ? 'TR_EARN_STAKING_APR_TOOLTIP'
                            : 'TR_EARN_STAKING_APY_TOOLTIP'
                    }
                />
            }
            tooltipMaxWidth={280}
            placement="top"
        >
            <Text
                typographyStyle="body-sm-strong"
                intent="neutral"
                priority="primary"
                data-testid="@earn/dashboard/staking-rate"
            >
                <Abbr>
                    <ApyValue apy={rate} />
                </Abbr>
            </Text>
        </Tooltip>
    );
};
