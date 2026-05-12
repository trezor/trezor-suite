import { useMemo } from 'react';

import type { BuyTrade } from 'invity-api';

import { Translation } from '@suite/intl';
import {
    isCountrySubdivisionEmpty,
    selectTradingBuyReceiveAccountKey,
    selectTradingBuyReceiveAddress,
} from '@suite-common/trading';
import {
    selectAccountByKey,
    selectAreFeesLoading,
    selectHasRunningDiscovery,
} from '@suite-common/wallet-core';
import { Button, Column } from '@trezor/components';
import { breakpoints } from '@trezor/theme';

import { StellarManageTokenModal } from 'src/components/suite/modals/ReduxModal/UserContextModal/StellarManageTokenModal';
import { useSelector } from 'src/hooks/suite';
import { useTradingDeviceDisconnected } from 'src/hooks/wallet/trading/form/common/useTradingDeviceDisconnected';
import { useTradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';
import { useTradingStellarActivateToken } from 'src/hooks/wallet/trading/useTradingStellarActivateToken';
import { selectTorState } from 'src/selectors/suite/suiteSelectors';
import { useIsContentBelowBreakpoint } from 'src/support/suite/ContentFlex';
import { getSelectedQuote } from 'src/utils/wallet/trading/tradingTypingUtils';
import {
    tradingGetAmountLabels,
    tradingGetSectionActionLabel,
} from 'src/utils/wallet/trading/tradingUtils';
import { TradingFormOfferOTC } from 'src/views/wallet/trading/common/TradingForm/TradingFormOffer/components/TradingFormOfferOTC';
import { useReceiveAddressModalControls } from 'src/views/wallet/trading/common/TradingSelectedOffer/TradingReceiveAddress/useReceiveAddressModalControls';
import { TradingUtilsTorWarning } from 'src/views/wallet/trading/common/TradingUtils/TradingUtilsTorWarning';

import { TradingFormOfferAmount } from '../common/TradingForm/TradingFormOffer/components/TradingFormOfferAmount/TradingFormOfferAmount';
import { TradingFormOfferWarnings } from '../common/TradingForm/TradingFormOffer/components/TradingFormOffersWarnings';

export const TradingFormBuyOffer = () => {
    const { isTorEnabled } = useSelector(selectTorState);
    const context = useTradingFormContext<'buy'>();
    const {
        account,
        isAmountEmpty,
        getValues,
        watch,
        form: { state },
    } = context;

    const modalControls = useReceiveAddressModalControls();

    const isReceiveAddressSelected = !!useSelector(selectTradingBuyReceiveAddress);
    const receiveAccountKey = useSelector(selectTradingBuyReceiveAccountKey);
    const selectedAccount = useSelector(suiteState =>
        selectAccountByKey(suiteState, receiveAccountKey),
    );
    const areFeesLoading = useSelector(suiteState =>
        selectAreFeesLoading(suiteState, account.symbol),
    );

    const isDiscoveryRunning = useSelector(selectHasRunningDiscovery);

    const { amountInCrypto } = getValues();
    const selectedCryptoId = watch().cryptoSelect?.id ?? null;
    const amountLabels = tradingGetAmountLabels({ type: 'buy', amountInCrypto });

    const quote = getSelectedQuote(context) as BuyTrade | undefined;
    const quoteAmounts = quote
        ? {
              sendAmount: quote.fiatStringAmount ?? '',
              receiveAmount: quote.receiveStringAmount ?? '',
              receiveCurrency: quote.receiveCurrency,
          }
        : null;

    const sendAmount =
        !state.isLoadingOrInvalid && quoteAmounts?.sendAmount ? quoteAmounts.sendAmount : '0';

    const { tradingDeviceDisconnected } = useTradingDeviceDisconnected();

    const isSubdivisionMissing = useMemo(() => {
        const { countrySelect, countrySubdivisionSelect } = watch();

        return isCountrySubdivisionEmpty(countrySelect?.value, countrySubdivisionSelect?.value);
    }, [watch]);

    const isButtonDisabled =
        isDiscoveryRunning ||
        tradingDeviceDisconnected ||
        state.isLoadingOrInvalid ||
        !quote ||
        areFeesLoading;

    const isLoading = state.isFormLoading;

    const selectedAssetCryptoId =
        !state.isLoadingOrInvalid && quoteAmounts?.receiveCurrency
            ? quoteAmounts.receiveCurrency
            : (selectedCryptoId ?? undefined);

    const { inactiveToken: stellarInactiveToken, modal: stellarActivateTokenModal } =
        useTradingStellarActivateToken({
            account: selectedAccount ?? undefined,
            receiveCryptoId: selectedAssetCryptoId,
        });

    const isStellarActivateTokenModalOpen =
        stellarActivateTokenModal.isOpen && !!stellarInactiveToken;

    const isContentBelowBreakpoint = useIsContentBelowBreakpoint(breakpoints.tablet);

    const noOffersWithTor = isTorEnabled && !quote && !isLoading;

    const isConfirmButtonLoading =
        areFeesLoading || (state.isFormLoading && !isAmountEmpty && isReceiveAddressSelected);

    const confirmButtonTranslationId =
        state.isFormLoading && !isAmountEmpty && isReceiveAddressSelected
            ? 'TR_TRADING_OFFER_LOOKING'
            : tradingGetSectionActionLabel('buy');

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
                shouldDisplayFiatAmount={!!amountInCrypto}
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
                    isDisabled={isButtonDisabled || isLoading}
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
                        <Button
                            onClick={onSelectQuote}
                            intent="brand"
                            margin={{ top: 16 }}
                            size="large"
                            isDisabled={isButtonDisabled || isLoading}
                            isLoading={isConfirmButtonLoading}
                            data-testid="@trading/form/buy-button"
                            minWidth={160}
                            width={isContentBelowBreakpoint ? undefined : '100%'}
                        >
                            <Translation id={confirmButtonTranslationId} />
                        </Button>
                    )}
                </>
            )}

            <TradingFormOfferOTC />

            {isStellarActivateTokenModalOpen && !!selectedAccount && (
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
