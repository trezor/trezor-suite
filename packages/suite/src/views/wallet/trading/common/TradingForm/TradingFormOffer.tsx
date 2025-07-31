import { useEffect, useState } from 'react';

import { CryptoId, ExchangeTrade } from 'invity-api';

import {
    TRADING_EXCHANGE_FORM,
    TRADING_EXCHANGE_FORM_DEX,
    type TradingTradeType,
    type TradingType,
    isSendingEvmNativeToken,
    parseCryptoId,
    tradingExchangeActions,
    tradingSellActions,
    useTradingInfo,
} from '@suite-common/trading';
import { selectAreFeesLoading, selectHasRunningDiscovery } from '@suite-common/wallet-core';
import { TokenAddress } from '@suite-common/wallet-types';
import { isAmountTooHigh } from '@suite-common/wallet-utils';
import { Button, Column, Paragraph, Row, TextButton, Tooltip } from '@trezor/components';
import { spacings } from '@trezor/theme';
import { BigNumber } from '@trezor/utils/src/bigNumber';

import { Translation } from 'src/components/suite';
import { ApproveModal } from 'src/components/suite/modals/ReduxModal/UserContextModal/ApproveModal';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { useTradingDeviceDisconnected } from 'src/hooks/wallet/trading/form/common/useTradingDeviceDisconnected';
import { useTradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';
import {
    TradingExchangeApprovalType,
    TradingFormContextValues,
} from 'src/types/trading/tradingForm';
import {
    getCryptoQuoteAmountProps,
    getProvidersInfoProps,
    getSelectQuoteTyped,
    getSelectedCrypto,
    isTradingExchangeContext,
    isTradingSellContext,
} from 'src/utils/wallet/trading/tradingTypingUtils';
import {
    tradingGetAmountLabels,
    tradingGetRoundedFiatAmount,
    tradingGetSectionActionLabel,
} from 'src/utils/wallet/trading/tradingUtils';
import { TradingCryptoAmount } from 'src/views/wallet/trading/common/TradingCryptoAmount';
import { TradingFormApproval } from 'src/views/wallet/trading/common/TradingForm/TradingFormApproval';
import { TradingFormOfferCryptoAmount } from 'src/views/wallet/trading/common/TradingForm/TradingFormOfferCryptoAmount';
import { TradingFormOfferFiatAmount } from 'src/views/wallet/trading/common/TradingForm/TradingFormOfferFiatAmount';
import { TradingFormOfferItem } from 'src/views/wallet/trading/common/TradingForm/TradingFormOfferItem';
import { TradingFormOfferOTC } from 'src/views/wallet/trading/common/TradingForm/TradingFormOfferOTC';
import { TradingFormOffersSwitcher } from 'src/views/wallet/trading/common/TradingForm/TradingFormOffersSwitcher';

const getSelectedQuote = (
    context: TradingFormContextValues<TradingType>,
    bestScoredQuote: TradingTradeType | undefined,
) => {
    if (isTradingExchangeContext(context)) {
        return context.getValues(TRADING_EXCHANGE_FORM) === TRADING_EXCHANGE_FORM_DEX
            ? context.dexQuotes?.[0]
            : context.cexQuotes?.[0];
    } else {
        return bestScoredQuote;
    }
};

export const TradingFormOffer = () => {
    const dispatch = useDispatch();

    const [isCompareLoading, setIsCompareLoading] = useState<boolean>(false);
    const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
    const [isManuallyApproved, setIsManuallyApproved] = useState(false);

    const context = useTradingFormContext();
    const {
        account,
        type,
        quotes,
        goToOffers,
        getValues,
        form: { state },
    } = context;

    const isFetchingApprovalStatus =
        isTradingExchangeContext(context) && context.isFetchingApprovalStatus;

    const { cryptoIdToPlatformName } = useTradingInfo();
    const providers = getProvidersInfoProps(context);
    const bestScoredQuote = quotes?.[0];
    const preselectedQuote = isTradingExchangeContext(context)
        ? context.preselectedQuote
        : undefined;
    const quote = preselectedQuote ?? getSelectedQuote(context, bestScoredQuote);
    const bestScoredQuoteAmounts = getCryptoQuoteAmountProps(quote, context);
    const areFeesLoading = useSelector(state => selectAreFeesLoading(state, account.symbol));
    const isDiscoveryRunning = useSelector(selectHasRunningDiscovery);

    const selectedCrypto = getSelectedCrypto(context);
    const receiveCurrency = bestScoredQuoteAmounts?.receiveCurrency;
    const { amountInCrypto } = getValues();
    const amountLabels = tradingGetAmountLabels({ type, amountInCrypto });
    const sendAmount =
        !state.isLoadingOrInvalid && bestScoredQuoteAmounts?.sendAmount
            ? bestScoredQuoteAmounts.sendAmount
            : '0';

    const selectQuote = getSelectQuoteTyped(context);
    const shouldDisplayFiatAmount = isTradingExchangeContext(context) ? false : amountInCrypto;
    const { networkId, contractAddress } = parseCryptoId(selectedCrypto?.value ?? ('' as CryptoId));
    const network = selectedCrypto?.value ? cryptoIdToPlatformName(networkId) : undefined;

    const { tradingDeviceDisconnected } = useTradingDeviceDisconnected();

    const showProviderAdjustedAmountTooltip =
        !state.isFormLoading &&
        isTradingSellContext(context) &&
        context.quotesRequest?.cryptoStringAmount &&
        bestScoredQuoteAmounts &&
        !new BigNumber(context.quotesRequest.cryptoStringAmount).isEqualTo(
            new BigNumber(bestScoredQuoteAmounts.receiveAmount),
        );

    const [approvalType, setApprovalType] = useState<TradingExchangeApprovalType>('APPROVE');

    const requiresTokenApproval =
        isTradingExchangeContext(context) &&
        quote &&
        (quote as ExchangeTrade)?.isDex &&
        context.getValues().sendCryptoSelect &&
        account.networkType === 'ethereum' &&
        !isSendingEvmNativeToken(context.getValues().sendCryptoSelect?.value);

    const isQuoteOutdated =
        isTradingExchangeContext(context) &&
        (quote as ExchangeTrade)?.send !== context.getValues().sendCryptoSelect?.value;

    useEffect(() => {
        if (isTradingExchangeContext(context) && requiresTokenApproval) {
            const { fetchApprovalStatus } = context;
            const trade = quote as ExchangeTrade | undefined;
            fetchApprovalStatus(trade);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [quote, requiresTokenApproval]);

    const onSelectQuote = () => {
        if (!quote) {
            return;
        }

        if (isTradingSellContext(context)) {
            const provider = quote.exchange
                ? context.sellInfo?.providerInfos[quote.exchange]
                : undefined;

            if (provider?.flow === 'BANK_ACCOUNT') {
                dispatch(tradingSellActions.setFormStep('BANK_ACCOUNT'));
            } else {
                dispatch(tradingSellActions.setFormStep('SEND_TRANSACTION'));
            }
        }

        if (isTradingExchangeContext(context)) {
            const trade = quote as ExchangeTrade;
            dispatch(tradingExchangeActions.saveSelectedQuote(trade));
            dispatch(tradingExchangeActions.setFormStep('RECEIVING_ADDRESS'));
        }

        selectQuote(quote);
    };

    const onCompareAllOffersClick = async () => {
        setIsCompareLoading(true);
        await goToOffers();
    };

    let amount: string = '0';
    let tokenAddress: TokenAddress | undefined;
    let areSatsUsed = false;

    if (isTradingSellContext(context) || isTradingExchangeContext(context)) {
        const { shouldSendInSats, getValues } = context;
        const { outputs } = getValues();

        const output = outputs[0];
        amount = output.amount;
        tokenAddress = (output.token ?? undefined) as TokenAddress | undefined;
        areSatsUsed = !!shouldSendInSats;
    }

    const onOpenApproveModal = () => {
        setIsApproveModalOpen(true);

        if (isTradingExchangeContext(context)) {
            context.setIsApproval(true);
        }
    };

    const onCloseApproveModal = () => {
        setIsApproveModalOpen(false);

        if (isTradingExchangeContext(context)) {
            context.setIsApproval(false);
        }
    };

    const amountTooHigh = isAmountTooHigh({
        amount,
        contractAddress: tokenAddress,
        account,
        areSatsUsed,
    });

    const isButtonDisabled =
        isDiscoveryRunning ||
        tradingDeviceDisconnected ||
        state.isLoadingOrInvalid ||
        !quote ||
        amountTooHigh;

    const isLoading = requiresTokenApproval
        ? state.isFormLoading || isFetchingApprovalStatus || isQuoteOutdated
        : state.isFormLoading;

    const selectedAssetCryptoId =
        !state.isLoadingOrInvalid && receiveCurrency
            ? receiveCurrency
            : (selectedCrypto?.value as CryptoId);

    return (
        <Column gap={spacings.lg}>
            <Column gap={spacings.xs} data-testid="@trading/best-offer">
                {selectedAssetCryptoId && <Translation id={amountLabels.offerLabel} />}
                {shouldDisplayFiatAmount ? (
                    <TradingFormOfferFiatAmount amount={tradingGetRoundedFiatAmount(sendAmount)} />
                ) : (
                    <TradingFormOfferCryptoAmount
                        amount={
                            !state.isLoadingOrInvalid &&
                            !isFetchingApprovalStatus &&
                            bestScoredQuoteAmounts?.receiveAmount &&
                            !isQuoteOutdated
                                ? bestScoredQuoteAmounts.receiveAmount
                                : '0'
                        }
                        cryptoId={selectedAssetCryptoId}
                    />
                )}
                {isTradingExchangeContext(context) && contractAddress && network && (
                    <Paragraph typographyStyle="label" variant="tertiary">
                        <Translation
                            id="TR_TRADING_ON_NETWORK_CHAIN"
                            values={{
                                networkName: network,
                            }}
                        />
                    </Paragraph>
                )}
            </Column>
            <Column gap={spacings.xxs} margin={{ vertical: spacings.md }}>
                <Row justifyContent="space-between">
                    {showProviderAdjustedAmountTooltip ? (
                        <Tooltip
                            hasIcon
                            placement="right"
                            content={
                                <Translation
                                    id="TR_SELL_PROVIDER_ADJUSTED_AMOUNT"
                                    values={{
                                        roundedAmountWithSymbol: (
                                            <TradingCryptoAmount
                                                amount={bestScoredQuoteAmounts.receiveAmount}
                                                cryptoId={
                                                    bestScoredQuoteAmounts.receiveCurrency as CryptoId
                                                }
                                            />
                                        ),
                                    }}
                                />
                            }
                        >
                            <Translation
                                id={
                                    preselectedQuote
                                        ? 'TR_TRADING_YOUR_SELECTED_OFFER'
                                        : 'TR_TRADING_YOUR_BEST_OFFER'
                                }
                            />
                        </Tooltip>
                    ) : (
                        <Translation
                            id={
                                preselectedQuote
                                    ? 'TR_TRADING_YOUR_SELECTED_OFFER'
                                    : 'TR_TRADING_YOUR_BEST_OFFER'
                            }
                        />
                    )}
                    <TextButton
                        onClick={onCompareAllOffersClick}
                        size="small"
                        isDisabled={state.isLoadingOrInvalid || isLoading || isQuoteOutdated}
                        isLoading={isCompareLoading}
                        data-testid="@trading/form/compare-button"
                        type="button"
                    >
                        <Translation id="TR_TRADING_COMPARE_OFFERS" />
                    </TextButton>
                </Row>
                {isTradingExchangeContext(context) ? (
                    <TradingFormOffersSwitcher
                        context={context}
                        isFormLoading={isLoading && !preselectedQuote}
                        isFormInvalid={state.isFormInvalid && !preselectedQuote}
                        providers={providers}
                    />
                ) : (
                    <TradingFormOfferItem
                        bestQuote={quote}
                        isFormLoading={state.isFormLoading}
                        isFormInvalid={state.isFormInvalid}
                        providers={providers}
                    />
                )}
            </Column>

            {requiresTokenApproval && bestScoredQuote && !isLoading ? (
                <TradingFormApproval
                    openApproveModal={onOpenApproveModal}
                    approvalType={approvalType}
                    setApprovalType={setApprovalType}
                    isManuallyApproved={isManuallyApproved}
                    setIsManuallyApproved={setIsManuallyApproved}
                />
            ) : (
                <Button
                    onClick={onSelectQuote}
                    variant="primary"
                    margin={{
                        top: spacings.md,
                    }}
                    isFullWidth
                    isDisabled={isButtonDisabled || isLoading}
                    isLoading={areFeesLoading || (preselectedQuote && state.isFormLoading)}
                    data-testid={`@trading/form/${type}-button`}
                >
                    <Translation id={tradingGetSectionActionLabel(type)} />
                </Button>
            )}

            {(type === 'buy' || type === 'sell') && <TradingFormOfferOTC />}

            {isApproveModalOpen && (
                <ApproveModal onCancel={onCloseApproveModal} setApprovalType={setApprovalType} />
            )}
        </Column>
    );
};
