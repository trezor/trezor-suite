import { useSelector } from 'react-redux';

import {
    type TradingFormAccountRootState,
    selectIsTradingNetworkFeeMissing,
    selectTradingSendAccount,
    tradingSellActions,
} from '@suite-common/trading';
import { isAmountTooHigh } from '@suite-common/wallet-utils';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

import { selectSellQuoteThunk } from 'src/actions/wallet/trading/sell/selectSellQuoteThunk';
import { useTradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';
import { getTradingFirstOutput } from 'src/utils/wallet/trading/tradingUtils';
import { TradingFormOfferConfirmButton } from 'src/views/wallet/trading/common/TradingForm/TradingFormOffer/components/TradingFormOfferConfirmButton';
import { TradingFormOfferOTC } from 'src/views/wallet/trading/common/TradingForm/TradingFormOffer/components/TradingFormOfferOTC';
import { useTradingFormOfferCommon } from 'src/views/wallet/trading/common/TradingForm/TradingFormOffer/hooks/useTradingFormOfferCommon';

export const TradingFormOfferSellActions = () => {
    // React Compiler: `watch` keeps one identity for the form's whole life, so a compiled
    // render-time read of it freezes on the first render. Remove once these reads move to
    // `useWatch` or out of render.
    'use no memo';

    const { dispatch } = useServices(injectDispatch);
    const context = useTradingFormContext<'sell'>();
    const {
        watch,
        getValues,
        shouldSendInSats,
        form: { state, helpers },
    } = context;
    const account = useSelector((reduxState: TradingFormAccountRootState) =>
        selectTradingSendAccount(reduxState, 'sell'),
    );
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

        dispatch(tradingSellActions.saveFormValues(getValues()));
        dispatch(selectSellQuoteThunk({ quote, fractionButton: helpers.fractionButton }));
    };

    return (
        <>
            <TradingFormOfferConfirmButton
                translationId="TR_CONTINUE"
                isLoading={confirmButtonData.isLoading}
                onClick={onSelectQuote}
                isDisabled={isButtonDisabled}
                testId="@trading/form/sell-button"
            />

            <TradingFormOfferOTC />
        </>
    );
};
