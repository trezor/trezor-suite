import { useEffect } from 'react';

import type { CryptoId } from 'invity-api';

import { Translation } from '@suite/intl';
import {
    requiresTokenApproval,
    selectTradingComposedTransactionInfo,
    tradingExchangeActions,
} from '@suite-common/trading';
import { isAmountTooHigh } from '@suite-common/wallet-utils';
import { Button } from '@trezor/components';

import { useDispatch, useSelector } from 'src/hooks/suite';
import { useTradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';
import { useTradingStellarActivation } from 'src/hooks/wallet/trading/useTradingStellarActivation';
import { getTradingFirstOutput } from 'src/utils/wallet/trading/tradingUtils';
import { TradingApproveModal } from 'src/views/wallet/trading/common/TradingForm/TradingApproveModal';
import { TradingFormApproval } from 'src/views/wallet/trading/common/TradingForm/TradingFormApproval';
import { TradingFormOfferConfirmButton } from 'src/views/wallet/trading/common/TradingForm/TradingFormOffer/components/TradingFormOfferConfirmButton';
import { useTradingFormOfferCommon } from 'src/views/wallet/trading/common/TradingForm/TradingFormOffer/hooks/useTradingFormOfferCommon';
import { TradingRevokeModal } from 'src/views/wallet/trading/common/TradingForm/TradingRevokeModal';
import { useReceiveAddressModalControls } from 'src/views/wallet/trading/common/TradingSelectedOffer/TradingReceiveAddress/useReceiveAddressModalControls';

export const TradingFormOfferExchangeActions = () => {
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
    const { amount, tokenAddress } = getTradingFirstOutput(outputs);
    const areSatsUsed = !!shouldSendInSats;

    const {
        quote,
        quoteAmounts,
        areFeesLoading,
        confirmButtonData,
        selectedAssetCryptoId,
        isBaseButtonDisabled,
    } = useTradingFormOfferCommon<'exchange'>();

    const { stellarActivateButton, stellarActivateModal } = useTradingStellarActivation({
        account: tradingReceiveAddress.selectedAccount ?? undefined,
        receiveCryptoId: selectedAssetCryptoId ?? undefined,
    });

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
                try {
                    await confirmTrade({ trade: quote, receiveAddress });
                } catch {
                    console.error('Failed to confirm trade on quote change');
                } finally {
                    setIsLoadingQuote(false);
                }
            }
        };

        initConfirmTrade();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [quote, shouldShowApprovalStep, tradingReceiveAddress.receiveAddress]);

    const onSelectQuote = async () => {
        if (!quote || !tradingReceiveAddress.receiveAddress) return;

        const { receiveAddress } = tradingReceiveAddress;
        try {
            const newTrade = await confirmTrade({ trade: quote, receiveAddress });

            if (!newTrade) return;

            context.selectQuote(newTrade);
        } catch {
            // error already logged by confirmTrade thunk
        }
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

        if (shouldShowApprovalStep && quote && !isLoading) {
            return <TradingFormApproval />;
        }

        if (stellarActivateButton) {
            return stellarActivateButton;
        }

        return (
            <TradingFormOfferConfirmButton
                {...confirmButtonData}
                onClick={onSelectQuote}
                isDisabled={isButtonDisabled}
                testId="@trading/form/exchange-button"
            />
        );
    };

    return (
        <>
            {renderActionButton()}

            {quoteAmounts?.sendCurrency && (
                <TradingApproveModal
                    amount={amount}
                    cryptoId={quoteAmounts.sendCurrency as CryptoId}
                />
            )}

            {quoteAmounts?.sendCurrency && (
                <TradingRevokeModal cryptoId={quoteAmounts.sendCurrency as CryptoId} />
            )}

            {stellarActivateModal}
        </>
    );
};
