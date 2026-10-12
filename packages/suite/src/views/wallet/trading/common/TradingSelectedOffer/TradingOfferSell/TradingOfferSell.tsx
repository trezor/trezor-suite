import { useSelector } from 'react-redux';

import { Translation } from '@suite/intl';
import {
    type TradingFormAccountRootState,
    type TradingRootState,
    selectTradingComposedTransactionInfo,
    selectTradingProviderCompanyName,
    selectTradingSellActiveTrade,
    selectTradingSellFormStep,
    selectTradingSellInfo,
    selectTradingSellQuotesRequest,
    selectTradingSellSelectedQuote,
    selectTradingSendAccount,
    useTradingUtils,
} from '@suite-common/trading';
import { getDisplaySymbol } from '@suite-common/wallet-config';
import { Button, Card, Column, H2, Text } from '@trezor/components';
import { ArrowSquareOutIcon } from '@trezor/icons';
import { useAsyncClickHandler } from '@trezor/react-utils';

import { useTradingSellConfirmFees } from 'src/hooks/wallet/trading/useTradingSellConfirmFees';
import { type TradingGetCryptoQuoteAmountProps } from 'src/types/trading/trading';
import { type TradingOfferSellProps } from 'src/types/trading/tradingForm';
import { TradingFormOfferConfirmButton } from 'src/views/wallet/trading/common/TradingForm/TradingFormOffer/components/TradingFormOfferConfirmButton';
import { TradingKYCWarning } from 'src/views/wallet/trading/common/TradingKYCWarning';
import { TradingSelectedOfferInfo } from 'src/views/wallet/trading/common/TradingSelectedOffer/TradingSelectedOfferInfo';

import { TradingComposedNetworkFeeInfoItem } from '../TradingInfo/TradingComposedNetworkFeeInfoItem';
import { getTradingNetworkFeeEdit } from '../TradingInfo/getTradingNetworkFeeEdit';

export const TradingOfferSell = ({ requestTrade, isRequestDisabled }: TradingOfferSellProps) => {
    const { handleClick, disabled } = useAsyncClickHandler();
    const { cryptoIdToSymbolAndContractAddress } = useTradingUtils();
    const formStep = useSelector(selectTradingSellFormStep);
    const selectedQuote = useSelector(selectTradingSellSelectedQuote);
    const trade = useSelector(selectTradingSellActiveTrade);
    const sellInfo = useSelector(selectTradingSellInfo);
    const quotesRequest = useSelector(selectTradingSellQuotesRequest);
    const account = useSelector((state: TradingFormAccountRootState) =>
        selectTradingSendAccount(state, 'sell'),
    );

    const { composed } = useSelector(selectTradingComposedTransactionInfo);
    const { feeInfo, composeFormState, applySelectedFee, assumeNewAccount } =
        useTradingSellConfirmFees(account);

    const selectedTrade = trade?.data ?? selectedQuote;
    const providerName = useSelector((state: TradingRootState) =>
        selectTradingProviderCompanyName(state, selectedTrade?.exchange, 'sell'),
    );

    if (!selectedTrade || !account) {
        return null;
    }

    const isSendStep = formStep === 'SEND_TRANSACTION';

    const { coinSymbol, contractAddress } = cryptoIdToSymbolAndContractAddress(
        selectedTrade.cryptoCurrency,
    );
    const translationValues = {
        providerName: providerName ?? '',
        displaySymbol: coinSymbol ? getDisplaySymbol(coinSymbol, contractAddress) : '',
    };

    const networkFeeEdit = getTradingNetworkFeeEdit({
        account,
        feeInfo,
        composeFormState,
        assumeNewAccount,
        onConfirm: applySelectedFee,
        isTokenTransfer: !!composed?.token,
    });

    const quoteAmounts: TradingGetCryptoQuoteAmountProps = {
        amountInCrypto: quotesRequest?.amountInCrypto,
        sendAmount: selectedTrade.fiatStringAmount ?? '',
        sendCurrency: selectedTrade.fiatCurrency,
        receiveAmount: selectedTrade.cryptoStringAmount ?? '',
        receiveCurrency: selectedTrade.cryptoCurrency,
    };

    return (
        <Column width="100%" alignItems="center">
            <Card width="100%" maxWidth="440px" data-testid="@trading/selected-offer">
                <Column gap={20}>
                    <Column gap={4} alignItems="start">
                        <H2 typographyStyle="headline-sm">
                            <Translation
                                id={
                                    isSendStep
                                        ? 'TR_TRADING_SELL_SEND_TITLE'
                                        : 'TR_TRADING_SELL_CONFIRM_TITLE'
                                }
                                values={translationValues}
                            />
                        </H2>
                        <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                            <Translation
                                id={
                                    isSendStep
                                        ? 'TR_TRADING_SELL_SEND_DESCRIPTION'
                                        : 'TR_TRADING_SELL_CONFIRM_DESCRIPTION'
                                }
                                values={translationValues}
                            />
                        </Text>
                    </Column>

                    <TradingSelectedOfferInfo
                        type="sell"
                        selectedQuote={selectedTrade}
                        providers={sellInfo?.providerInfos}
                        quoteAmounts={quoteAmounts}
                        paymentMethod={selectedTrade.paymentMethod}
                        paymentMethodName={selectedTrade.paymentMethodName}
                        selectedAccount={account}
                        networkFee={
                            <TradingComposedNetworkFeeInfoItem
                                account={account}
                                fee={composed?.fee}
                                edit={networkFeeEdit}
                            />
                        }
                    />

                    {isSendStep ? (
                        <Button
                            data-testid="@trading/offer/confirm-on-trezor-and-send"
                            isDisabled
                            size="large"
                            width="100%"
                        >
                            <Translation id="TR_SELL_CONFIRM_ON_TREZOR_SEND" />
                        </Button>
                    ) : (
                        <Column gap={12}>
                            <TradingFormOfferConfirmButton
                                translationId="TR_TRADING_SELL_VIA"
                                translationValues={translationValues}
                                iconRight={ArrowSquareOutIcon}
                                testId="@trading/offer/sell-button"
                                isDisabled={isRequestDisabled || disabled}
                                isLoading={disabled}
                                onClick={() => handleClick(requestTrade)}
                            />

                            <TradingKYCWarning />
                        </Column>
                    )}
                </Column>
            </Card>
        </Column>
    );
};
