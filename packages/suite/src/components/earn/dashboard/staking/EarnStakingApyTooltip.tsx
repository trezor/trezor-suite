import styled from 'styled-components';

import { Translation } from '@suite/intl';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { Tooltip } from '@trezor/components';

import { ApyValue } from 'src/views/wallet/staking/components/ApyValue';

const Abbr = styled.abbr`
    cursor: help;
    text-decoration: underline dotted ${({ theme }) => theme.contentSecondary};
    text-decoration-thickness: 1px;
    text-underline-offset: 3px;
`;

interface EarnStakingApyTooltipProps {
    symbol: NetworkSymbol;
    apy: number | null;
}

export const EarnStakingApyTooltip = ({ symbol, apy }: EarnStakingApyTooltipProps) => {
    if (!apy) {
        return <Translation id="TR_EARN_NOT_AVAILABLE" />;
    }

    return (
        <Tooltip
            content={
                <Translation
                    id={
                        symbol === 'trx'
                            ? 'TR_EARN_STAKING_APR_TOOLTIP'
                            : 'TR_EARN_STAKING_APY_TOOLTIP'
                    }
                />
            }
            maxWidth={600}
            placement="top"
        >
            <Abbr>
                <ApyValue apy={apy} />
            </Abbr>
        </Tooltip>
    );
};
