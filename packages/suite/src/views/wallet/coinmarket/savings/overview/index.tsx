import styled from 'styled-components';
import { darken } from 'polished';

import { KycError, KycFailed, KycInProgress } from 'src/views/wallet/coinmarket/common';
import { Icon, variables } from '@trezor/components';
import {
    FiatValue,
    FormattedCryptoAmount,
    HiddenPlaceholder,
    Translation,
} from 'src/components/suite';
import { PaymentDetail } from './components/PaymentDetail';
import {
    SavingsOverviewContext,
    useSavingsOverview,
} from 'src/hooks/wallet/useCoinmarketSavingsOverview';
import type { PaymentFrequency, SavingsKYCStatus, SavingsTrade } from 'invity-api';
import { WaitingForFirstPayment } from './components/WaitingForFirstPayment';
import type { Account, NetworkSymbol } from 'src/types/wallet';
import { AllFeesIncluded } from '../AllFeesIncluded';
import { ProvidedBy } from '../ProvidedBy';
import { CoinmarketReauthorizationCard } from '../CoinmarketReauthorizationCard';
import { withCoinmarket, WithCoinmarketProps } from '../withCoinmarket';

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
    flex-flow: row nowrap;
    place-content: stretch space-between;
    align-items: stretch;
    height: 120px;
`;
const Setup = styled(HeaderBlock)`
    background-color: ${({ theme }) => theme.BG_GREY};
    padding: 21px;
    border-radius: 8px;
    margin-right: 12px;
    width: 100%;
`;

const SetupValues = styled.div``;

const StyledFiatValue = styled(FiatValue)`
    font-size: 30px;
    line-height: 34px;
`;

const Period = styled.div`
    font-size: 16px;
    line-height: 24px;
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
`;

const SoFarSaved = styled.div`
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    background-color: ${({ theme }) => theme.BG_WHITE};
    padding: 21px 0 0 21px;
    width: 100%;
`;

const Crypto = styled.div`
    font-size: 20px;
    line-height: 28px;
    color: ${({ theme }) => theme.TYPE_GREEN};
    display: flex;
`;

const Fiat = styled(HiddenPlaceholder)`
    font-size: 20px;
    line-height: 28px;
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    display: flex;
`;

const Disclaimer = styled.div`
    max-width: 300px;
    margin-top: 10px;
    font-size: ${variables.FONT_SIZE.SMALL};
    text-align: right;
`;

const StyledIcon = styled(Icon)`
    cursor: pointer;

    & div {
        width: 26px;
        height: 26px;
        border-radius: 50%;
        background: ${({ theme }) => darken(0.1)(theme.BG_GREY)};
    }
`;

const Footer = styled.div`
    text-align: right;
    margin-top: 20px;
`;

type SavingsOverviewPeriodTranslationId =
    `TR_SAVINGS_OVERVIEW_PERIOD_${Uppercase<PaymentFrequency>}`;

const getPeriodTranslationId = (
    paymentFrequency: PaymentFrequency,
): SavingsOverviewPeriodTranslationId =>
    `TR_SAVINGS_OVERVIEW_PERIOD_${paymentFrequency.toUpperCase() as Uppercase<PaymentFrequency>}`;

function renderSavingsStatus(
    isWatchingKYCStatus: boolean,
    symbol: Account['symbol'],
    savingsTradeItemCompletedExists: boolean,
    savingsFiatSum: string,
    savingsCryptoSum: string,
    coinTransferDelayed: boolean,
    savingsTrade: SavingsTrade,
    kycFinalStatus?: SavingsKYCStatus,
    selectedProviderCompanyName?: string,
) {
    switch (true) {
        case isWatchingKYCStatus:
            return <KycInProgress />;
        case kycFinalStatus === 'Error':
            return <KycError />;
        case kycFinalStatus === 'Failed':
            return <KycFailed providerName={selectedProviderCompanyName} />;
        case !savingsTradeItemCompletedExists:
            return (
                <WaitingForFirstPayment
                    paymentMethod={savingsTrade.paymentMethod}
                    providerName={selectedProviderCompanyName}
                />
            );
        default:
            return (
                <SoFarSaved>
                    <Crypto>
                        <FormattedCryptoAmount
                            value={savingsCryptoSum}
                            symbol={savingsTrade.cryptoCurrency as NetworkSymbol}
                        />
                    </Crypto>
                    <Fiat>
                        ≈&nbsp;
                        <FiatValue
                            shouldConvert={false}
                            fiatCurrency={savingsTrade.fiatCurrency?.toLowerCase()}
                            amount={savingsFiatSum}
                            symbol={symbol}
                        />
                    </Fiat>
                    {coinTransferDelayed && (
                        <Disclaimer>
                            <Translation
                                id="TR_SAVINGS_OVERVIEW_COIN_TRANSFER_DELAYED"
                                values={{ providerName: selectedProviderCompanyName }}
                            />
                        </Disclaimer>
                    )}
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
        selectedProvider,
        account,
    } = contextValues;

    const reauthorizationUrl = savingsTrade?.reauthorizationUrl;

    if (isSavingsTradeLoading || !savingsTrade) {
        return <Translation id="TR_LOADING" />;
    }
    const { symbol } = account;
    // NOTE: Planned payments are sorted in descending order by plannedPaymentAt.
    const followingPayment = savingsTradePayments?.[0];
    const nextPayment = savingsTradePayments?.[1];

    return (
        <SavingsOverviewContext.Provider value={contextValues}>
            <Wrapper>
                {reauthorizationUrl && (
                    <CoinmarketReauthorizationCard reauthorizationUrl={reauthorizationUrl} />
                )}
                <HeaderWrapper>
                    <Left>
                        <Setup>
                            <SetupValues>
                                <StyledFiatValue
                                    shouldConvert={false}
                                    amount={savingsTrade.fiatStringAmount || '0'}
                                    symbol={symbol}
                                    fiatCurrency={savingsTrade.fiatCurrency}
                                    fiatAmountFormatterOptions={{
                                        maximumFractionDigits: 2,
                                        minimumFractionDigits: 0,
                                    }}
                                />
                                <Period>
                                    {savingsTrade.paymentFrequency && (
                                        <Translation
                                            id={getPeriodTranslationId(
                                                savingsTrade.paymentFrequency,
                                            )}
                                        />
                                    )}
                                </Period>
                                <AllFeesIncluded />
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
                            symbol,
                            savingsTradeItemCompletedExists,
                            savingsFiatSum,
                            savingsCryptoSum,
                            !!selectedProvider?.flow.paymentInfo.coinTransferDelayed,
                            savingsTrade,
                            kycFinalStatus,
                            selectedProvider?.companyName,
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
                <Footer>
                    <ProvidedBy providerName={selectedProvider?.companyName} />
                </Footer>
            </Wrapper>
        </SavingsOverviewContext.Provider>
    );
};
export default withCoinmarket(Overview, {
    title: 'TR_NAV_TRADE',
});
