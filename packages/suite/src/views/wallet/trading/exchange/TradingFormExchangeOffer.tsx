import { useEffect } from 'react';

import type { CryptoId, ExchangeTrade } from 'invity-api';

import { Translation } from '@suite/intl';
import {
    TRADING_EXCHANGE_FORM_DEX,
    requiresTokenApproval,
    selectTradingComposedTransactionInfo,
    tradingExchangeActions,
} from '@suite-common/trading';
import { selectAreFeesLoading, selectHasRunningDiscovery } from '@suite-common/wallet-core';
import { type TokenAddress } from '@suite-common/wallet-types';
import { isAmountTooHigh } from '@suite-common/wallet-utils';
import { Button, Column } from '@trezor/components';
import { breakpoints } from '@trezor/theme';

import { StellarManageTokenModal } from 'src/components/suite/modals/ReduxModal/UserContextModal/StellarManageTokenModal';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { useTradingDeviceDisconnected } from 'src/hooks/wallet/trading/form/common/useTradingDeviceDisconnected';
import { useTradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';
import { useTradingStellarActivateToken } from 'src/hooks/wallet/trading/useTradingStellarActivateToken';
import { selectTorState } from 'src/selectors/suite/suiteSelectors';
import { useIsContentBelowBreakpoint } from 'src/support/suite/ContentFlex';
import {
    getCryptoQuoteAmountProps,
    getSelectedCryptoId,
} from 'src/utils/wallet/trading/tradingTypingUtils';
import {
    tradingGetAmountLabels,
    tradingGetSectionActionLabel,
} from 'src/utils/wallet/trading/tradingUtils';
import { TradingApproveModal } from 'src/views/wallet/trading/common/TradingForm/TradingApproveModal';
import { TradingFormApproval } from 'src/views/wallet/trading/common/TradingForm/TradingFormApproval';
import { TradingRevokeModal } from 'src/views/wallet/trading/common/TradingForm/TradingRevokeModal';
import { useReceiveAddressModalControls } from 'src/views/wallet/trading/common/TradingSelectedOffer/TradingReceiveAddress/useReceiveAddressModalControls';
import { TradingUtilsTorWarning } from 'src/views/wallet/trading/common/TradingUtils/TradingUtilsTorWarning';

import { TradingFormOfferAmount } from '../common/TradingForm/TradingFormOffer/components/TradingFormOfferAmount/TradingFormOfferAmount';
import { TradingFormOfferWarnings } from '../common/TradingForm/TradingFormOffer/components/TradingFormOffersWarnings';

export const TradingFormExchangeOffer = () => {
    const dispatch = useDispatch();
    const { isTorEnabled } = useSelector(selectTorState);
    const context = useTradingFormContext<'exchange'>();
    const {
        account,
        isAmountEmpty,
        watch,
        shouldSendInSats,
        tradingReceiveAddress,
        isLoadingQuote,
        setIsLoadingQuote,
        dexQuotes,
        cexQuotes,
        confirmTrade,
        form: { state },
    } = context;

    const modalControls = useReceiveAddressModalControls();

    const areFeesLoading = useSelector(suiteState =>
        selectAreFeesLoading(suiteState, account.symbol),
    );
    const composedTransactionInfo = useSelector(selectTradingComposedTransactionInfo);
    const isDiscoveryRunning = useSelector(selectHasRunningDiscovery);

    const { amountInCrypto, outputs, exchangeType, provider, sendCryptoSelect } = watch();
    const { amount, token } = outputs[0];
    const tokenAddress = token as TokenAddress | null;
    const areSatsUsed = !!shouldSendInSats;

    const fee = composedTransactionInfo?.composed?.fee;
    const isFeeRequiredButMissingValue = fee === undefined || fee === '';

    const amountLabels = tradingGetAmountLabels({ type: 'exchange', amountInCrypto });

    const isDex = exchangeType === TRADING_EXCHANGE_FORM_DEX;
    const quotes = isDex ? dexQuotes : cexQuotes;

    const quote = (quotes?.find(q => !provider || q.exchange === provider) ?? quotes?.[0]) as
        | ExchangeTrade
        | undefined;

    const quoteAmounts = getCryptoQuoteAmountProps(quote, context);
    const selectedCryptoId = getSelectedCryptoId(context);

    const sendAmount =
        !state.isLoadingOrInvalid && quoteAmounts?.sendAmount ? quoteAmounts.sendAmount : '0';

    const { tradingDeviceDisconnected } = useTradingDeviceDisconnected();

    const isReceiveAddressSelected = !!tradingReceiveAddress.receiveAddress;
    const shouldShowApprovalStep = quote !== undefined && requiresTokenApproval(quote);
    const isQuoteOutdated = quote?.send !== sendCryptoSelect?.id;
    const amountTooHigh = isAmountTooHigh({
        amount,
        contractAddress: tokenAddress,
        account,
        areSatsUsed,
    });

    const isButtonDisabled =
        isDiscoveryRunning ||
        tradingDeviceDisconnected ||
        state.isLoadingOrInvalid ||
        !quote ||
        amountTooHigh ||
        areFeesLoading ||
        isFeeRequiredButMissingValue;

    const isLoading = shouldShowApprovalStep
        ? state.isFormLoading || isLoadingQuote || isQuoteOutdated
        : state.isFormLoading || isLoadingQuote;

    const receiveCurrency = quoteAmounts?.receiveCurrency;
    const selectedAssetCryptoId =
        !state.isLoadingOrInvalid && receiveCurrency
            ? receiveCurrency
            : (selectedCryptoId ?? undefined);

    const { inactiveToken: stellarInactiveToken, modal: stellarActivateTokenModal } =
        useTradingStellarActivateToken({
            account: tradingReceiveAddress.selectedAccount ?? undefined,
            receiveCryptoId: selectedAssetCryptoId,
        });

    const isStellarActivateTokenModalOpen =
        stellarActivateTokenModal.isOpen && !!stellarInactiveToken;
    const isContentBelowBreakpoint = useIsContentBelowBreakpoint(breakpoints.tablet);
    const noOffersWithTor = isTorEnabled && !quote && !isLoading;
    const isConfirmButtonLoading = areFeesLoading || (state.isFormLoading && !isAmountEmpty);

    const confirmButtonTranslationId =
        state.isFormLoading && !isAmountEmpty
            ? 'TR_TRADING_OFFER_LOOKING'
            : tradingGetSectionActionLabel('exchange');

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
                                <Button
                                    onClick={onSelectQuote}
                                    intent="brand"
                                    margin={{ top: 16 }}
                                    size="large"
                                    isDisabled={isButtonDisabled || isLoading}
                                    isLoading={isConfirmButtonLoading}
                                    data-testid="@trading/form/exchange-button"
                                    minWidth={160}
                                    width={isContentBelowBreakpoint ? undefined : '100%'}
                                >
                                    <Translation id={confirmButtonTranslationId} />
                                </Button>
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

            {isStellarActivateTokenModalOpen && !!tradingReceiveAddress.selectedAccount && (
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
