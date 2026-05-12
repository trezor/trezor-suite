import { useMemo } from 'react';

import {
    isCountrySubdivisionEmpty,
    selectTradingComposedTransactionInfo,
    tradingSellActions,
} from '@suite-common/trading';
import { type TokenAddress } from '@suite-common/wallet-types';
import { isAmountTooHigh } from '@suite-common/wallet-utils';
import { Column } from '@trezor/components';

import { useDispatch, useSelector } from 'src/hooks/suite';
import { useTradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';
import { TradingUtilsTorWarning } from 'src/views/wallet/trading/common/TradingUtils/TradingUtilsTorWarning';

import { TradingFormOfferAmount } from '../common/TradingForm/TradingFormOffer/components/TradingFormOfferAmount/TradingFormOfferAmount';
import { TradingFormOfferConfirmButton } from '../common/TradingForm/TradingFormOffer/components/TradingFormOfferConfirmButton';
import { TradingFormOfferOTC } from '../common/TradingForm/TradingFormOffer/components/TradingFormOfferOTC';
import { TradingFormOfferWarnings } from '../common/TradingForm/TradingFormOffer/components/TradingFormOffersWarnings';
import { useTradingFormOfferCommon } from '../common/TradingForm/TradingFormOffer/hooks/useTradingFormOfferCommon';

export const TradingFormSellOffer = () => {
    const dispatch = useDispatch();
    const context = useTradingFormContext<'sell'>();
    const {
        account,
        watch,
        shouldSendInSats,
        sellInfo,
        selectQuote,
        form: { state },
    } = context;

    const composedTransactionInfo = useSelector(selectTradingComposedTransactionInfo);

    const { outputs } = watch();
    const { amount, token } = outputs[0];
    const tokenAddress = token as TokenAddress | null;
    const areSatsUsed = !!shouldSendInSats;

    const fee = composedTransactionInfo?.composed?.fee;
    const isFeeRequiredButMissingValue = fee === undefined || fee === '';

    const isSubdivisionMissing = useMemo(() => {
        const { countrySelect, countrySubdivisionSelect } = watch();

        return isCountrySubdivisionEmpty(countrySelect?.value, countrySubdivisionSelect?.value);
    }, [watch]);

    const amountTooHigh = isAmountTooHigh({
        amount,
        contractAddress: tokenAddress,
        account,
        areSatsUsed,
    });

    const {
        quote,
        quoteAmounts,
        noOffersWithTor,
        isConfirmButtonLoading,
        confirmButtonTranslationId,
        sendAmount,
        selectedAssetCryptoId,
        amountLabels,
        isBaseButtonDisabled,
    } = useTradingFormOfferCommon<'sell'>();

    const isButtonDisabled =
        isBaseButtonDisabled ||
        amountTooHigh ||
        isFeeRequiredButMissingValue ||
        state.isFormLoading;

    const onSelectQuote = () => {
        if (!quote) return;

        const provider = quote.exchange ? sellInfo?.providerInfos[quote.exchange] : undefined;

        if (provider?.flow === 'BANK_ACCOUNT') {
            dispatch(tradingSellActions.setFormStep('BANK_ACCOUNT'));
        } else {
            dispatch(tradingSellActions.setFormStep('SEND_TRANSACTION'));
        }

        selectQuote(quote);
    };

    return (
        <Column gap={20}>
            <TradingFormOfferAmount
                amount={quoteAmounts?.receiveAmount ?? '0'}
                sendAmount={sendAmount}
                selectedAssetCryptoId={selectedAssetCryptoId}
                shouldDisplayFiatAmount={!!watch().amountInCrypto}
                amountLabels={amountLabels}
            />

            <TradingFormOfferWarnings
                isSubdivisionMissing={isSubdivisionMissing}
                hasQuote={!!quote}
            />

            {noOffersWithTor && <TradingUtilsTorWarning tradingType="sell" noOffer={!quote} />}

            <TradingFormOfferConfirmButton
                onClick={onSelectQuote}
                isDisabled={isButtonDisabled}
                isLoading={isConfirmButtonLoading}
                translationId={confirmButtonTranslationId}
                testId="@trading/form/sell-button"
            />

            <TradingFormOfferOTC />
        </Column>
    );
};
