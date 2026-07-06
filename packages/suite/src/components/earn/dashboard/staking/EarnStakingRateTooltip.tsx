import styled from 'styled-components';

import { Translation } from '@suite/intl';
import { type NetworkType } from '@suite-common/wallet-config';
import { Tooltip } from '@trezor/components';

import { ApyValue } from 'src/views/wallet/staking/components/ApyValue';

const Abbr = styled.abbr`
    cursor: help;
    text-decoration: underline dotted ${({ theme }) => theme.contentSecondary};
    text-decoration-thickness: 1px;
    text-underline-offset: 3px;
`;

interface EarnStakingRateTooltipProps {
    networkType: NetworkType;
    rate: number | null;
}

export const EarnStakingRateTooltip = ({ networkType, rate }: EarnStakingRateTooltipProps) => {
    if (!rate) {
        return <Translation id="TR_EARN_NOT_AVAILABLE" />;
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
            <Abbr>
                <ApyValue apy={rate} />
            </Abbr>
        </Tooltip>
    );
};
