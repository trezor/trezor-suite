import { selectIsTradingNetworkFeeMissing, tradingSellActions } from '@suite-common/trading';
import { isAmountTooHigh } from '@suite-common/wallet-utils';

import { selectSellQuoteThunk } from 'src/actions/wallet/trading/sell/selectSellQuoteThunk';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { useTradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';
import { getTradingFirstOutput } from 'src/utils/wallet/trading/tradingUtils';
import { TradingFormOfferConfirmButton } from 'src/views/wallet/trading/common/TradingForm/TradingFormOffer/components/TradingFormOfferConfirmButton';
import { TradingFormOfferOTC } from 'src/views/wallet/trading/common/TradingForm/TradingFormOffer/components/TradingFormOfferOTC';
import { useTradingFormOfferCommon } from 'src/views/wallet/trading/common/TradingForm/TradingFormOffer/hooks/useTradingFormOfferCommon';
import { TradingKYCWarning } from 'src/views/wallet/trading/common/TradingKYCWarning';

export const TradingFormOfferSellActions = () => {
    const dispatch = useDispatch();
    const context = useTradingFormContext<'sell'>();
    const {
        account,
        watch,
        shouldSendInSats,
        sellInfo,
        form: { state, helpers },
    } = context;

    const isNetworkFeeMissing = useSelector(selectIsTradingNetworkFeeMissing);

    const { outputs } = watch();
    const { amount, tokenAddress } = getTradingFirstOutput(outputs);
    const areSatsUsed = !!shouldSendInSats;

    const amountTooHigh = isAmountTooHigh({
        amount,
        contractAddress: tokenAddress,
        account,
        areSatsUsed,
    });

    const { quote, confirmButtonData, isBaseButtonDisabled } = useTradingFormOfferCommon<'sell'>();

    const isButtonDisabled =
        isBaseButtonDisabled || amountTooHigh || isNetworkFeeMissing || state.isFormLoading;

    const onSelectQuote = () => {
        if (!quote) return;

        const provider = quote.exchange ? sellInfo?.providerInfos[quote.exchange] : undefined;

        if (provider?.flow === 'BANK_ACCOUNT') {
            dispatch(tradingSellActions.setFormStep('BANK_ACCOUNT'));
        } else {
            dispatch(tradingSellActions.setFormStep('SEND_TRANSACTION'));
        }

        dispatch(selectSellQuoteThunk({ quote, fractionButton: helpers.fractionButton }));
    };

    return (
        <>
            <TradingFormOfferConfirmButton
                {...confirmButtonData}
                onClick={onSelectQuote}
                isDisabled={isButtonDisabled}
                testId="@trading/form/sell-button"
            />

            {quote && <TradingKYCWarning />}

            <TradingFormOfferOTC />
        </>
    );
};
