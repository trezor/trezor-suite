import { Translation } from '@suite/intl';
import {
    selectTradingBuyReceiveAccountKey,
    selectTradingBuyReceiveAddress,
    tradingBuyActions,
} from '@suite-common/trading';
import { selectAccountByKey } from '@suite-common/wallet-core';
import { Button } from '@trezor/components';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

import { selectBuyQuoteThunk } from 'src/actions/wallet/trading/buy/selectBuyQuoteThunk';
import { useSelector } from 'src/hooks/suite';
import { useTradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';
import { useTradingStellarActivation } from 'src/hooks/wallet/trading/useTradingStellarActivation';
import { TradingFormOfferConfirmButton } from 'src/views/wallet/trading/common/TradingForm/TradingFormOffer/components/TradingFormOfferConfirmButton';
import { TradingFormOfferOTC } from 'src/views/wallet/trading/common/TradingForm/TradingFormOffer/components/TradingFormOfferOTC';
import { useTradingFormOfferCommon } from 'src/views/wallet/trading/common/TradingForm/TradingFormOffer/hooks/useTradingFormOfferCommon';
import { useReceiveAddressModalControls } from 'src/views/wallet/trading/common/TradingSelectedOffer/TradingReceiveAddress/useReceiveAddressModalControls';

export const TradingFormOfferBuyActions = () => {
    const { dispatch } = useServices(injectDispatch);
    const context = useTradingFormContext<'buy'>();
    const {
        getValues,
        form: { state },
    } = context;

    const modalControls = useReceiveAddressModalControls();

    const isReceiveAddressSelected = !!useSelector(selectTradingBuyReceiveAddress);
    const receiveAccountKey = useSelector(selectTradingBuyReceiveAccountKey);
    const selectedAccount = useSelector(suiteState =>
        selectAccountByKey(suiteState, receiveAccountKey),
    );

    const { quote, selectedAssetCryptoId, isBaseButtonDisabled } =
        useTradingFormOfferCommon<'buy'>();
    const isButtonDisabled = isBaseButtonDisabled || state.isFormLoading;

    const { stellarActivateButton, stellarActivateModal } = useTradingStellarActivation({
        account: selectedAccount ?? undefined,
        receiveCryptoId: selectedAssetCryptoId ?? undefined,
    });

    const onSelectQuote = () => {
        if (!quote) return;
        dispatch(tradingBuyActions.saveFormValues(getValues()));
        dispatch(selectBuyQuoteThunk({ quote }));
    };

    const onContinueClick = () => {
        modalControls.open('accountModal');
    };

    const renderActionButton = () => {
        if (!isReceiveAddressSelected && quote) {
            return isButtonDisabled ? null : (
                <Button
                    onClick={onContinueClick}
                    intent="brand"
                    margin={{ top: 16 }}
                    size="large"
                    minWidth={160}
                    width="100%"
                >
                    <Translation id="TR_CONTINUE" />
                </Button>
            );
        }

        if (stellarActivateButton) {
            return stellarActivateButton;
        }

        if (isButtonDisabled) {
            return null;
        }

        return (
            <TradingFormOfferConfirmButton
                translationId="TR_CONTINUE"
                onClick={onSelectQuote}
                testId="@trading/form/buy-button"
            />
        );
    };

    return (
        <>
            {renderActionButton()}
            {stellarActivateModal}
            <TradingFormOfferOTC />
        </>
    );
};
