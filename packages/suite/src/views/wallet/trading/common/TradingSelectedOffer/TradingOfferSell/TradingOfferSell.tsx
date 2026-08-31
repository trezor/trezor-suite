import { Fragment, type JSX } from 'react';

import styled from 'styled-components';

import { useDevice } from '@suite/device';
import { useSelector } from '@suite-common/redux-utils';
import {
    selectTradingComposedTransactionInfo,
    selectTradingSellActiveTrade,
    selectTradingSellFormStep,
    selectTradingSellInfo,
    selectTradingSellQuotesRequest,
    selectTradingSellSelectedQuote,
} from '@suite-common/trading';
import { selectAccounts } from '@suite-common/wallet-core';
import { Card, Column, Divider } from '@trezor/components';

import { type TradingGetCryptoQuoteAmountProps } from 'src/types/trading/trading';
import { ConnectDeviceGenericPromo } from 'src/views/wallet/receive/components/ConnectDevicePromo';
import { TradingOfferSellBankAccount } from 'src/views/wallet/trading/common/TradingSelectedOffer/TradingOfferSell/TradingOfferSellBankAccount';
import { TradingSelectedOfferSellTransaction } from 'src/views/wallet/trading/common/TradingSelectedOffer/TradingOfferSell/TradingOfferSellTransaction';
import { TradingSelectedOfferInfo } from 'src/views/wallet/trading/common/TradingSelectedOffer/TradingSelectedOfferInfo';
import {
    TradingSelectedOfferStepper,
    type TradingSelectedOfferStepperItemProps,
} from 'src/views/wallet/trading/common/TradingSelectedOffer/TradingSelectedOfferStepper';
import { TradingWrapper } from 'src/views/wallet/trading/common/TradingWrapper';

const Wrapper = styled.div`
    ${TradingWrapper}
`;

export const TradingOfferSell = () => {
    const accounts = useSelector(selectAccounts);
    const formStep = useSelector(selectTradingSellFormStep);
    const selectedQuote = useSelector(selectTradingSellSelectedQuote);
    const sellInfo = useSelector(selectTradingSellInfo);
    const quotesRequest = useSelector(selectTradingSellQuotesRequest);
    const { composed } = useSelector(selectTradingComposedTransactionInfo);
    const trade = useSelector(selectTradingSellActiveTrade);
    const { device } = useDevice();

    const sendAccount = accounts.find(account => account.key === trade?.sendAccountKey);
    const selectedTrade = trade?.data ?? selectedQuote;
    const isDeviceDisconnected = !device?.connected;

    if (!selectedTrade) return null;

    const quoteAmounts: TradingGetCryptoQuoteAmountProps = {
        amountInCrypto: quotesRequest?.amountInCrypto,
        sendAmount: selectedTrade.fiatStringAmount ?? '',
        sendCurrency: selectedTrade.fiatCurrency,
        receiveAmount: selectedTrade.cryptoStringAmount ?? '',
        receiveCurrency: selectedTrade.cryptoCurrency,
        networkFee: composed?.fee,
    };

    const steps: (TradingSelectedOfferStepperItemProps & {
        component: JSX.Element | null;
    })[] = [
        {
            step: 'BANK_ACCOUNT',
            translationId: 'TR_SELL_BANK_ACCOUNT_STEP',
            isActive: formStep === 'BANK_ACCOUNT',
            component: <TradingOfferSellBankAccount />,
        },
        {
            step: 'SEND_TRANSACTION',
            translationId: 'TR_SELL_CONFIRM_SEND_STEP',
            isActive: formStep === 'SEND_TRANSACTION',
            component: <TradingSelectedOfferSellTransaction />,
        },
    ];

    return (
        <Column gap={16}>
            {isDeviceDisconnected && <ConnectDeviceGenericPromo />}

            <Wrapper data-testid="@trading/selected-offer">
                <Card>
                    <TradingSelectedOfferStepper steps={steps} />
                    <Divider margin={{ top: 20, bottom: 24 }} />
                    {steps.map((step, index) => (
                        <Fragment key={index}>{step.isActive && step.component}</Fragment>
                    ))}
                </Card>
                <Card>
                    <TradingSelectedOfferInfo
                        type="sell"
                        selectedQuote={selectedTrade}
                        providers={sellInfo?.providerInfos}
                        quoteAmounts={quoteAmounts}
                        paymentMethod={selectedTrade.paymentMethod}
                        paymentMethodName={selectedTrade.paymentMethodName}
                        selectedAccount={sendAccount}
                    />
                </Card>
            </Wrapper>
        </Column>
    );
};
