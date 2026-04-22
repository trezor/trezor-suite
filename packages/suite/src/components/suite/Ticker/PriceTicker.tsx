import styled from 'styled-components';

import type { NetworkSymbol } from '@suite-common/wallet-config';
import type { TokenAddress } from '@suite-common/wallet-types';
import { typography } from '@trezor/theme';

import { BaseCurrencyValue } from 'src/components/suite/BaseCurrencyValue';
import { HiddenPlaceholder } from 'src/components/suite/HiddenPlaceholder';

import { LastUpdateTooltip } from './LastUpdateTooltip';
import { NoRatesTooltip } from './NoRatesTooltip';

const FiatRateWrapper = styled.span`
    ${typography['body-sm-strong']}
    display: flex;
    align-items: center;
    color: ${({ theme }) => theme.contentPrimary};
`;

const Empty = styled.div`
    ${typography['body-sm-strong']}
    color: ${({ theme }) => theme.contentSecondary};
`;

interface PriceTickerProps {
    symbol: NetworkSymbol;
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
        <HiddenPlaceholder>
            <BaseCurrencyValue
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
            </BaseCurrencyValue>
        </HiddenPlaceholder>
    );
};
