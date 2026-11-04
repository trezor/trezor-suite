import styled from 'styled-components';

import { Translation } from '@suite/intl';
import { type NetworkType } from '@suite-common/wallet-config';
import { isApyAvailable } from '@suite-common/wallet-utils';
import { Text, Tooltip } from '@trezor/components';

import { ApyValue } from '#src/views/wallet/staking/components/ApyValue';

const Abbr = styled.abbr`
    cursor: help;
    text-decoration: underline dotted ${({ theme }) => theme.contentSecondary};
    text-decoration-thickness: 1px;
    text-underline-offset: 3px;
`;

interface EarnStakingRateTooltipProps {
    networkType: NetworkType;
    rate: number | null;
    hasNoPool?: boolean;
}

export const EarnStakingRateTooltip = ({
    networkType,
    rate,
    hasNoPool,
}: EarnStakingRateTooltipProps) => {
    if (hasNoPool) {
        return (
            <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                <Translation id="TR_STAKING_REWARDS_REDUCED" />
            </Text>
        );
    }

    if (!isApyAvailable(rate)) {
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
                        networkType === 'tron'
                            ? 'TR_EARN_STAKING_APR_TOOLTIP'
                            : 'TR_EARN_STAKING_APY_TOOLTIP'
                    }
                />
            }
            tooltipMaxWidth={280}
            placement="top"
        >
            <Text typographyStyle="body-sm-strong" intent="neutral" priority="primary">
                <Abbr>
                    <ApyValue apy={rate} />
                </Abbr>
            </Text>
        </Tooltip>
    );
};
