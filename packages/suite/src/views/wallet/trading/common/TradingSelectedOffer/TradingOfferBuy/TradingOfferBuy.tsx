import { Translation } from '@suite/intl';
import {
    selectTradingBuyInfo,
    selectTradingBuyReceiveAccountKey,
    selectTradingBuyReceiveAddress,
    selectTradingProviderCompanyName,
} from '@suite-common/trading';
import { selectAccountByKey } from '@suite-common/wallet-core';
import { Card, Column, H2, Text } from '@trezor/components';
import { ArrowSquareOutIcon } from '@trezor/icons';
import { useAsyncClickHandler } from '@trezor/react-utils';

import { useSelector } from 'src/hooks/suite';
import { type TradingGetCryptoQuoteAmountProps } from 'src/types/trading/trading';
import { type TradingOfferBuyProps } from 'src/types/trading/tradingForm';
import { TradingFormOfferConfirmButton } from 'src/views/wallet/trading/common/TradingForm/TradingFormOffer/components/TradingFormOfferConfirmButton';
import { TradingKYCWarning } from 'src/views/wallet/trading/common/TradingKYCWarning';
import { TradingSelectedOfferInfo } from 'src/views/wallet/trading/common/TradingSelectedOffer/TradingSelectedOfferInfo';

export const TradingOfferBuy = ({
    selectedQuote,
    isConfirmDisabled,
    confirmTrade,
}: TradingOfferBuyProps) => {
    const { handleClick, disabled } = useAsyncClickHandler();

    const buyInfo = useSelector(selectTradingBuyInfo);
    const receiveAddress = useSelector(selectTradingBuyReceiveAddress);
    const receiveAccountKey = useSelector(selectTradingBuyReceiveAccountKey);
    const receiveAccount = useSelector(
        state => selectAccountByKey(state, receiveAccountKey) ?? undefined,
    );
    const providerName = useSelector(state =>
        selectTradingProviderCompanyName(state, selectedQuote.exchange, 'buy'),
    );

    const quoteAmounts: TradingGetCryptoQuoteAmountProps = {
        amountInCrypto: selectedQuote?.wantCrypto,
        sendAmount: selectedQuote.fiatStringAmount ?? '',
        sendCurrency: selectedQuote.fiatCurrency,
        receiveAmount: selectedQuote.receiveStringAmount ?? '',
        receiveCurrency: selectedQuote.receiveCurrency,
    };

    return (
        <Column width="100%" alignItems="center">
            <Card maxWidth="440px" data-testid="@trading/selected-offer">
                <Column gap={12}>
                    <Column margin={{ bottom: 16 }}>
                        <H2 typographyStyle="headline-sm">
                            <Translation
                                id="TR_TRADING_BUY_CONFIRM_TITLE"
                                values={{ providerName: providerName ?? '' }}
                            />
                        </H2>
                        <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                            <Translation id="TR_TRADING_BUY_CONFIRM_DESCRIPTION" />
                        </Text>
                    </Column>

                    <TradingSelectedOfferInfo
                        type="buy"
                        selectedQuote={selectedQuote}
                        providers={buyInfo?.providerInfos}
                        quoteAmounts={quoteAmounts}
                        paymentMethod={selectedQuote.paymentMethod}
                        paymentMethodName={selectedQuote.paymentMethodName}
                        selectedAccount={receiveAccount}
                        receiveAddress={receiveAddress}
                    />
                    <Column gap={12}>
                        <TradingFormOfferConfirmButton
                            translationId="TR_TRADING_BUY_VIA"
                            translationValues={{ providerName: providerName ?? '' }}
                            iconRight={ArrowSquareOutIcon}
                            testId="@trading/offer/buy-button"
                            isDisabled={isConfirmDisabled || disabled}
                            isLoading={disabled}
                            onClick={() => handleClick(confirmTrade)}
                        />

                        <TradingKYCWarning />
                    </Column>
                </Column>
            </Card>
        </Column>
    );
};
