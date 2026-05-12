import { useMemo } from 'react';

import { Translation } from '@suite/intl';
import {
    isCountrySubdivisionEmpty,
    selectTradingBuyReceiveAccountKey,
    selectTradingBuyReceiveAddress,
} from '@suite-common/trading';
import { selectAccountByKey } from '@suite-common/wallet-core';
import { Button, Column } from '@trezor/components';
import { breakpoints } from '@trezor/theme';

import { StellarManageTokenModal } from 'src/components/suite/modals/ReduxModal/UserContextModal/StellarManageTokenModal';
import { useSelector } from 'src/hooks/suite';
import { useTradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';
import { useTradingStellarActivateToken } from 'src/hooks/wallet/trading/useTradingStellarActivateToken';
import { useIsContentBelowBreakpoint } from 'src/support/suite/ContentFlex';
import { useReceiveAddressModalControls } from 'src/views/wallet/trading/common/TradingSelectedOffer/TradingReceiveAddress/useReceiveAddressModalControls';
import { TradingUtilsTorWarning } from 'src/views/wallet/trading/common/TradingUtils/TradingUtilsTorWarning';

import { TradingFormOfferAmount } from '../common/TradingForm/TradingFormOffer/components/TradingFormOfferAmount/TradingFormOfferAmount';
import { TradingFormOfferConfirmButton } from '../common/TradingForm/TradingFormOffer/components/TradingFormOfferConfirmButton';
import { TradingFormOfferOTC } from '../common/TradingForm/TradingFormOffer/components/TradingFormOfferOTC';
import { TradingFormOfferWarnings } from '../common/TradingForm/TradingFormOffer/components/TradingFormOffersWarnings';
import { useTradingFormOfferCommon } from '../common/TradingForm/TradingFormOffer/hooks/useTradingFormOfferCommon';

export const TradingFormBuyOffer = () => {
    const context = useTradingFormContext<'buy'>();
    const {
        watch,
        form: { state },
    } = context;

    const modalControls = useReceiveAddressModalControls();

    const isReceiveAddressSelected = !!useSelector(selectTradingBuyReceiveAddress);
    const receiveAccountKey = useSelector(selectTradingBuyReceiveAccountKey);
    const selectedAccount = useSelector(suiteState =>
        selectAccountByKey(suiteState, receiveAccountKey),
    );

    const isSubdivisionMissing = useMemo(() => {
        const { countrySelect, countrySubdivisionSelect } = watch();

        return isCountrySubdivisionEmpty(countrySelect?.value, countrySubdivisionSelect?.value);
    }, [watch]);

    const {
        quote,
        quoteAmounts,
        areFeesLoading,
        noOffersWithTor,
        isConfirmButtonLoading,
        confirmButtonTranslationId,
        sendAmount,
        selectedAssetCryptoId,
        amountLabels,
        isBaseButtonDisabled,
    } = useTradingFormOfferCommon<'buy'>();

    const { inactiveToken: stellarInactiveToken, modal: stellarActivateTokenModal } =
        useTradingStellarActivateToken({
            account: selectedAccount ?? undefined,
            receiveCryptoId: selectedAssetCryptoId,
        });

    const isContentBelowBreakpoint = useIsContentBelowBreakpoint(breakpoints.tablet);
    const isButtonDisabled = isBaseButtonDisabled || state.isFormLoading;

    const onSelectQuote = () => {
        if (!quote) return;
        context.selectQuote(quote);
    };

    const onContinueClick = () => {
        modalControls.open('accountModal');
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

            {noOffersWithTor && <TradingUtilsTorWarning tradingType="buy" noOffer={!quote} />}

            {!isReceiveAddressSelected && quote ? (
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
                            isDisabled={!selectedAccount?.symbol}
                        >
                            <Translation
                                id="TR_ACTIVATE_TOKEN"
                                values={{ token: stellarInactiveToken.symbol }}
                            />
                        </Button>
                    ) : (
                        <TradingFormOfferConfirmButton
                            onClick={onSelectQuote}
                            isDisabled={isButtonDisabled}
                            isLoading={isConfirmButtonLoading}
                            translationId={confirmButtonTranslationId}
                            testId="@trading/form/buy-button"
                        />
                    )}
                </>
            )}

            <TradingFormOfferOTC />

            {stellarActivateTokenModal.isOpen && !!stellarInactiveToken && !!selectedAccount && (
                <StellarManageTokenModal
                    mode="activate"
                    account={selectedAccount}
                    symbol={selectedAccount.symbol}
                    contractAddress={stellarInactiveToken.contract}
                    onCancel={stellarActivateTokenModal.onClose}
                />
            )}
        </Column>
    );
};
