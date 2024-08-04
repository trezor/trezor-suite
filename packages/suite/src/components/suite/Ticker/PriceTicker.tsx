import styled from 'styled-components';

import { FiatValue } from 'src/components/suite';
import { NoRatesTooltip } from './NoRatesTooltip';
import { typography } from '@trezor/theme';
import { LastUpdateTooltip } from './LastUpdateTooltip';
import { TokenAddress } from '@suite-common/wallet-types';

const FiatRateWrapper = styled.span`
    ${typography.callout}
    display: flex;
    align-items: center;
    color: ${({ theme }) => theme.textDefault};
`;

const Empty = styled.div`
    ${typography.callout}
    color: ${({ theme }) => theme.textSubdued};
`;

interface PriceTickerProps {
    symbol: string;
    contractAddress?: TokenAddress;
    noEmptyStateTooltip?: boolean;
    showLoadingSkeleton?: boolean;
}

export const PriceTicker = ({
    symbol,
    contractAddress,
    noEmptyStateTooltip,
    showLoadingSkeleton = true,
}: PriceTickerProps) => {
    const emptyStateComponent = noEmptyStateTooltip ? <Empty>—</Empty> : <NoRatesTooltip />;

    return (
        <FiatValue
            amount="1"
            symbol={symbol}
            tokenAddress={contractAddress}
            showLoadingSkeleton={showLoadingSkeleton}
            fiatRateFormatterOptions={{
                minimumFractionDigits: 0,
                maximumFractionDigits: 4,
            }}
        >
            {({ rate, timestamp }) =>
                rate && timestamp ? (
                    <LastUpdateTooltip timestamp={timestamp}>
                        <FiatRateWrapper>{rate}</FiatRateWrapper>
                    </LastUpdateTooltip>
                ) : (
                    emptyStateComponent
                )
            }
        </FiatValue>
    );
};
