import { useEffect } from 'react';

import type { CryptoId } from 'invity-api';

import { Translation } from '@suite/intl';
import {
    requiresTokenApproval,
    selectTradingComposedTransactionInfo,
    tradingExchangeActions,
} from '@suite-common/trading';
import { type TokenAddress } from '@suite-common/wallet-types';
import { isAmountTooHigh } from '@suite-common/wallet-utils';
import { Button, Column } from '@trezor/components';
import { breakpoints } from '@trezor/theme';

import { StellarManageTokenModal } from 'src/components/suite/modals/ReduxModal/UserContextModal/StellarManageTokenModal';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { useTradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';
import { useTradingStellarActivateToken } from 'src/hooks/wallet/trading/useTradingStellarActivateToken';
import { useIsContentBelowBreakpoint } from 'src/support/suite/ContentFlex';
import { TradingApproveModal } from 'src/views/wallet/trading/common/TradingForm/TradingApproveModal';
import { TradingFormApproval } from 'src/views/wallet/trading/common/TradingForm/TradingFormApproval';
import { TradingRevokeModal } from 'src/views/wallet/trading/common/TradingForm/TradingRevokeModal';
import { useReceiveAddressModalControls } from 'src/views/wallet/trading/common/TradingSelectedOffer/TradingReceiveAddress/useReceiveAddressModalControls';
import { TradingUtilsTorWarning } from 'src/views/wallet/trading/common/TradingUtils/TradingUtilsTorWarning';

import { TradingFormOfferAmount } from '../common/TradingForm/TradingFormOffer/components/TradingFormOfferAmount/TradingFormOfferAmount';
import { TradingFormOfferConfirmButton } from '../common/TradingForm/TradingFormOffer/components/TradingFormOfferConfirmButton';
import { TradingFormOfferWarnings } from '../common/TradingForm/TradingFormOffer/components/TradingFormOffersWarnings';
import { useTradingFormOfferCommon } from '../common/TradingForm/TradingFormOffer/hooks/useTradingFormOfferCommon';

export const TradingFormExchangeOffer = () => {
    const dispatch = useDispatch();
    const context = useTradingFormContext<'exchange'>();
    const {
        account,
        watch,
        shouldSendInSats,
        tradingReceiveAddress,
        isLoadingQuote,
        setIsLoadingQuote,
        confirmTrade,
        form: { state },
    } = context;

    const modalControls = useReceiveAddressModalControls();

    const composedTransactionInfo = useSelector(selectTradingComposedTransactionInfo);
    const fee = composedTransactionInfo?.composed?.fee;
    const isFeeRequiredButMissingValue = fee === undefined || fee === '';

    const { outputs, sendCryptoSelect } = watch();
    const { amount, token } = outputs[0];
    const tokenAddress = token as TokenAddress | null;
    const areSatsUsed = !!shouldSendInSats;

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
    } = useTradingFormOfferCommon<'exchange'>();

    const { inactiveToken: stellarInactiveToken, modal: stellarActivateTokenModal } =
        useTradingStellarActivateToken({
            account: tradingReceiveAddress.selectedAccount ?? undefined,
            receiveCryptoId: selectedAssetCryptoId,
        });

    const isContentBelowBreakpoint = useIsContentBelowBreakpoint(breakpoints.tablet);

    const isReceiveAddressSelected = !!tradingReceiveAddress.receiveAddress;
    const shouldShowApprovalStep = quote !== undefined && requiresTokenApproval(quote);
    const isQuoteOutdated = quote?.send !== sendCryptoSelect?.id;
    const amountTooHigh = isAmountTooHigh({
        amount,
        contractAddress: tokenAddress,
        account,
        areSatsUsed,
    });

    const isLoading = shouldShowApprovalStep
        ? state.isFormLoading || isLoadingQuote || isQuoteOutdated
        : state.isFormLoading || isLoadingQuote;

    const isButtonDisabled =
        isBaseButtonDisabled || amountTooHigh || isFeeRequiredButMissingValue || isLoading;

    useEffect(() => {
        const initConfirmTrade = async () => {
            if (shouldShowApprovalStep && tradingReceiveAddress.receiveAddress) {
                dispatch(tradingExchangeActions.saveSelectedQuote(undefined));
                const { receiveAddress } = tradingReceiveAddress;

                setIsLoadingQuote(true);
                await confirmTrade({ trade: quote, receiveAddress });
                setIsLoadingQuote(false);
            }
        };

        initConfirmTrade();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [quote, shouldShowApprovalStep, tradingReceiveAddress.receiveAddress]);

    const onSelectQuote = async () => {
        if (!quote || !tradingReceiveAddress.receiveAddress) return;

        const { receiveAddress } = tradingReceiveAddress;
        const newTrade = await confirmTrade({ trade: quote, receiveAddress });

        if (!newTrade) return;

        context.selectQuote(newTrade);
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
                shouldDisplayFiatAmount={false}
                amountLabels={amountLabels}
            />

            <TradingFormOfferWarnings isSubdivisionMissing={false} hasQuote={!!quote} />

            {noOffersWithTor && <TradingUtilsTorWarning tradingType="exchange" noOffer={!quote} />}

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
                    {shouldShowApprovalStep && quote && !isLoading ? (
                        <TradingFormApproval />
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
                                    isDisabled={!tradingReceiveAddress.selectedAccount?.symbol}
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
                                    testId="@trading/form/exchange-button"
                                />
                            )}
                        </>
                    )}
                </>
            )}

            {quoteAmounts?.sendCurrency && (
                <TradingApproveModal
                    amount={amount}
                    cryptoId={quoteAmounts.sendCurrency as CryptoId}
                />
            )}

            {quoteAmounts?.sendCurrency && (
                <TradingRevokeModal cryptoId={quoteAmounts.sendCurrency as CryptoId} />
            )}

            {stellarActivateTokenModal.isOpen &&
                !!stellarInactiveToken &&
                !!tradingReceiveAddress.selectedAccount && (
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
};
