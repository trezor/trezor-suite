import React from 'react';
import { KYCInProgress, withCoinmarketSavingsLoaded } from '@wallet-components';
import styled from 'styled-components';
import { Icon } from '@trezor/components';
import { FormattedCryptoAmount, FormattedNumber, Translation } from '@suite-components';
import { PaymentDetail } from './components/PaymentDetail';
import { WithCoinmarketSavingsLoadedProps } from '@suite/components/wallet/hocs/withCoinmarketSavingsLoaded';
import {
    SavingsOverviewContext,
    useSavingsOverview,
} from '@wallet-hooks/coinmarket/savings/useSavingsOverview';
import { PaymentFrequency } from '@suite/services/suite/invityAPI';
import WaitingForFirstPayment from './components/WaitingForFirstPayment';
import { darken } from 'polished';

const Wrapper = styled.div`
    display: flex;
    flex-flow: column;
`;

const HeaderWrapper = styled.div`
    display: flex;
    flex-direction: row;
`;

const Left = styled.div`
    display: flex;
    width: calc(100% / 3);
`;

const Right = styled.div`
    display: flex;
    width: calc(100% / 3 * 2);
`;

const HeaderBlock = styled.div`
    display: flex;
    flex-direction: row;
    flex-wrap: nowrap;
    justify-content: space-between;
    align-items: stretch;
    align-content: stretch;
    height: 104px;
`;
const Setup = styled(HeaderBlock)`
    background-color: ${props => props.theme.BG_GREY};
    padding: 21px;
    border-radius: 8px;
    margin-right: 12px;
    width: 100%;
`;

const SetupValues = styled.div``;

const FiatPayment = styled.div`
    font-size: 30px;
    line-height: 34px;
`;

const Period = styled.div`
    font-size: 16px;
    line-height: 24px;
    color: ${props => props.theme.TYPE_LIGHT_GREY};
`;

const SoFarSaved = styled.div`
    display: flex;
    flex-direction: column;
    background-color: ${props => props.theme.BG_WHITE};
    padding: 21px;
`;

const Fiat = styled.div`
    font-size: 20px;
    line-height: 28px;
    color: ${props => props.theme.TYPE_GREEN};
    justify-content: end;
    display: flex;
`;

const Crypto = styled.div`
    font-size: 20px;
    line-height: 28px;
    color: ${props => props.theme.TYPE_LIGHT_GREY};
    justify-content: end;
    display: flex;
`;

const StyledIcon = styled(Icon)`
    cursor: pointer;
    & div {
        width: 26px;
        height: 26px;
        border-radius: 50%;
        background: ${props => darken(0.1)(props.theme.BG_GREY)};
    }
`;

type SavingsOverviewPeriodTranslationId =
    `TR_SAVINGS_OVERVIEW_PERIOD_${Uppercase<PaymentFrequency>}`;

const getPeriodTranslationId = (
    paymentFrequency: PaymentFrequency,
): SavingsOverviewPeriodTranslationId =>
    `TR_SAVINGS_OVERVIEW_PERIOD_${paymentFrequency.toUpperCase() as Uppercase<PaymentFrequency>}`;

function renderSavingsStatus(isWatchingKYCStatus: boolean, isWaitingForFirstPayment: boolean) {
    switch (true) {
        case isWatchingKYCStatus:
            return <KYCInProgress />;
        case isWaitingForFirstPayment:
            return <WaitingForFirstPayment />;
        default:
            return <>Graph</>;
    }
}

const Overview = (props: WithCoinmarketSavingsLoadedProps) => {
    const contextValues = useSavingsOverview(props);
    const { savingsTrade, savingsTradePayments, handleEditSetupButtonClick, isWatchingKYCStatus } =
        contextValues;
    const waitingForFirstPayment = true; // TODO: read the logic value based on savingsTransaction resp. TradeSavings...

    // NOTE: Planned payments are sorted in descending order by plannedPaymentAt.
    const followingPayment = savingsTradePayments[0];
    const nextPayment = savingsTradePayments[1];
    return (
        <SavingsOverviewContext.Provider value={contextValues}>
            <Wrapper>
                <HeaderWrapper>
                    <Left>
                        <Setup>
                            <SetupValues>
                                <FiatPayment>
                                    <FormattedNumber
                                        value={savingsTrade?.fiatStringAmount || 0}
                                        currency={savingsTrade?.fiatCurrency}
                                        maximumFractionDigits={2}
                                        minimumFractionDigits={0}
                                    />
                                </FiatPayment>
                                <Period>
                                    {savingsTrade?.paymentFrequency && (
                                        <Translation
                                            id={getPeriodTranslationId(
                                                savingsTrade.paymentFrequency,
                                            )}
                                        />
                                    )}
                                </Period>
                            </SetupValues>
                            <StyledIcon
                                icon="PENCIL"
                                size={13}
                                onClick={handleEditSetupButtonClick}
                            />
                        </Setup>
                        {!isWatchingKYCStatus && !waitingForFirstPayment && (
                            <SoFarSaved>
                                <Fiat>
                                    <FormattedNumber
                                        currency={savingsTrade?.fiatCurrency}
                                        value={0}
                                    />
                                </Fiat>
                                <Crypto>
                                    ≈&nbsp;
                                    <FormattedCryptoAmount
                                        value={0}
                                        symbol={savingsTrade?.cryptoCurrency}
                                    />
                                </Crypto>
                            </SoFarSaved>
                        )}
                    </Left>
                    <Right>
                        {renderSavingsStatus(isWatchingKYCStatus, waitingForFirstPayment)}
                    </Right>
                </HeaderWrapper>
                <PaymentDetail
                    isNextUp
                    title="TR_SAVINGS_OVERVIEW_PAYMENT_DETAIL_CURRENT_PAYMENT"
                    savingsTradePayment={nextPayment}
                />
                <PaymentDetail
                    title="TR_SAVINGS_OVERVIEW_PAYMENT_DETAIL_NEXT_PAYMENT"
                    savingsTradePayment={followingPayment}
                />
            </Wrapper>
        </SavingsOverviewContext.Provider>
    );
};
export default withCoinmarketSavingsLoaded(Overview, {
    title: 'TR_NAV_TRADE',
    redirectUnauthorizedUserToLogin: true,
});
