import { selectFiatRatesByFiatRateKey } from '@suite-common/wallet-core';
import { getFiatRateKey, localizeNumber } from '@suite-common/wallet-utils';
import { Icon, variables } from '@trezor/components';
import { FONT_SIZE, FONT_WEIGHT } from '@trezor/components/src/config/variables';
import { PropsWithChildren, ReactNode } from 'react';
import { FiatValue, Translation } from 'src/components/suite';
import { useSelector } from 'src/hooks/suite';
import { Account } from 'src/types/wallet';
import styled, { useTheme } from 'styled-components';

const Wrapper = styled.div`
    display: flex;
    gap: 42px;

    ${variables.SCREEN_QUERY.BELOW_LAPTOP} {
        gap: 28px;
    }
`;

const Name = styled.div`
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    font-size: ${FONT_SIZE.TINY};
    margin-bottom: 3px;
`;

const Value = styled.div`
    font-weight: ${FONT_WEIGHT.MEDIUM};
`;

const ChangeWrapper = styled.div<{ color: string }>`
    display: flex;
    align-items: center;
    color: ${({ color }) => color};

    > :first-child {
        margin-right: 4px;
    }
`;

interface TradeBoxHeadCardProps extends PropsWithChildren {
    name: ReactNode;
}

const TradeBoxHeadCard = ({ name, children }: TradeBoxHeadCardProps) => (
    <div>
        <Name>{name}</Name>
        <Value>{children}</Value>
    </div>
);

const calculatePercentageDifference = (a: number, b: number) => ((a - b) / b) * 100;

interface TradeBoxPricesProps {
    account: Account;
}

export const TradeBoxPrices = ({ account }: TradeBoxPricesProps) => {
    const theme = useTheme();
    const locale = useSelector(state => state.suite.settings.language);
    const localCurrency = useSelector(state => state.wallet.settings.localCurrency);

    const lastWeekRate = useSelector(state =>
        selectFiatRatesByFiatRateKey(
            state,
            getFiatRateKey(account?.symbol, localCurrency),
            'lastWeek',
        ),
    );

    const currentRate = useSelector(state =>
        selectFiatRatesByFiatRateKey(
            state,
            getFiatRateKey(account?.symbol, localCurrency),
            'current',
        ),
    );

    const isSuccessfullyFetched =
        lastWeekRate?.lastSuccessfulFetchTimestamp && currentRate?.lastSuccessfulFetchTimestamp;

    // TODO: create selectIsRateGoingUp selector when wallet.settings is moved to suite-common
    const rateGoingUp = isSuccessfullyFetched ? currentRate.rate! >= lastWeekRate.rate! : false;
    const percentChange = isSuccessfullyFetched
        ? calculatePercentageDifference(currentRate.rate!, lastWeekRate.rate!)
        : 0;

    return (
        <Wrapper>
            <TradeBoxHeadCard name={<Translation id="TR_EXCHANGE_RATE" />}>
                <FiatValue amount="1" symbol={account.symbol}>
                    {({ rate }) => <>{rate}</>}
                </FiatValue>
            </TradeBoxHeadCard>

            <TradeBoxHeadCard name={<Translation id="TR_7D_CHANGE" />}>
                {isSuccessfullyFetched ? (
                    <ChangeWrapper color={rateGoingUp ? theme.TYPE_GREEN : theme.TYPE_RED}>
                        <Icon
                            icon={rateGoingUp ? 'TREND_UP' : 'TREND_DOWN'}
                            size={16}
                            color={rateGoingUp ? theme.TYPE_GREEN : theme.TYPE_RED}
                        />
                        {localizeNumber(percentChange, locale, 1, 1)}%
                    </ChangeWrapper>
                ) : null}
            </TradeBoxHeadCard>
        </Wrapper>
    );
};
