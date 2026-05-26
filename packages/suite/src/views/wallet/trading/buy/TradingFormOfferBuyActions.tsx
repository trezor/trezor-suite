import { Translation } from '@suite/intl';
import {
    selectTradingBuyReceiveAccountKey,
    selectTradingBuyReceiveAddress,
} from '@suite-common/trading';
import { selectAccountByKey } from '@suite-common/wallet-core';
import { Button } from '@trezor/components';

import { useSelector } from 'src/hooks/suite';
import { useTradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';
import { useTradingStellarActivation } from 'src/hooks/wallet/trading/useTradingStellarActivation';
import { TradingFormOfferConfirmButton } from 'src/views/wallet/trading/common/TradingForm/TradingFormOffer/components/TradingFormOfferConfirmButton';
import { TradingFormOfferKYCWarning } from 'src/views/wallet/trading/common/TradingForm/TradingFormOffer/components/TradingFormOfferKYCWarning';
import { TradingFormOfferOTC } from 'src/views/wallet/trading/common/TradingForm/TradingFormOffer/components/TradingFormOfferOTC';
import { useTradingFormOfferCommon } from 'src/views/wallet/trading/common/TradingForm/TradingFormOffer/hooks/useTradingFormOfferCommon';
import { useReceiveAddressModalControls } from 'src/views/wallet/trading/common/TradingSelectedOffer/TradingReceiveAddress/useReceiveAddressModalControls';

export const TradingFormOfferBuyActions = () => {
    const context = useTradingFormContext<'buy'>();
    const {
        form: { state },
    } = context;

    const modalControls = useReceiveAddressModalControls();

    const isReceiveAddressSelected = !!useSelector(selectTradingBuyReceiveAddress);
    const receiveAccountKey = useSelector(selectTradingBuyReceiveAccountKey);
    const selectedAccount = useSelector(suiteState =>
        selectAccountByKey(suiteState, receiveAccountKey),
    );

    const {
        quote,
        areFeesLoading,
        confirmButtonData,
        selectedAssetCryptoId,
        isBaseButtonDisabled,
    } = useTradingFormOfferCommon<'buy'>();
    const isButtonDisabled = isBaseButtonDisabled || state.isFormLoading;

    const { stellarActivateButton, stellarActivateModal } = useTradingStellarActivation({
        account: selectedAccount ?? undefined,
        receiveCryptoId: selectedAssetCryptoId ?? undefined,
    });

    const onSelectQuote = () => {
        if (!quote) return;
        context.selectQuote(quote);
    };

    const onContinueClick = () => {
        modalControls.open('accountModal');
    };

    const renderActionButton = () => {
        if (!isReceiveAddressSelected && quote) {
            return (
                <Button
                    onClick={onContinueClick}
                    intent="brand"
                    margin={{ top: 16 }}
                    isDisabled={isButtonDisabled}
                    isLoading={areFeesLoading || state.isFormLoading}
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

        return (
            <TradingFormOfferConfirmButton
                {...confirmButtonData}
                onClick={onSelectQuote}
                isDisabled={isButtonDisabled}
                testId="@trading/form/buy-button"
            />
        );
    };

    return (
        <>
            {renderActionButton()}
            {quote && <TradingFormOfferKYCWarning />}
            {stellarActivateModal}
            <TradingFormOfferOTC />
        </>
    );
};
