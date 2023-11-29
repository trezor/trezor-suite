import { selectFiatRatesByFiatRateKey } from '@suite-common/wallet-core';
import { getFiatRateKey, localizeNumber } from '@suite-common/wallet-utils';
import { Icon, variables } from '@trezor/components';
import { spacingsPx, typography } from '@trezor/theme';
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

const CardContainer = styled.div`
    display: flex;
    flex-direction: column;
    gap: ${spacingsPx.xxxs};
`;

const Name = styled.div`
    color: ${({ theme }) => theme.textSubdued};
    ${typography.label}
    margin-bottom: 3px;
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
    <CardContainer>
        <Name>{name}</Name>
        <div>{children}</div>
    </CardContainer>
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
                    <ChangeWrapper
                        color={rateGoingUp ? theme.textPrimaryDefault : theme.textAlertRed}
                    >
                        <Icon
                            icon={rateGoingUp ? 'TREND_UP' : 'TREND_DOWN'}
                            size={16}
                            color={rateGoingUp ? theme.iconPrimaryDefault : theme.iconAlertRed}
                        />
                        {localizeNumber(percentChange, locale, 1, 1)}%
                    </ChangeWrapper>
                ) : null}
            </TradeBoxHeadCard>
        </Wrapper>
    );
};
