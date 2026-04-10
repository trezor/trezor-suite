import { memo } from 'react';

import { Translation } from '@suite/intl';
import { isCountrySubdivisionEmpty } from '@suite-common/trading';
import { Button, Column } from '@trezor/components';

import { StellarManageTokenModal } from 'src/components/suite/modals/ReduxModal/UserContextModal/StellarManageTokenModal';
import { useTradingFormOfferBase } from 'src/hooks/wallet/trading/form/common/useTradingFormOfferBase';
import { useTradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';
import { useTradingStellarActivateToken } from 'src/hooks/wallet/trading/useTradingStellarActivateToken';
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
import { TradingFormOfferContinueButton } from 'src/views/wallet/trading/common/TradingForm/TradingFormOfferContinueButton';
import { TradingFormOfferNoOffersCard } from 'src/views/wallet/trading/common/TradingForm/TradingFormOfferNoOffersCard';
import { TradingFormOfferOTC } from 'src/views/wallet/trading/common/TradingForm/TradingFormOfferOTC';
import { TradingFormOfferSubdivisionCard } from 'src/views/wallet/trading/common/TradingForm/TradingFormOfferSubdivisionCard';

import { useReceiveAddressModalControls } from '../common/TradingSelectedOffer/TradingReceiveAddress/useReceiveAddressModalControls';
import { TradingUtilsTorWarning } from '../common/TradingUtils/TradingUtilsTorWarning';

export const TradingBuyFormOffer = memo(() => {
    const {
        isTorEnabled,
        tradingDeviceDisconnected,
        areFeesLoading,
        isDiscoveryRunning,
        isContentBelowBreakpoint,
    } = useTradingFormOfferBase();
    const context = useTradingFormContext<'buy'>();
    const {
        type,
        isAmountEmpty,
        getValues,
        preselectedQuote,
        tradingReceiveAddress,
        form: { state },
    } = context;

    const modalControls = useReceiveAddressModalControls();

    const isReceiveAddressSelected = !!tradingReceiveAddress?.receiveAddress;
    const quote = getSelectedQuote(context);
    const bestScoredQuoteAmounts = getCryptoQuoteAmountProps(quote, context);
    const { amountInCrypto } = getValues();
    const amountLabels = tradingGetAmountLabels({ type, amountInCrypto });
    const selectedCryptoId = getSelectedCryptoId(context);
    const receiveCurrency = bestScoredQuoteAmounts?.receiveCurrency;
    const selectedAssetCryptoId =
        !state.isLoadingOrInvalid && receiveCurrency
            ? receiveCurrency
            : (selectedCryptoId ?? undefined);

    const { countrySelect, countrySubdivisionSelect } = getValues();
    const isSubdivisionMissing = isCountrySubdivisionEmpty(
        countrySelect?.value,
        countrySubdivisionSelect?.value,
    );

    const isButtonDisabled =
        isDiscoveryRunning ||
        tradingDeviceDisconnected ||
        state.isLoadingOrInvalid ||
        !quote ||
        areFeesLoading;

    const isLoading = state.isFormLoading;
    const noOffersWithTor = isTorEnabled && !quote && !isLoading;

    const { inactiveToken: stellarInactiveToken, modal: stellarActivateTokenModal } =
        useTradingStellarActivateToken({
            account: tradingReceiveAddress?.selectedAccount ?? undefined,
            receiveCryptoId: selectedAssetCryptoId,
        });

    const isStellarActivateTokenModalOpen =
        stellarActivateTokenModal.isOpen && !!stellarInactiveToken;

    const isConfirmButtonLoading =
        areFeesLoading ||
        (!!preselectedQuote && state.isFormLoading) ||
        (state.isFormLoading && !isAmountEmpty && isReceiveAddressSelected);

    const confirmButtonTranslationId =
        state.isFormLoading && !isAmountEmpty && isReceiveAddressSelected
            ? 'TR_TRADING_OFFER_LOOKING'
            : tradingGetSectionActionLabel(type);

    const onSelectQuote = () => {
        if (!quote) return;
        context.selectQuote(quote);
    };

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

            {!isReceiveAddressSelected && quote ? (
                <TradingFormOfferContinueButton
                    onClick={() => modalControls.open('accountModal')}
                    isDisabled={isButtonDisabled || isLoading}
                    isLoading={areFeesLoading || (!!preselectedQuote && state.isFormLoading)}
                />
            ) : (
                <>
                    {stellarInactiveToken ? (
                        <Button
                            intent="brand"
                            margin={{ top: 16 }}
                            size="large"
                            minWidth={160}
                            width={isContentBelowBreakpoint ? undefined : '100%'}
                            onClick={stellarActivateTokenModal.onOpen}
                            isDisabled={!tradingReceiveAddress?.selectedAccount?.symbol}
                        >
                            <Translation
                                id="TR_ACTIVATE_TOKEN"
                                values={{ token: stellarInactiveToken.symbol }}
                            />
                        </Button>
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

            <TradingFormOfferOTC />

            {isStellarActivateTokenModalOpen && !!tradingReceiveAddress?.selectedAccount && (
                <StellarManageTokenModal
                    mode="activate"
                    account={tradingReceiveAddress.selectedAccount}
                    symbol={tradingReceiveAddress.selectedAccount.symbol}
                    contractAddress={stellarInactiveToken.contract}
                    onCancel={stellarActivateTokenModal.onClose}
                />
            )}
        </Column>
    );
});

TradingBuyFormOffer.displayName = 'TradingBuyFormOffer';
