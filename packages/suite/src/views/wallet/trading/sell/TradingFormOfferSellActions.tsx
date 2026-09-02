import { useDispatch } from '@suite-common/redux-utils';
import {
    selectIsTradingNetworkFeeMissing,
    selectTradingSellProviders,
    selectTradingSendAccount,
    tradingSellActions,
} from '@suite-common/trading';
import { isAmountTooHigh } from '@suite-common/wallet-utils';

import { selectSellQuoteThunk } from 'src/actions/wallet/trading/sell/selectSellQuoteThunk';
import { useSelector } from 'src/hooks/suite';
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
        watch,
        shouldSendInSats,
        form: { state, helpers },
    } = context;
    const account = useSelector(reduxState => selectTradingSendAccount(reduxState, 'sell'));
    const sellProviders = useSelector(selectTradingSellProviders);

    const isNetworkFeeMissing = useSelector(selectIsTradingNetworkFeeMissing);

    const { outputs } = watch();
    const { amount, tokenAddress } = getTradingFirstOutput(outputs);
    const areSatsUsed = !!shouldSendInSats;

    const amountTooHigh = account
        ? isAmountTooHigh({
              amount,
              contractAddress: tokenAddress,
              account,
              areSatsUsed,
          })
        : false;

    const { quote, confirmButtonData, isBaseButtonDisabled } = useTradingFormOfferCommon<'sell'>();

    const isButtonDisabled =
        !account ||
        isBaseButtonDisabled ||
        amountTooHigh ||
        isNetworkFeeMissing ||
        state.isFormLoading;

    const onSelectQuote = () => {
        if (!quote) return;

        const provider = quote.exchange ? sellProviders?.[quote.exchange] : undefined;

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
