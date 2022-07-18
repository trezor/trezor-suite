import React from 'react';
import {
    KYCError,
    KYCFailed,
    KYCInProgress,
    withCoinmarket,
    WithCoinmarketProps,
} from '@wallet-components';
import styled from 'styled-components';
import { Icon } from '@trezor/components';
import { FormattedCryptoAmount, FormattedFiatAmount, Translation } from '@suite-components';
import { PaymentDetail } from './components/PaymentDetail';
import {
    SavingsOverviewContext,
    useSavingsOverview,
} from '@wallet-hooks/useCoinmarketSavingsOverview';
import type {
    PaymentFrequency,
    SavingsKYCStatus,
    SavingsTrade,
} from '@suite/services/suite/invityAPI';
import WaitingForFirstPayment from './components/WaitingForFirstPayment';
import { darken } from 'polished';
import { NetworkSymbol } from '@wallet-types';

const Wrapper = styled.div`
    display: flex;
    flex-flow: column;
`;

const HeaderWrapper = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: space-between;
`;

const Left = styled.div`
    display: flex;
    min-width: calc(100% / 3);
`;

const Right = styled.div`
    width: 100%;
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
    width: 100%;
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

function renderSavingsStatus(
    isWatchingKYCStatus: boolean,
    savingsTradeItemCompletedExists: boolean,
    savingsFiatSum: string,
    savingsCryptoSum: string,
    savingsTrade?: SavingsTrade,
    kycFinalStatus?: SavingsKYCStatus,
    selectedProviderCompanyName?: string,
) {
    switch (true) {
        case isWatchingKYCStatus:
            return <KYCInProgress />;
        case kycFinalStatus === 'Error':
            return <KYCError />;
        case kycFinalStatus === 'Failed':
            return <KYCFailed providerName={selectedProviderCompanyName} />;
        case !savingsTradeItemCompletedExists:
            return <WaitingForFirstPayment />;
        default:
            return (
                <SoFarSaved>
                    <Fiat>
                        ≈&nbsp;
                        <FormattedFiatAmount
                            currency={savingsTrade?.fiatCurrency}
                            value={savingsFiatSum}
                        />
                    </Fiat>
                    <Crypto>
                        <FormattedCryptoAmount
                            value={savingsCryptoSum}
                            symbol={savingsTrade?.cryptoCurrency as NetworkSymbol}
                        />
                    </Crypto>
                </SoFarSaved>
            );
    }
}

const Overview = (props: WithCoinmarketProps) => {
    const contextValues = useSavingsOverview(props);
    const {
        savingsTrade,
        savingsTradePayments,
        handleEditSetupButtonClick,
        isWatchingKYCStatus,
        isSavingsTradeLoading,
        savingsTradeItemCompletedExists,
        savingsCryptoSum,
        savingsFiatSum,
        kycFinalStatus,
        selectedProviderCompanyName,
    } = contextValues;

    if (isSavingsTradeLoading || !savingsTrade) {
        return <Translation id="TR_LOADING" />;
    }

    // NOTE: Planned payments are sorted in descending order by plannedPaymentAt.
    const followingPayment = savingsTradePayments?.[0];
    const nextPayment = savingsTradePayments?.[1];

    return (
        <SavingsOverviewContext.Provider value={contextValues}>
            <Wrapper>
                <HeaderWrapper>
                    <Left>
                        <Setup>
                            <SetupValues>
                                <FiatPayment>
                                    <FormattedFiatAmount
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
                    </Left>
                    <Right>
                        {renderSavingsStatus(
                            isWatchingKYCStatus,
                            savingsTradeItemCompletedExists,
                            savingsFiatSum,
                            savingsCryptoSum,
                            savingsTrade,
                            kycFinalStatus,
                            selectedProviderCompanyName,
                        )}
                    </Right>
                </HeaderWrapper>
                {nextPayment && (
                    <PaymentDetail
                        isNextUp
                        title="TR_SAVINGS_OVERVIEW_PAYMENT_DETAIL_CURRENT_PAYMENT"
                        savingsTradePayment={nextPayment}
                    />
                )}
                {followingPayment && (
                    <PaymentDetail
                        title="TR_SAVINGS_OVERVIEW_PAYMENT_DETAIL_NEXT_PAYMENT"
                        savingsTradePayment={followingPayment}
                    />
                )}
            </Wrapper>
        </SavingsOverviewContext.Provider>
    );
};
export default withCoinmarket(Overview, {
    title: 'TR_NAV_TRADE',
});
