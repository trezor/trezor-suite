import React from 'react';
import { withCoinmarketSavingsLoaded } from '@wallet-components';
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

const SavingsOverviewHeader = styled.div`
    display: flex;
    flex-direction: row;
    flex-wrap: nowrap;
    justify-content: space-between;
    align-items: stretch;
    align-content: stretch;
    margin-bottom: 42px;
`;

const HeaderBlock = styled.div`
    display: flex;
    flex-direction: row;
    flex-wrap: nowrap;
    justify-content: space-between;
    align-items: stretch;
    align-content: stretch;
`;
const Setup = styled(HeaderBlock)`
    width: calc(100% / 3);
    background-color: ${props => props.theme.BG_GREY};
    padding: 21px;
    border-radius: 8px;
    margin-right: 12px;
`;

const WaitingForFirstPaymentWrapper = styled(HeaderBlock)`
    display: flex;
    width: calc(100% / 3 * 2);
    & > div {
        width: 100%;
    }
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
    width: calc(100% / 3);
    background-color: ${props => props.theme.BG_WHITE};
    padding: 21px;
`;

const Graph = styled.div`
    display: flex;
    width: calc(100% / 3);
    background-color: ${props => props.theme.BG_WHITE};
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

const CurrentPayment = styled.div`
    margin-bottom: 13px;
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

const Overview = (props: WithCoinmarketSavingsLoadedProps) => {
    const contextValues = useSavingsOverview(props);
    const { savingsTrade, savingsTradePayments, handleEditSetupButtonClick } = contextValues;
    const waitingForFirstPayment = true; // TODO: read the logic value based on savingsTransaction resp. TradeSavings...

    // NOTE: Planned payments are sorted in descending order by plannedPaymentAt.
    const followingPayment = savingsTradePayments[0];
    const nextPayment = savingsTradePayments[1];

    return (
        <SavingsOverviewContext.Provider value={contextValues}>
            <Wrapper>
                <SavingsOverviewHeader>
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
                                        id={getPeriodTranslationId(savingsTrade.paymentFrequency)}
                                    />
                                )}
                            </Period>
                        </SetupValues>
                        <StyledIcon icon="PENCIL" size={13} onClick={handleEditSetupButtonClick} />
                    </Setup>
                    {waitingForFirstPayment ? (
                        <WaitingForFirstPaymentWrapper>
                            <WaitingForFirstPayment />
                        </WaitingForFirstPaymentWrapper>
                    ) : (
                        <>
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
                            <Graph>Graph</Graph>
                        </>
                    )}
                </SavingsOverviewHeader>
                <CurrentPayment>
                    <PaymentDetail
                        isNextUp
                        title="TR_SAVINGS_OVERVIEW_PAYMENT_DETAIL_CURRENT_PAYMENT"
                        savingsTradePayment={nextPayment}
                    />
                </CurrentPayment>
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
