import { useSelector } from 'react-redux';

import { events, injectDesktopAnalytics } from '@suite/analytics';
import { useDevice } from '@suite/device';
import { Translation } from '@suite/intl';
import {
    type TradingRootState,
    selectTradingComposedTransactionInfo,
    selectTradingProviderCompanyName,
    selectTradingSellActiveTrade,
    selectTradingSellFormStep,
    selectTradingSellInfo,
    selectTradingSellIsLoading,
    selectTradingSellQuotesRequest,
    selectTradingSellSelectedQuote,
    useTradingUtils,
} from '@suite-common/trading';
import { getDisplaySymbol } from '@suite-common/wallet-config';
import { selectHasRunningDiscovery } from '@suite-common/wallet-core';
import { Button, Card, Column, H2, Spinner, Text } from '@trezor/components';
import { useServices } from '@trezor/dependency-injection';
import { ArrowSquareOutIcon } from '@trezor/icons';
import { useAsyncClickHandler } from '@trezor/react-utils';

import { useTradingSellConfirmFees } from 'src/hooks/wallet/trading/useTradingSellConfirmFees';
import { useTradingSellTradeActions } from 'src/hooks/wallet/trading/useTradingSellTradeActions';
import { useTradingWatchTrade } from 'src/hooks/wallet/trading/useTradingWatchTrade';
import { type TradingGetCryptoQuoteAmountProps } from 'src/types/trading/trading';
import { type TradingOfferSellProps } from 'src/types/trading/tradingForm';
import { TradingFormOfferConfirmButton } from 'src/views/wallet/trading/common/TradingForm/TradingFormOffer/components/TradingFormOfferConfirmButton';
import { TradingKYCWarning } from 'src/views/wallet/trading/common/TradingKYCWarning';
import { TradingSelectedOfferInfo } from 'src/views/wallet/trading/common/TradingSelectedOffer/TradingSelectedOfferInfo';

import { TradingComposedNetworkFeeInfoItem } from '../TradingInfo/TradingComposedNetworkFeeInfoItem';
import { getTradingNetworkFeeEdit } from '../TradingInfo/getTradingNetworkFeeEdit';

const SELL_PROVIDER_CONFIRMATION_POLLING_INTERVAL_SECONDS = 10;

export const TradingOfferSell = ({ requestTrade, isRequestDisabled }: TradingOfferSellProps) => {
    const { analytics } = useServices(injectDesktopAnalytics);
    const { handleClick: handleRequestClick, disabled: isRequesting } = useAsyncClickHandler();
    const { handleClick: handleSendClick, disabled: isSending } = useAsyncClickHandler();
    const { cryptoIdToSymbolAndContractAddress } = useTradingUtils();
    const { device } = useDevice();
    const { account, sendTransaction } = useTradingSellTradeActions();
    const formStep = useSelector(selectTradingSellFormStep);
    const selectedQuote = useSelector(selectTradingSellSelectedQuote);
    const trade = useSelector(selectTradingSellActiveTrade);
    const sellInfo = useSelector(selectTradingSellInfo);
    const quotesRequest = useSelector(selectTradingSellQuotesRequest);
    const isLoading = useSelector(selectTradingSellIsLoading);
    const isDiscoveryRunning = useSelector(selectHasRunningDiscovery);
    const { composed } = useSelector(selectTradingComposedTransactionInfo);
    const { feeInfo, composeFormState, applySelectedFee, assumeNewAccount } =
        useTradingSellConfirmFees(account);

    useTradingWatchTrade({
        account,
        trade,
        refreshIntervalSeconds: SELL_PROVIDER_CONFIRMATION_POLLING_INTERVAL_SECONDS,
    });

    const selectedTrade = trade?.data ?? selectedQuote;
    const providerName = useSelector((state: TradingRootState) =>
        selectTradingProviderCompanyName(state, selectedTrade?.exchange, 'sell'),
    );

    if (!selectedTrade || !account) {
        return null;
    }

    const isSendStep = formStep === 'SEND_TRANSACTION';
    const isPartnerReadyToReceive =
        selectedTrade.status === 'SEND_CRYPTO' && !!selectedTrade.destinationAddress;

    const { coinSymbol, contractAddress } = cryptoIdToSymbolAndContractAddress(
        selectedTrade.cryptoCurrency,
    );
    const translationValues = {
        providerName: providerName ?? '',
        displaySymbol: coinSymbol ? getDisplaySymbol(coinSymbol, contractAddress) : '',
    };

    const quoteAmounts: TradingGetCryptoQuoteAmountProps = {
        amountInCrypto: quotesRequest?.amountInCrypto,
        sendAmount: selectedTrade.fiatStringAmount ?? '',
        sendCurrency: selectedTrade.fiatCurrency,
        receiveAmount: selectedTrade.cryptoStringAmount ?? '',
        receiveCurrency: selectedTrade.cryptoCurrency,
    };

    const networkFeeEdit = getTradingNetworkFeeEdit({
        account,
        feeInfo,
        composeFormState,
        assumeNewAccount,
        onConfirm: applySelectedFee,
        isTokenTransfer: !!composed?.token,
    });

    const onConfirmAndSendClick = async () => {
        const result = await sendTransaction();

        analytics.report({
            type: events.tradeSellEvent.name,
            payload: {
                action: result ? 'continue' : 'cancel',
                step: 'confirm-and-send-transaction',
            },
        });
    };

    const renderSendStepAction = () => {
        if (!isPartnerReadyToReceive) {
            return (
                <Column alignItems="center" gap={8} padding={{ vertical: 16 }}>
                    <Spinner size={40} isDisabled margin={{ bottom: 8 }} />
                    <Text>
                        <Translation
                            id="TR_SELL_DETAIL_WAITING_FOR_SEND_CRYPTO"
                            values={translationValues}
                        />
                    </Text>
                    <Text intent="neutral" priority="secondary">
                        <Translation
                            id="TR_SELL_DETAIL_WAITING_FOR_SEND_CRYPTO_INFO"
                            values={translationValues}
                        />
                    </Text>
                </Column>
            );
        }

        return (
            <Button
                data-testid="@trading/offer/confirm-on-trezor-and-send"
                isLoading={isLoading || isSending}
                isDisabled={isLoading || !device?.connected || isDiscoveryRunning || isSending}
                onClick={() => handleSendClick(onConfirmAndSendClick)}
                size="large"
                width="100%"
            >
                <Translation id="TR_SELL_CONFIRM_ON_TREZOR_SEND" />
            </Button>
        );
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
                        renderSendStepAction()
                    ) : (
                        <Column gap={12}>
                            <TradingFormOfferConfirmButton
                                translationId="TR_TRADING_SELL_VIA"
                                translationValues={translationValues}
                                iconRight={ArrowSquareOutIcon}
                                testId="@trading/offer/sell-button"
                                isDisabled={isRequestDisabled || isRequesting}
                                isLoading={isRequesting}
                                onClick={() => handleRequestClick(requestTrade)}
                            />

                            <TradingKYCWarning />
                        </Column>
                    )}
                </Column>
            </Card>
        </Column>
    );
};
