import styled from 'styled-components';

import { FiatValue } from 'src/components/suite';
import { NoRatesTooltip } from './NoRatesTooltip';
import { typography } from '@trezor/theme';
import { LastUpdateTooltip } from './LastUpdateTooltip';

const FiatRateWrapper = styled.span`
    ${typography.callout}
    display: flex;
    align-items: center;
    color: ${({ theme }) => theme.textDefault};
`;

interface PriceTickerProps {
    symbol: string;
}

export const PriceTicker = ({ symbol }: PriceTickerProps) => (
    <FiatValue amount="1" symbol={symbol} showLoadingSkeleton>
        {({ rate, timestamp }) =>
            rate && timestamp ? (
                <LastUpdateTooltip timestamp={timestamp}>
                    <FiatRateWrapper>{rate}</FiatRateWrapper>
                </LastUpdateTooltip>
            ) : (
                <NoRatesTooltip />
            )
        }
    </FiatValue>
);
