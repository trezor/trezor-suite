import { memo, useCallback } from 'react';

import {
    isCountrySubdivisionEmpty,
    selectTradingComposedTransactionInfo,
    tradingSellActions,
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
import { TradingFormOfferAmountSection } from 'src/views/wallet/trading/common/TradingForm/TradingFormOfferAmountSection';
import { TradingFormOfferConfirmButton } from 'src/views/wallet/trading/common/TradingForm/TradingFormOfferConfirmButton';
import { TradingFormOfferNoOffersCard } from 'src/views/wallet/trading/common/TradingForm/TradingFormOfferNoOffersCard';
import { TradingFormOfferOTC } from 'src/views/wallet/trading/common/TradingForm/TradingFormOfferOTC';
import { TradingFormOfferSubdivisionCard } from 'src/views/wallet/trading/common/TradingForm/TradingFormOfferSubdivisionCard';

import { TradingUtilsTorWarning } from '../common/TradingUtils/TradingUtilsTorWarning';

const isFeeRequiredButMissing = (fee: string | undefined) => fee === undefined || fee === '';

export const TradingSellFormOffer = memo(() => {
    const dispatch = useDispatch();
    const { isTorEnabled, tradingDeviceDisconnected, areFeesLoading, isDiscoveryRunning } =
        useTradingFormOfferBase();
    const context = useTradingFormContext<'sell'>();
    const {
        type,
        isAmountEmpty,
        getValues,
        preselectedQuote,
        shouldSendInSats,
        sellInfo,
        form: { state },
        watch,
    } = context;

    const composedTransactionInfo = useSelector(selectTradingComposedTransactionInfo);

    const quote = getSelectedQuote(context);
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

    const countrySelect = watch('countrySelect');
    const countrySubdivisionSelect = watch('countrySubdivisionSelect');
    const isSubdivisionMissing = isCountrySubdivisionEmpty(
        countrySelect?.value,
        countrySubdivisionSelect?.value,
    );

    const isButtonDisabled =
        isDiscoveryRunning ||
        tradingDeviceDisconnected ||
        state.isLoadingOrInvalid ||
        !quote ||
        amountTooHigh ||
        areFeesLoading ||
        isFeeRequiredButMissingValue;

    const isLoading = state.isFormLoading;
    const noOffersWithTor = isTorEnabled && !quote && !isLoading;

    const isConfirmButtonLoading =
        areFeesLoading ||
        (!!preselectedQuote && state.isFormLoading) ||
        (state.isFormLoading && !isAmountEmpty);

    const confirmButtonTranslationId =
        state.isFormLoading && !isAmountEmpty
            ? 'TR_TRADING_OFFER_LOOKING'
            : tradingGetSectionActionLabel(type);

    const onSelectQuote = useCallback(() => {
        if (!quote) return;

        const { exchange } = quote;
        const provider = exchange ? sellInfo?.providerInfos[exchange] : undefined;

        if (provider?.flow === 'BANK_ACCOUNT') {
            dispatch(tradingSellActions.setFormStep('BANK_ACCOUNT'));
        } else {
            dispatch(tradingSellActions.setFormStep('SEND_TRANSACTION'));
        }
    }, [dispatch, quote, sellInfo]);

    const sendAmount =
        !state.isLoadingOrInvalid && bestScoredQuoteAmounts?.sendAmount
            ? bestScoredQuoteAmounts.sendAmount
            : '0';

    const cryptoAmount =
        !state.isLoadingOrInvalid && bestScoredQuoteAmounts?.receiveAmount
            ? bestScoredQuoteAmounts.receiveAmount
            : '0';

    return (
        <Column gap={20}>
            <TradingFormOfferAmountSection
                offerLabel={amountLabels.offerLabel}
                selectedAssetCryptoId={selectedAssetCryptoId}
                cryptoAmount={cryptoAmount}
                amountInCrypto={amountInCrypto}
                fiatSendAmount={sendAmount}
            />

            {!isSubdivisionMissing && !quote && !state.isFormLoading && !state.isFormInvalid && (
                <TradingFormOfferNoOffersCard isAmountEmpty={isAmountEmpty} />
            )}

            {isSubdivisionMissing && <TradingFormOfferSubdivisionCard />}

            {noOffersWithTor && <TradingUtilsTorWarning tradingType={type} noOffer={!quote} />}

            <TradingFormOfferConfirmButton
                type={type}
                onClick={onSelectQuote}
                isDisabled={isButtonDisabled || isLoading}
                isLoading={isConfirmButtonLoading}
                translationId={confirmButtonTranslationId}
            />

            <TradingFormOfferOTC />
        </Column>
    );
});

TradingSellFormOffer.displayName = 'TradingSellFormOffer';
