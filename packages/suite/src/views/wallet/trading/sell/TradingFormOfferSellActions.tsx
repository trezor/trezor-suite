import { selectTradingComposedTransactionInfo, tradingSellActions } from '@suite-common/trading';
import { isAmountTooHigh } from '@suite-common/wallet-utils';

import { useDispatch, useSelector } from 'src/hooks/suite';
import { useTradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';
import { getTradingFirstOutput } from 'src/utils/wallet/trading/tradingUtils';
import { TradingFormOfferConfirmButton } from 'src/views/wallet/trading/common/TradingForm/TradingFormOffer/components/TradingFormOfferConfirmButton';
import { TradingFormOfferOTC } from 'src/views/wallet/trading/common/TradingForm/TradingFormOffer/components/TradingFormOfferOTC';
import { useTradingFormOfferCommon } from 'src/views/wallet/trading/common/TradingForm/TradingFormOffer/hooks/useTradingFormOfferCommon';

export const TradingFormOfferSellActions = () => {
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
    const { amount, tokenAddress } = getTradingFirstOutput(outputs);
    const areSatsUsed = !!shouldSendInSats;

    const fee = composedTransactionInfo?.composed?.fee;
    const isFeeRequiredButMissingValue = fee === undefined || fee === '';

    const amountTooHigh = isAmountTooHigh({
        amount,
        contractAddress: tokenAddress,
        account,
        areSatsUsed,
    });

    const { quote, isConfirmButtonLoading, confirmButtonTranslationId, isBaseButtonDisabled } =
        useTradingFormOfferCommon<'sell'>();

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
        <>
            <TradingFormOfferConfirmButton
                onClick={onSelectQuote}
                isDisabled={isButtonDisabled}
                isLoading={isConfirmButtonLoading}
                translationId={confirmButtonTranslationId}
                testId="@trading/form/sell-button"
            />

            <TradingFormOfferOTC />
        </>
    );
};
