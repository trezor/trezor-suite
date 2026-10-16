import { useSelector } from 'react-redux';

import { events, injectDesktopAnalytics } from '@suite/analytics';
import { useDevice } from '@suite/device';
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
    sellUtils,
    useTradingUtils,
} from '@suite-common/trading';
import { getDisplaySymbol } from '@suite-common/wallet-config';
import { selectHasRunningDiscovery } from '@suite-common/wallet-core';
import { Translation } from '@suite-lego/intl';
import { Card, Column, H2, Text } from '@trezor/components';
import { useServices } from '@trezor/dependency-injection';
import { ArrowSquareOutIcon } from '@trezor/icons';
import { useAsyncClickHandler } from '@trezor/react-utils';

import { useTradingSellBankAccountSelection } from 'src/hooks/wallet/trading/useTradingSellBankAccountSelection';
import { useTradingSellConfirmFees } from 'src/hooks/wallet/trading/useTradingSellConfirmFees';
import { useTradingSellTradeActions } from 'src/hooks/wallet/trading/useTradingSellTradeActions';
import { useTradingWatchTrade } from 'src/hooks/wallet/trading/useTradingWatchTrade';
import { type TradingGetCryptoQuoteAmountProps } from 'src/types/trading/trading';
import { type TradingOfferSellProps } from 'src/types/trading/tradingForm';
import { TradingFormOfferConfirmButton } from 'src/views/wallet/trading/common/TradingForm/TradingFormOffer/components/TradingFormOfferConfirmButton';
import { TradingKYCWarning } from 'src/views/wallet/trading/common/TradingKYCWarning';
import { TradingSelectedOfferInfo } from 'src/views/wallet/trading/common/TradingSelectedOffer/TradingSelectedOfferInfo';

import { TradingOfferSellSendButton } from './TradingOfferSellSendButton';
import { TradingOfferSellWaitingForProvider } from './TradingOfferSellWaitingForProvider';
import { TradingSellBankAccountInfoItem } from './TradingSellBankAccountInfoItem';
import { TradingComposedNetworkFeeInfoItem } from '../TradingInfo/TradingComposedNetworkFeeInfoItem';
import { getTradingNetworkFeeEdit } from '../TradingInfo/getTradingNetworkFeeEdit';

const SELL_PROVIDER_CONFIRMATION_POLLING_INTERVAL_SECONDS = 10;

export const TradingOfferSell = ({ requestTrade, isRequestDisabled }: TradingOfferSellProps) => {
    const { analytics } = useServices(injectDesktopAnalytics);
    const { handleClick: handleRequestClick, disabled: isRequesting } = useAsyncClickHandler();
    const { handleClick: handleSendClick, disabled: isSending } = useAsyncClickHandler();
    const { cryptoIdToSymbolAndContractAddress } = useTradingUtils();
    const { device } = useDevice();
    const { account, confirmTrade, addBankAccount, sendTransaction } = useTradingSellTradeActions();
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
    const { selectedBankAccount, selectBankAccount } = useTradingSellBankAccountSelection(
        selectedTrade?.bankAccounts,
        trade?.data.bankAccount,
    );

    if (!selectedTrade || !account) {
        return null;
    }

    const isPreviewStep = formStep === 'PREVIEW';
    const isBankAccountStep = formStep === 'BANK_ACCOUNT';
    const isSendStep = formStep === 'SEND_TRANSACTION';
    const isPartnerReadyToReceive = sellUtils.isReadyToSendCrypto(selectedTrade);
    const isSendDisabled = isLoading || !device?.connected || isDiscoveryRunning || isSending;

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

    const onConfirmBankAccountClick = async () => {
        if (!selectedBankAccount) {
            return;
        }

        const confirmedTrade = await confirmTrade(selectedBankAccount);

        if (confirmedTrade && sellUtils.isReadyToSendCrypto(confirmedTrade)) {
            await onConfirmAndSendClick();
        }
    };

    return (
        <Column width="100%" alignItems="center">
            <Card width="100%" maxWidth="440px" data-testid="@trading/selected-offer">
                <Column gap={20}>
                    <Column gap={4} alignItems="start">
                        <H2 typographyStyle="headline-sm">
                            <Translation
                                id={
                                    isPreviewStep
                                        ? 'TR_TRADING_SELL_CONFIRM_TITLE'
                                        : 'TR_TRADING_SELL_SEND_TITLE'
                                }
                                values={translationValues}
                            />
                        </H2>
                        <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                            <Translation
                                id={
                                    isPreviewStep
                                        ? 'TR_TRADING_SELL_CONFIRM_DESCRIPTION'
                                        : 'TR_TRADING_SELL_SEND_DESCRIPTION'
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
                        bankAccount={
                            selectedBankAccount && !isPreviewStep ? (
                                <TradingSellBankAccountInfoItem
                                    bankAccount={selectedBankAccount}
                                    edit={
                                        isBankAccountStep
                                            ? {
                                                  bankAccounts: selectedTrade.bankAccounts ?? [],
                                                  onSelect: selectBankAccount,
                                                  onAdd: addBankAccount,
                                              }
                                            : undefined
                                    }
                                />
                            ) : undefined
                        }
                    />

                    {isPreviewStep && (
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

                    {isBankAccountStep && (
                        <TradingOfferSellSendButton
                            isLoading={isLoading || isSending}
                            isDisabled={isSendDisabled || !selectedBankAccount}
                            onClick={() => handleSendClick(onConfirmBankAccountClick)}
                        />
                    )}

                    {isSendStep && !isPartnerReadyToReceive && (
                        <TradingOfferSellWaitingForProvider
                            providerName={translationValues.providerName}
                            displaySymbol={translationValues.displaySymbol}
                        />
                    )}

                    {isSendStep && isPartnerReadyToReceive && (
                        <TradingOfferSellSendButton
                            isLoading={isLoading || isSending}
                            isDisabled={isSendDisabled}
                            onClick={() => handleSendClick(onConfirmAndSendClick)}
                        />
                    )}
                </Column>
            </Card>
        </Column>
    );
};
