import { useEffect, useMemo } from 'react';

import type { BuyTrade, CryptoId, ExchangeTrade, SellFiatTrade } from 'invity-api';

import { Translation } from '@suite/intl';
import {
    TRADING_EXCHANGE_FORM_DEX,
    type TradingType,
    isCountrySubdivisionEmpty,
    requiresTokenApproval,
    selectTradingComposedTransactionInfo,
    tradingExchangeActions,
    tradingSellActions,
} from '@suite-common/trading';
import { selectAreFeesLoading, selectHasRunningDiscovery } from '@suite-common/wallet-core';
import { type TokenAddress } from '@suite-common/wallet-types';
import { isAmountTooHigh } from '@suite-common/wallet-utils';
import { Button, Card, Column, Paragraph } from '@trezor/components';
import { breakpoints } from '@trezor/theme';

import { StellarManageTokenModal } from 'src/components/suite/modals/ReduxModal/UserContextModal/StellarManageTokenModal';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { useTradingDeviceDisconnected } from 'src/hooks/wallet/trading/form/common/useTradingDeviceDisconnected';
import { useTradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';
import { useTradingStellarActivateToken } from 'src/hooks/wallet/trading/useTradingStellarActivateToken';
import { selectTorState } from 'src/selectors/suite/suiteSelectors';
import { useIsContentBelowBreakpoint } from 'src/support/suite/ContentFlex';
import { type TradingFormContextValues } from 'src/types/trading/tradingForm';
import {
    getCryptoQuoteAmountProps,
    getSelectQuoteTyped,
    getSelectedCryptoId,
    isTradingBuyContext,
    isTradingExchangeContext,
    isTradingSellContext,
} from 'src/utils/wallet/trading/tradingTypingUtils';
import {
    tradingGetAmountLabels,
    tradingGetRoundedFiatAmount,
    tradingGetSectionActionLabel,
} from 'src/utils/wallet/trading/tradingUtils';
import { TradingFormApproval } from 'src/views/wallet/trading/common/TradingForm/TradingFormApproval';
import { TradingFormOfferCryptoAmount } from 'src/views/wallet/trading/common/TradingForm/TradingFormOfferCryptoAmount';
import { TradingFormOfferFiatAmount } from 'src/views/wallet/trading/common/TradingForm/TradingFormOfferFiatAmount';
import { TradingFormOfferOTC } from 'src/views/wallet/trading/common/TradingForm/TradingFormOfferOTC';

import { TradingApproveModal } from './TradingApproveModal';
import { TradingRevokeModal } from './TradingRevokeModal';
import { useReceiveAddressModalControls } from '../TradingSelectedOffer/TradingReceiveAddress/useReceiveAddressModalControls';
import { TradingUtilsTorWarning } from '../TradingUtils/TradingUtilsTorWarning';

const isFeeRequiredButMissing = (fee: string | undefined, type: TradingType) =>
    (type === 'sell' || type === 'exchange') && (fee === undefined || fee === '');

const getQuotesFilteredByPaymentMethod = (
    quotes: BuyTrade[] | SellFiatTrade[],
    paymentMethod: string | undefined,
) =>
    quotes?.filter(quote =>
        paymentMethod ? (quote as BuyTrade | SellFiatTrade).paymentMethod === paymentMethod : true,
    ) ?? ([] as BuyTrade[] | SellFiatTrade[]);

const getQuotesFilteredByProviderAndPaymentMethod = (
    quotes: BuyTrade[] | SellFiatTrade[],
    provider: string | undefined,
    paymentMethod: string | undefined,
) =>
    getQuotesFilteredByPaymentMethod(quotes, paymentMethod).filter(quote =>
        provider ? (quote as BuyTrade | SellFiatTrade).exchange === provider : true,
    );

export const getSelectedQuote = (context: TradingFormContextValues<TradingType>) => {
    const { provider } = context.getValues();

    if (!isTradingExchangeContext(context)) {
        const { provider, paymentMethod } = context.getValues();

        return getQuotesFilteredByProviderAndPaymentMethod(
            context.quotes,
            provider,
            paymentMethod?.value,
        )?.[0];
    }

    const { exchangeType } = context.getValues();
    const isDex = exchangeType === TRADING_EXCHANGE_FORM_DEX;

    const quotes = isDex ? context.dexQuotes : context.cexQuotes;
    const selectedQuote =
        quotes?.find(quote => !provider || quote.exchange === provider) ?? quotes?.[0];

    return selectedQuote;
};

export const TradingFormOffer = () => {
    const dispatch = useDispatch();
    const { isTorEnabled } = useSelector(selectTorState);

    const context = useTradingFormContext();
    const {
        account,
        type,
        quotes,
        isAmountEmpty,
        getValues,
        form: { state },
    } = context;

    const modalControls = useReceiveAddressModalControls();

    const tradingReceiveAddress =
        isTradingExchangeContext(context) || isTradingBuyContext(context)
            ? context.tradingReceiveAddress
            : undefined;

    const isReceiveAddressSelected = !!tradingReceiveAddress?.receiveAddress;

    const isLoadingQuote = isTradingExchangeContext(context) && context.isLoadingQuote;

    const bestScoredQuote = quotes?.[0];
    const { preselectedQuote } = context;
    const quote = preselectedQuote ?? getSelectedQuote(context);
    const bestScoredQuoteAmounts = getCryptoQuoteAmountProps(quote, context);
    const areFeesLoading = useSelector(state => selectAreFeesLoading(state, account.symbol));
    const composedTransactionInfo = useSelector(selectTradingComposedTransactionInfo);
    const isDiscoveryRunning = useSelector(selectHasRunningDiscovery);

    const fee = composedTransactionInfo?.composed?.fee;
    const isFeeRequiredButMissingValue = isFeeRequiredButMissing(fee, type);

    const selectedCryptoId = getSelectedCryptoId(context);
    const receiveCurrency = bestScoredQuoteAmounts?.receiveCurrency;
    const { amountInCrypto } = getValues();
    const amountLabels = tradingGetAmountLabels({ type, amountInCrypto });
    const sendAmount =
        !state.isLoadingOrInvalid && bestScoredQuoteAmounts?.sendAmount
            ? bestScoredQuoteAmounts.sendAmount
            : '0';

    const selectQuote = getSelectQuoteTyped(context);
    const shouldDisplayFiatAmount = isTradingExchangeContext(context) ? false : amountInCrypto;

    const { tradingDeviceDisconnected } = useTradingDeviceDisconnected();

    const shouldShowApprovalStep =
        isTradingExchangeContext(context) && quote && requiresTokenApproval(quote as ExchangeTrade);

    const isQuoteOutdated =
        isTradingExchangeContext(context) &&
        (quote as ExchangeTrade)?.send !== context.getValues('sendCryptoSelect')?.id;

    const isSubdivisionMissing = useMemo(() => {
        if (isTradingSellContext(context) || isTradingBuyContext(context)) {
            const { countrySelect, countrySubdivisionSelect } = context.getValues();

            return isCountrySubdivisionEmpty(countrySelect?.value, countrySubdivisionSelect?.value);
        }

        return false;
    }, [context]);

    useEffect(() => {
        // confirm the quote once it loads
        const initConfirmTrade = async () => {
            if (
                isTradingExchangeContext(context) &&
                shouldShowApprovalStep &&
                tradingReceiveAddress?.receiveAddress
            ) {
                dispatch(tradingExchangeActions.saveSelectedQuote(undefined));
                const { receiveAddress } = tradingReceiveAddress;
                const trade = quote as ExchangeTrade | undefined;

                context.setIsLoadingQuote(true);
                await context.confirmTrade({ trade, receiveAddress });
                context.setIsLoadingQuote(false);
            }
        };

        initConfirmTrade();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [quote, shouldShowApprovalStep, tradingReceiveAddress?.receiveAddress]);

    const onSelectQuote = async () => {
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

        if (isTradingExchangeContext(context) && tradingReceiveAddress?.receiveAddress) {
            const trade = quote as ExchangeTrade;
            const { receiveAddress } = tradingReceiveAddress;
            const newTrade = await context.confirmTrade({ trade, receiveAddress });
            if (!newTrade) return;
            context.selectQuote(newTrade);

            return;
        }

        if (isTradingBuyContext(context)) {
            const trade = quote as BuyTrade;
            context.selectQuote(trade);

            return;
        }

        selectQuote(quote);
    };

    const onContinueClick = () => {
        modalControls.open('accountModal');
    };

    let amount: string = '0';
    let tokenAddress: TokenAddress | null = null;
    let areSatsUsed = false;

    if (isTradingSellContext(context) || isTradingExchangeContext(context)) {
        const { shouldSendInSats, getValues } = context;
        const { outputs } = getValues();

        const output = outputs[0];
        amount = output.amount;
        tokenAddress = output.token as TokenAddress | null;
        areSatsUsed = !!shouldSendInSats;
    }

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
        amountTooHigh ||
        areFeesLoading ||
        isFeeRequiredButMissingValue;

    const isLoading = shouldShowApprovalStep
        ? state.isFormLoading || isLoadingQuote || isQuoteOutdated
        : state.isFormLoading || isLoadingQuote;

    const selectedAssetCryptoId =
        !state.isLoadingOrInvalid && receiveCurrency
            ? receiveCurrency
            : (selectedCryptoId ?? undefined);

    const { inactiveToken: stellarInactiveToken, modal: stellarActivateTokenModal } =
        useTradingStellarActivateToken({
            account: tradingReceiveAddress?.selectedAccount ?? undefined,
            receiveCryptoId: selectedAssetCryptoId,
        });

    const isStellarActivateTokenModalOpen =
        stellarActivateTokenModal.isOpen && !!stellarInactiveToken;

    const isContentBelowBreakpoint = useIsContentBelowBreakpoint(breakpoints.tablet);

    const noOffersWithTor = isTorEnabled && !quote && !isLoading;

    const isConfirmButtonLoading =
        areFeesLoading ||
        (preselectedQuote && state.isFormLoading) ||
        (state.isFormLoading && !isAmountEmpty && (type === 'sell' || isReceiveAddressSelected));

    const confirmButtonTranslationId =
        state.isFormLoading && !isAmountEmpty && (type === 'sell' || isReceiveAddressSelected)
            ? 'TR_TRADING_OFFER_LOOKING'
            : tradingGetSectionActionLabel(type);

    return (
        <Column gap={20}>
            <Column gap={8} data-testid="@trading/best-offer" margin={{ bottom: 16 }}>
                {selectedAssetCryptoId && <Translation id={amountLabels.offerLabel} />}
                {shouldDisplayFiatAmount ? (
                    <TradingFormOfferFiatAmount amount={tradingGetRoundedFiatAmount(sendAmount)} />
                ) : (
                    <TradingFormOfferCryptoAmount
                        amount={
                            !state.isLoadingOrInvalid &&
                            !isLoadingQuote &&
                            bestScoredQuoteAmounts?.receiveAmount &&
                            !isQuoteOutdated
                                ? bestScoredQuoteAmounts.receiveAmount
                                : '0'
                        }
                        cryptoId={selectedAssetCryptoId}
                    />
                )}
            </Column>

            {!isSubdivisionMissing && !quote && !state.isFormLoading && !state.isFormInvalid && (
                <Card>
                    <Paragraph
                        typographyStyle="body-sm"
                        intent="neutral"
                        priority="secondary"
                        align="center"
                        margin={{ vertical: 8 }}
                        data-testid="trading-offer-found-none"
                    >
                        <Translation
                            id={
                                isAmountEmpty
                                    ? 'TR_BUY_SELL_OFFERS_EMPTY'
                                    : 'TR_TRADING_NO_OFFER_BUY_OR_SELL'
                            }
                        />
                    </Paragraph>
                </Card>
            )}

            {isSubdivisionMissing && (
                <Card>
                    <Paragraph
                        typographyStyle="body-sm"
                        intent="neutral"
                        priority="secondary"
                        align="center"
                        margin={{ vertical: 8 }}
                        data-testid="trading-offer-subdivision-required"
                    >
                        <Translation id="TR_TRADING_SUBDIVISION_REQUIRED_FOR_OFFERS" />
                    </Paragraph>
                </Card>
            )}

            {noOffersWithTor && (
                <TradingUtilsTorWarning tradingType={context.type} noOffer={!quote} />
            )}

            {!isTradingSellContext(context) && !isReceiveAddressSelected && quote ? (
                <Button
                    onClick={onContinueClick}
                    intent="brand"
                    margin={{
                        top: 16,
                    }}
                    isDisabled={isButtonDisabled || isLoading}
                    isLoading={areFeesLoading || (preselectedQuote && state.isFormLoading)}
                    size="large"
                    minWidth={160}
                    width="100%"
                >
                    <Translation id="TR_CONTINUE" />
                </Button>
            ) : (
                <>
                    {isTradingExchangeContext(context) &&
                    shouldShowApprovalStep &&
                    bestScoredQuote &&
                    !isLoading ? (
                        <TradingFormApproval />
                    ) : (
                        <>
                            {stellarInactiveToken ? (
                                <Button
                                    intent="brand"
                                    margin={{
                                        top: 16,
                                    }}
                                    size="large"
                                    minWidth={160}
                                    width={isContentBelowBreakpoint ? undefined : '100%'}
                                    onClick={stellarActivateTokenModal.onOpen}
                                    isDisabled={!tradingReceiveAddress?.selectedAccount?.symbol}
                                >
                                    <Translation
                                        id="TR_ACTIVATE_TOKEN"
                                        values={{ token: stellarInactiveToken.symbol }}
                                    />
                                </Button>
                            ) : (
                                <Button
                                    onClick={onSelectQuote}
                                    intent="brand"
                                    margin={{
                                        top: 16,
                                    }}
                                    size="large"
                                    isDisabled={isButtonDisabled || isLoading}
                                    isLoading={isConfirmButtonLoading}
                                    data-testid={`@trading/form/${type}-button`}
                                    minWidth={160}
                                    width={isContentBelowBreakpoint ? undefined : '100%'}
                                >
                                    <Translation id={confirmButtonTranslationId} />
                                </Button>
                            )}
                        </>
                    )}
                </>
            )}

            {(type === 'buy' || type === 'sell') && <TradingFormOfferOTC />}

            {isTradingExchangeContext(context) && bestScoredQuoteAmounts?.sendCurrency && (
                <TradingApproveModal
                    amount={amount}
                    cryptoId={bestScoredQuoteAmounts.sendCurrency as CryptoId}
                />
            )}

            {isTradingExchangeContext(context) && bestScoredQuoteAmounts?.sendCurrency && (
                <TradingRevokeModal cryptoId={bestScoredQuoteAmounts.sendCurrency as CryptoId} />
            )}

            {isStellarActivateTokenModalOpen && !!tradingReceiveAddress?.selectedAccount && (
                <StellarManageTokenModal
                    mode="activate"
                    account={tradingReceiveAddress.selectedAccount}
                    symbol={tradingReceiveAddress.selectedAccount.symbol}
                    contractAddress={stellarInactiveToken.contract}
                    onCancel={stellarActivateTokenModal.onClose}
                />
            )}
        </Column>
    );
};
