import { useEffect, useState } from 'react';

import { BuyTrade, CryptoId, ExchangeTrade } from 'invity-api';

import { ExperimentId } from '@suite-common/message-system';
import {
    TRADING_EXCHANGE_FORM,
    TRADING_EXCHANGE_FORM_DEX,
    type TradingTradeType,
    type TradingType,
    isSendingEvmNativeToken,
    parseCryptoId,
    tradingExchangeActions,
    tradingSellActions,
    useTradingUtils,
} from '@suite-common/trading';
import { selectAreFeesLoading, selectHasRunningDiscovery } from '@suite-common/wallet-core';
import { TokenAddress } from '@suite-common/wallet-types';
import { isAmountTooHigh } from '@suite-common/wallet-utils';
import { Button, Card, Column, Paragraph } from '@trezor/components';
import { breakpoints, spacings } from '@trezor/theme';

import { ExperimentWrapper } from 'src/components/suite/Experiment/ExperimentWrapper';
import { Translation } from 'src/components/suite/Translation';
import { ApproveModal } from 'src/components/suite/modals/ReduxModal/UserContextModal/ApproveModal';
import { RevokeModal } from 'src/components/suite/modals/ReduxModal/UserContextModal/RevokeModal';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { useTradingDeviceDisconnected } from 'src/hooks/wallet/trading/form/common/useTradingDeviceDisconnected';
import { useTradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';
import { selectTorState } from 'src/selectors/suite/suiteSelectors';
import {
    TradingExchangeApprovalType,
    TradingFormContextValues,
} from 'src/types/trading/tradingForm';
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

import { useIsContentBelowBreakpoint } from '../../../../../support/suite/ContentFlex';
import { useReceiveAddressModalControls } from '../TradingSelectedOffer/TradingReceiveAddress/useReceiveAddressModalControls';
import { TradingUtilsTorWarning } from '../TradingUtils/TradingUtilsTorWarning';

export const getSelectedQuote = (
    context: TradingFormContextValues<TradingType>,
    bestScoredQuote: TradingTradeType | undefined,
) => {
    if (!isTradingExchangeContext(context)) {
        return bestScoredQuote;
    }

    const isDex = context.getValues(TRADING_EXCHANGE_FORM) === TRADING_EXCHANGE_FORM_DEX;

    const selectedQuote = isDex ? context.dexQuotes?.[0] : context.cexQuotes?.[0];

    return selectedQuote ?? bestScoredQuote;
};

export const TradingFormOffer = () => {
    const dispatch = useDispatch();
    const { isTorEnabled } = useSelector(selectTorState);

    const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
    const [isRevokeModalOpen, setIsRevokeModalOpen] = useState(false);
    const [isManuallyApproved, setIsManuallyApproved] = useState(false);

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

    const isLoadingQuote = isTradingExchangeContext(context) && context.isLoadingQuote;

    const { cryptoIdToPlatformName } = useTradingUtils();

    const bestScoredQuote = quotes?.[0];
    const { preselectedQuote } = context;
    const quote = preselectedQuote ?? getSelectedQuote(context, bestScoredQuote);
    const bestScoredQuoteAmounts = getCryptoQuoteAmountProps(quote, context);
    const areFeesLoading = useSelector(state => selectAreFeesLoading(state, account.symbol));
    const isDiscoveryRunning = useSelector(selectHasRunningDiscovery);

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
    const { networkId, contractAddress } = parseCryptoId(selectedCryptoId ?? ('' as CryptoId));
    const network = selectedCryptoId ? cryptoIdToPlatformName(networkId) : undefined;

    const { tradingDeviceDisconnected } = useTradingDeviceDisconnected();

    const [approvalType, setApprovalType] = useState<TradingExchangeApprovalType>('APPROVE');
    const [isWaitingForDevice, setIsWaitingForDevice] = useState(false);

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
        // confirm the quote once it loads
        const initConfirmTrade = async () => {
            if (
                isTradingExchangeContext(context) &&
                requiresTokenApproval &&
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
    }, [quote, requiresTokenApproval, tradingReceiveAddress?.receiveAddress]);

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
        if (isTradingExchangeContext(context)) {
            context.setIsApproval(true);
        }

        setIsApproveModalOpen(true);
    };

    const onCloseApproveModal = async (isSubmitting = false) => {
        setIsApproveModalOpen(false);

        if (isTradingExchangeContext(context)) {
            context.setIsApproval(false);

            if (isSubmitting) return;

            if (context.selectedQuote?.receiveAddress) {
                await context.confirmApproval({
                    trade: { ...context.selectedQuote, approvalType: undefined },
                    receiveAddress: context.selectedQuote.receiveAddress,
                });
            }
        }
    };

    const onOpenRevokeModal = () => {
        if (isTradingExchangeContext(context)) {
            context.setIsApproval(true);
        }

        setIsRevokeModalOpen(true);
    };

    const onCloseRevokeModal = async (isSubmitting = false) => {
        setIsRevokeModalOpen(false);

        if (isTradingExchangeContext(context)) {
            context.setIsApproval(false);

            if (isSubmitting) return;

            if (context.selectedQuote?.receiveAddress) {
                await context.confirmApproval({
                    trade: { ...context.selectedQuote, approvalType: undefined },
                    receiveAddress: context.selectedQuote?.receiveAddress,
                });
            }
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
        ? state.isFormLoading || isLoadingQuote || isQuoteOutdated
        : state.isFormLoading || isLoadingQuote;

    const selectedAssetCryptoId =
        !state.isLoadingOrInvalid && receiveCurrency
            ? receiveCurrency
            : (selectedCryptoId ?? undefined);

    const isReceiveAddressSelected =
        (isTradingExchangeContext(context) || isTradingBuyContext(context)) &&
        !!context.tradingReceiveAddress.receiveAddress;

    const isContentBelowBreakpoint = useIsContentBelowBreakpoint(breakpoints.tablet);

    const noOffersWithTor = isTorEnabled && !quote && !isLoading;

    return (
        <Column gap={spacings.lg}>
            <Column
                gap={spacings.xs}
                data-testid="@trading/best-offer"
                margin={{ bottom: spacings.md }}
            >
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
                {isTradingExchangeContext(context) && contractAddress && network && (
                    <ExperimentWrapper
                        id={ExperimentId.tradingFiatValues}
                        components={[
                            {
                                variant: 'A',
                                element: (
                                    <Paragraph typographyStyle="label" variant="tertiary">
                                        <Translation
                                            id="TR_TRADING_ON_NETWORK_CHAIN"
                                            values={{
                                                networkName: network,
                                            }}
                                        />
                                    </Paragraph>
                                ),
                            },
                            { variant: 'B', element: <></> },
                        ]}
                    />
                )}
            </Column>

            {!quote && !state.isFormLoading && !state.isFormInvalid && (
                <Card>
                    <Paragraph
                        typographyStyle="hint"
                        variant="tertiary"
                        align="center"
                        margin={{ vertical: spacings.xs }}
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

            {noOffersWithTor && (
                <TradingUtilsTorWarning tradingType={context.type} noOffer={!quote} />
            )}

            {!isTradingSellContext(context) && !isReceiveAddressSelected && quote ? (
                <Button
                    onClick={onContinueClick}
                    intent="brand"
                    margin={{
                        top: spacings.md,
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
                    {requiresTokenApproval && bestScoredQuote && !isLoading ? (
                        <TradingFormApproval
                            openApproveModal={onOpenApproveModal}
                            openRevokeModal={onOpenRevokeModal}
                            isWaitingForDevice={isWaitingForDevice}
                            approvalType={approvalType}
                            setApprovalType={setApprovalType}
                            isManuallyApproved={isManuallyApproved}
                            setIsManuallyApproved={setIsManuallyApproved}
                        />
                    ) : (
                        <Button
                            onClick={onSelectQuote}
                            intent="brand"
                            margin={{
                                top: spacings.md,
                            }}
                            size="large"
                            isDisabled={isButtonDisabled || isLoading}
                            isLoading={
                                areFeesLoading ||
                                (preselectedQuote && state.isFormLoading) ||
                                (state.isFormLoading &&
                                    !isAmountEmpty &&
                                    (type === 'sell' || isReceiveAddressSelected))
                            }
                            data-testid={`@trading/form/${type}-button`}
                            minWidth={160}
                            width={isContentBelowBreakpoint ? undefined : '100%'}
                        >
                            <Translation
                                id={
                                    state.isFormLoading &&
                                    !isAmountEmpty &&
                                    (type === 'sell' || isReceiveAddressSelected)
                                        ? 'TR_TRADING_OFFER_LOOKING'
                                        : tradingGetSectionActionLabel(type)
                                }
                            />
                        </Button>
                    )}
                </>
            )}
            {(type === 'buy' || type === 'sell') && <TradingFormOfferOTC />}
            {isApproveModalOpen && (
                <ApproveModal
                    onCancel={onCloseApproveModal}
                    setApprovalType={setApprovalType}
                    setIsWaitingForDevice={setIsWaitingForDevice}
                />
            )}
            {isRevokeModalOpen && (
                <RevokeModal
                    onCancel={onCloseRevokeModal}
                    setIsWaitingForDevice={setIsWaitingForDevice}
                />
            )}
        </Column>
    );
};
