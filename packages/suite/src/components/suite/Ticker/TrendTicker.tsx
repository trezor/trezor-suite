import styled, { useTheme } from 'styled-components';

import { spacingsPx, typography } from '@trezor/theme';
import { Icon } from '@trezor/components';
import { getFiatRateKey, localizePercentage } from '@suite-common/wallet-utils';
import { selectFiatRatesByFiatRateKey } from '@suite-common/wallet-core';
import { NetworkSymbol } from '@suite-common/wallet-config';
import { TokenAddress } from '@suite-common/wallet-types';

import { FiatValue } from 'src/components/suite';
import { useSelector } from 'src/hooks/suite';
import { selectLocalCurrency } from 'src/reducers/wallet/settingsReducer';
import { selectLanguage } from 'src/reducers/suite/suiteReducer';
import { NoRatesTooltip } from './NoRatesTooltip';

const PercentageWrapper = styled.div<{ $isRateGoingUp: boolean }>`
    ${typography.callout}
    gap: ${spacingsPx.xxs};
    display: flex;
    align-items: center;
    color: ${({ theme, $isRateGoingUp }) =>
        $isRateGoingUp ? theme.textPrimaryDefault : theme.textAlertRed};
`;

const Empty = styled.div`
    ${typography.callout}
    color: ${({ theme }) => theme.textSubdued};
`;

const calculatePercentageDifference = (a: number, b: number) => (a - b) / b;

interface TickerProps {
    symbol: NetworkSymbol;
    contractAddress?: TokenAddress;
    noEmptyStateTooltip?: boolean;
    showLoadingSkeleton?: boolean;
}
export const TrendTicker = ({
    symbol,
    contractAddress,
    noEmptyStateTooltip,
    showLoadingSkeleton = true,
}: TickerProps) => {
    const locale = useSelector(selectLanguage);
    const localCurrency = useSelector(selectLocalCurrency);
    const fiatRateKey = getFiatRateKey(symbol, localCurrency, contractAddress);
    const lastWeekRate = useSelector(state =>
        selectFiatRatesByFiatRateKey(state, fiatRateKey, 'lastWeek'),
    );
    const currentRate = useSelector(state => selectFiatRatesByFiatRateKey(state, fiatRateKey));

    const theme = useTheme();

    const isSuccessfullyFetched =
        lastWeekRate?.lastTickerTimestamp && currentRate?.lastTickerTimestamp;

    // TODO: create selectIsRateGoingUp selector when wallet.settings is moved to suite-common
    const isRateGoingUp = isSuccessfullyFetched ? currentRate.rate! >= lastWeekRate.rate! : false;
    const percentageChange = isSuccessfullyFetched
        ? calculatePercentageDifference(currentRate.rate!, lastWeekRate.rate!)
        : 0;

    const emptyStateComponent = noEmptyStateTooltip ? <Empty>—</Empty> : <NoRatesTooltip />;

    return (
        <FiatValue amount="1" symbol={symbol} showLoadingSkeleton={showLoadingSkeleton}>
            {({ rate, timestamp }) =>
                rate && timestamp && percentageChange ? (
                    <PercentageWrapper $isRateGoingUp={isRateGoingUp}>
                        <Icon
                            icon={isRateGoingUp ? 'TREND_UP' : 'TREND_DOWN'}
                            color={isRateGoingUp ? theme.iconPrimaryDefault : theme.iconAlertRed}
                            size={16}
                        />
                        {localizePercentage({ valueInFraction: percentageChange, locale })}
                    </PercentageWrapper>
                ) : (
                    emptyStateComponent
                )
            }
        </FiatValue>
    );
};
