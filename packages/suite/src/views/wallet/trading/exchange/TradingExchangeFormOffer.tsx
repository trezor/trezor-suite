import { memo, useCallback, useEffect } from 'react';

import { type CryptoId } from 'invity-api';

import {
    requiresTokenApproval,
    selectTradingComposedTransactionInfo,
    tradingExchangeActions,
} from '@suite-common/trading';
import { toTokenAddress } from '@suite-common/wallet-types';
import { isAmountTooHigh } from '@suite-common/wallet-utils';
import { Column } from '@trezor/components';

import { useDispatch, useSelector } from 'src/hooks/suite';
import { useTradingFormOfferBase } from 'src/hooks/wallet/trading/form/common/useTradingFormOfferBase';
import { useTradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';
import {
    getCryptoQuoteAmountProps,
    getSelectedCryptoId,
    getSelectedQuote,
} from 'src/utils/wallet/trading/tradingTypingUtils';
import {
    tradingGetAmountLabels,
    tradingGetSectionActionLabel,
} from 'src/utils/wallet/trading/tradingUtils';
import { TradingApproveModal } from 'src/views/wallet/trading/common/TradingForm/TradingApproveModal';
import { TradingFormApproval } from 'src/views/wallet/trading/common/TradingForm/TradingFormApproval';
import { TradingFormOfferAmountSection } from 'src/views/wallet/trading/common/TradingForm/TradingFormOfferAmountSection';
import { TradingFormOfferConfirmButton } from 'src/views/wallet/trading/common/TradingForm/TradingFormOfferConfirmButton';
import { TradingFormOfferContinueButton } from 'src/views/wallet/trading/common/TradingForm/TradingFormOfferContinueButton';
import { TradingFormOfferNoOffersCard } from 'src/views/wallet/trading/common/TradingForm/TradingFormOfferNoOffersCard';
import { TradingRevokeModal } from 'src/views/wallet/trading/common/TradingForm/TradingRevokeModal';

import { useReceiveAddressModalControls } from '../common/TradingSelectedOffer/TradingReceiveAddress/useReceiveAddressModalControls';
import { TradingUtilsTorWarning } from '../common/TradingUtils/TradingUtilsTorWarning';

const isFeeRequiredButMissing = (fee: string | undefined) => fee === undefined || fee === '';

export const TradingExchangeFormOffer = memo(() => {
    const dispatch = useDispatch();
    const { isTorEnabled, tradingDeviceDisconnected, areFeesLoading, isDiscoveryRunning } =
        useTradingFormOfferBase();
    const context = useTradingFormContext<'exchange'>();
    const {
        type,
        quotes,
        isAmountEmpty,
        getValues,
        preselectedQuote,
        shouldSendInSats,
        tradingReceiveAddress,
        isLoadingQuote,
        setIsLoadingQuote,
        confirmTrade,
        selectQuote,
        form: { state },
    } = context;

    const composedTransactionInfo = useSelector(selectTradingComposedTransactionInfo);
    const modalControls = useReceiveAddressModalControls();

    const isReceiveAddressSelected = !!tradingReceiveAddress?.receiveAddress;
    const quote = getSelectedQuote(context);
    const bestScoredQuote = quotes?.[0];
    const bestScoredQuoteAmounts = getCryptoQuoteAmountProps(quote, context);
    const { amountInCrypto, outputs } = getValues();
    const amountLabels = tradingGetAmountLabels({ type, amountInCrypto });
    const selectedCryptoId = getSelectedCryptoId(context);
    const receiveCurrency = bestScoredQuoteAmounts?.receiveCurrency;
    const selectedAssetCryptoId =
        !state.isLoadingOrInvalid && receiveCurrency
            ? receiveCurrency
            : (selectedCryptoId ?? undefined);

    const { amount, token } = outputs[0];
    const tokenAddress = token ? toTokenAddress(token) : null;
    const areSatsUsed = !!shouldSendInSats;
    const fee = composedTransactionInfo?.composed?.fee;
    const isFeeRequiredButMissingValue = isFeeRequiredButMissing(fee);

    const amountTooHigh = isAmountTooHigh({
        amount,
        contractAddress: tokenAddress,
        account: context.account,
        areSatsUsed,
    });

    const shouldShowApprovalStep = !!quote && requiresTokenApproval(quote);
    const isQuoteOutdated = quote?.send !== getValues('sendCryptoSelect')?.id;

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

    const noOffersWithTor = isTorEnabled && !quote && !isLoading;

    const isConfirmButtonLoading =
        areFeesLoading ||
        (!!preselectedQuote && state.isFormLoading) ||
        (state.isFormLoading && !isAmountEmpty && isReceiveAddressSelected);

    const confirmButtonTranslationId =
        state.isFormLoading && !isAmountEmpty && isReceiveAddressSelected
            ? 'TR_TRADING_OFFER_LOOKING'
            : tradingGetSectionActionLabel(type);

    useEffect(() => {
        let cancelled = false;
        const initConfirmTrade = async () => {
            if (shouldShowApprovalStep && tradingReceiveAddress?.receiveAddress) {
                dispatch(tradingExchangeActions.saveSelectedQuote(undefined));
                const { receiveAddress } = tradingReceiveAddress;
                setIsLoadingQuote(true);
                await confirmTrade({ trade: quote, receiveAddress });
                setIsLoadingQuote(false);
                if (!cancelled) {
                    setIsLoadingQuote(false);
                }
            }
        };

        initConfirmTrade();

        return () => {
            cancelled = true;
        };
    }, [
        quote,
        shouldShowApprovalStep,
        tradingReceiveAddress?.receiveAddress,
        dispatch,
        confirmTrade,
        tradingReceiveAddress,
        setIsLoadingQuote,
    ]);

    const onSelectQuote = useCallback(async () => {
        if (!quote || !tradingReceiveAddress?.receiveAddress) return;

        const { receiveAddress } = tradingReceiveAddress;
        const newTrade = await confirmTrade({ trade: quote, receiveAddress });
        if (!newTrade) return;
        selectQuote(newTrade);
    }, [quote, tradingReceiveAddress, confirmTrade, selectQuote]);

    const cryptoAmount =
        !state.isLoadingOrInvalid &&
        !isLoadingQuote &&
        bestScoredQuoteAmounts?.receiveAmount &&
        !isQuoteOutdated
            ? bestScoredQuoteAmounts.receiveAmount
            : '0';

    return (
        <Column gap={20}>
            <TradingFormOfferAmountSection
                offerLabel={amountLabels.offerLabel}
                selectedAssetCryptoId={selectedAssetCryptoId}
                cryptoAmount={cryptoAmount}
            />

            {!quote && !state.isFormLoading && !state.isFormInvalid && (
                <TradingFormOfferNoOffersCard isAmountEmpty={isAmountEmpty} />
            )}

            {noOffersWithTor && <TradingUtilsTorWarning tradingType={type} noOffer={!quote} />}

            {!isReceiveAddressSelected && quote ? (
                <TradingFormOfferContinueButton
                    onClick={() => modalControls.open('accountModal')}
                    isDisabled={isButtonDisabled || isLoading}
                    isLoading={!!preselectedQuote && state.isFormLoading}
                />
            ) : (
                <>
                    {shouldShowApprovalStep && !!bestScoredQuote && !isLoading ? (
                        <TradingFormApproval />
                    ) : (
                        <TradingFormOfferConfirmButton
                            type={type}
                            onClick={onSelectQuote}
                            isDisabled={isButtonDisabled || isLoading}
                            isLoading={isConfirmButtonLoading}
                            translationId={confirmButtonTranslationId}
                        />
                    )}
                </>
            )}

            {bestScoredQuoteAmounts?.sendCurrency && (
                <>
                    <TradingApproveModal
                        amount={amount}
                        cryptoId={bestScoredQuoteAmounts.sendCurrency as CryptoId}
                    />
                    <TradingRevokeModal
                        cryptoId={bestScoredQuoteAmounts.sendCurrency as CryptoId}
                    />
                </>
            )}
        </Column>
    );
});

TradingExchangeFormOffer.displayName = 'TradingExchangeFormOffer';
