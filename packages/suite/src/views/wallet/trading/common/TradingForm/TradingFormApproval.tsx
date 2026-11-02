import styled, { type DefaultTheme } from 'styled-components';

import { Address } from '@suite/address';
import { events, injectDesktopAnalytics } from '@suite/analytics';
import { Translation } from '@suite/intl';
import { openModal } from '@suite/modal';
import {
    type TradingExchangeType,
    requiresTokenApproval,
    selectTradingExchangeSelectedQuote,
    selectTradingSendAccount,
    tradingExchangeActions,
    useApprovalStep,
    useTradingUtils,
} from '@suite-common/trading';
import { selectAreFeesLoading, selectHasRunningDiscovery } from '@suite-common/wallet-core';
import { type AllowanceTransactionType } from '@suite-common/wallet-types';
import { tokenSupportsIncreasingAllowance } from '@suite-common/wallet-utils';
import { Banner, Button, Column } from '@trezor/components';
import { useServices } from '@trezor/dependency-injection';
import { WarningIcon } from '@trezor/icons';
import { PendingTransactionInfo } from '@trezor/product-components';
import { useAsyncClickHandler } from '@trezor/react-utils';
import { injectDispatch } from '@trezor/redux-utils';

import { selectExchangeQuoteThunk } from 'src/actions/wallet/trading/exchange/selectExchangeQuoteThunk';
import { useSelector } from 'src/hooks/suite';
import { useTradingAllowanceContext } from 'src/hooks/wallet/trading/allowance/useTradingAllowanceContext';
import { useTradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';
import { useTradingExchangeCryptoAndProviderInfo } from 'src/hooks/wallet/trading/form/useTradingExchangeCryptoAndProviderInfo';

const TextButton = styled.div<{ $disabled: boolean }>`
    color: ${({ theme, $disabled }) =>
        $disabled ? theme.contentDisabled : theme['contentBrand' as keyof DefaultTheme]};
    cursor: pointer;

    &:hover {
        color: ${({ theme, $disabled }) =>
            $disabled ? theme.contentDisabled : theme['contentBrandPressed' as keyof DefaultTheme]};
    }
`;

export const TradingFormApproval = () => {
    // React Compiler: `watch` keeps one identity for the form's whole life, so a compiled
    // render-time read of it freezes on the first render. Remove once these reads move to
    // `useWatch` or out of render.
    'use no memo';

    const context = useTradingFormContext<TradingExchangeType>();
    const { analytics, dispatch } = useServices(injectDesktopAnalytics, injectDispatch);

    const { tx, state: allowanceState } = useTradingAllowanceContext();

    const {
        watch,
        getValues,
        approveTransaction,
        revokeApproval,
        refreshQuotes,
        confirmApproval,
        isScheduledQuotesRefresh,
        isComposing,
        form: {
            state: { isFormLoading, isFormInvalid },
            helpers,
        },
    } = context;
    const selectedQuote = useSelector(selectTradingExchangeSelectedQuote);
    const account = useSelector(reduxState => selectTradingSendAccount(reduxState, 'exchange'));

    const { exchangeType, rateType } = watch();

    const getCryptoInfo = useTradingExchangeCryptoAndProviderInfo();

    const isDiscoveryRunning = useSelector(selectHasRunningDiscovery);
    const areFeesLoading = useSelector(state => selectAreFeesLoading(state, account?.symbol));

    const { handleClick: handleApproveClick, disabled: isApproveButtonLoading } =
        useAsyncClickHandler();
    const { handleClick: handleRevokeClick, disabled: isRevokeButtonLoading } =
        useAsyncClickHandler();
    const { handleClick: handleSwapClick, disabled: isSwapButtonLoading } = useAsyncClickHandler();
    const { handleClick: handleRefreshClick, disabled: isRefreshButtonLoading } =
        useAsyncClickHandler();

    const { cryptoIdToSymbolAndContractAddress } = useTradingUtils();

    const { approvalStep } = useApprovalStep({
        tx,
        currentTransactionType: allowanceState.transactionType,
        quoteStatus: selectedQuote?.status,
        refreshQuotes,
    });

    const onApproveTransactionClick = async () => {
        if (!selectedQuote || !requiresTokenApproval(selectedQuote)) {
            return;
        }

        analytics.report({
            type: events.tradeApprovalEvent.name,
            payload: {
                type: 'exchange-form',
                action: 'approve',
                ...getCryptoInfo(),
            },
        });

        allowanceState.setTransactionType('approve');

        await approveTransaction(selectedQuote);

        allowanceState.openApproveModal();
    };

    const onRevokeClick = async () => {
        if (!selectedQuote?.receiveAddress) {
            return;
        }

        analytics.report({
            type: events.tradeApprovalEvent.name,
            payload: {
                type: 'exchange-form',
                action: 'revoke',
                ...getCryptoInfo(),
            },
        });

        allowanceState.setTransactionType('revoke');

        await revokeApproval(selectedQuote);

        allowanceState.openRevokeModal();
    };

    const onProceedToSwapClick = async () => {
        if (!selectedQuote?.receiveAddress) {
            return;
        }

        analytics.report({
            type: events.tradeApprovalEvent.name,
            payload: {
                type: 'exchange-form',
                action: 'swap',
                ...getCryptoInfo(),
            },
        });

        const newTrade = await confirmApproval({
            trade: { ...selectedQuote, status: 'CONFIRM', approvalType: undefined },
            receiveAddress: selectedQuote.receiveAddress,
        });

        if (!newTrade || newTrade.status === 'ERROR') {
            return;
        }

        dispatch(tradingExchangeActions.saveFormValues(getValues()));
        dispatch(
            selectExchangeQuoteThunk({
                quote: selectedQuote,
                exchangeType,
                rateType,
                fractionButton: helpers.fractionButton,
            }),
        );
    };

    const onRefreshClick = async () => {
        analytics.report({
            type: events.tradeApprovalEvent.name,
            payload: {
                type: 'exchange-form',
                action: 'refresh',
                ...getCryptoInfo(),
            },
        });

        await refreshQuotes();
    };

    const isCommonButtonBusy =
        !account ||
        isFormLoading ||
        isFormInvalid ||
        areFeesLoading ||
        isComposing ||
        isScheduledQuotesRefresh ||
        isDiscoveryRunning ||
        allowanceState.isWaitingForDevice;

    const isActionButtonDisabled = (
        isButtonLoading: boolean,
        blockingTransactionType: AllowanceTransactionType,
    ) =>
        isButtonLoading ||
        (approvalStep === 'LOADING' &&
            allowanceState.transactionType === blockingTransactionType) ||
        isCommonButtonBusy;

    const isApproveButtonDisabled = isActionButtonDisabled(isApproveButtonLoading, 'revoke');
    const isSwapButtonDisabled = isActionButtonDisabled(isSwapButtonLoading, 'approve');
    const isRevokeButtonDisabled = isActionButtonDisabled(isRevokeButtonLoading, 'approve');

    const isRefreshButtonDisabled =
        isRefreshButtonLoading || isFormLoading || isScheduledQuotesRefresh || isDiscoveryRunning;

    const isApprovalTxPreApproved =
        selectedQuote?.preapprovedStringAmount && selectedQuote.preapprovedStringAmount !== '0';

    const { contractAddress } = cryptoIdToSymbolAndContractAddress(selectedQuote?.send);
    const isIncreasingAllowanceSupported = tokenSupportsIncreasingAllowance(contractAddress);

    return (
        <Column gap={16} alignItems="center">
            {approvalStep === 'REQUIRED' && (
                <>
                    {isApprovalTxPreApproved ? (
                        <>
                            {!isIncreasingAllowanceSupported ? (
                                <>
                                    <Button
                                        onClick={() => handleRevokeClick(onRevokeClick)}
                                        intent="brand"
                                        size="large"
                                        width="100%"
                                        isLoading={isRevokeButtonLoading}
                                        isDisabled={isRevokeButtonDisabled}
                                    >
                                        <Translation id="TR_EXCHANGE_APPROVAL_FORM_REVOKE_BUTTON" />
                                    </Button>

                                    <Banner
                                        intent="warning"
                                        icon={WarningIcon}
                                        description={
                                            <Translation id="TR_EXCHANGE_APPROVAL_FORM_REVOKE_BANNER" />
                                        }
                                    />
                                </>
                            ) : (
                                <>
                                    <Button
                                        onClick={() =>
                                            handleApproveClick(onApproveTransactionClick)
                                        }
                                        intent="brand"
                                        size="large"
                                        width="100%"
                                        isLoading={
                                            isApproveButtonLoading ||
                                            isRevokeButtonLoading ||
                                            isFormLoading ||
                                            areFeesLoading ||
                                            isComposing
                                        }
                                        isDisabled={
                                            isApproveButtonDisabled || isRevokeButtonDisabled
                                        }
                                    >
                                        <Translation id="TR_EXCHANGE_APPROVAL_FORM_INCREASE_BUTTON" />
                                    </Button>

                                    <TextButton
                                        onClick={() =>
                                            isRevokeButtonDisabled ||
                                            isRevokeButtonLoading ||
                                            isApproveButtonDisabled ||
                                            isApproveButtonLoading
                                                ? null
                                                : handleRevokeClick(onRevokeClick)
                                        }
                                        $disabled={
                                            isRevokeButtonDisabled || isApproveButtonDisabled
                                        }
                                    >
                                        <Translation id="TR_EXCHANGE_APPROVAL_FORM_REVOKE_BUTTON" />
                                    </TextButton>
                                </>
                            )}
                        </>
                    ) : (
                        <Button
                            data-testid="@trading/form/approve-button"
                            onClick={() => handleApproveClick(onApproveTransactionClick)}
                            intent="brand"
                            size="large"
                            width="100%"
                            isLoading={isApproveButtonLoading || areFeesLoading || isComposing}
                            isDisabled={isApproveButtonDisabled}
                        >
                            <Translation id="TR_EXCHANGE_APPROVAL_FORM_APPROVE_BUTTON" />
                        </Button>
                    )}
                </>
            )}

            {approvalStep === 'APPROVED' && (
                <>
                    <Button
                        onClick={() => handleSwapClick(onProceedToSwapClick)}
                        intent="brand"
                        size="large"
                        width="100%"
                        isLoading={
                            isSwapButtonLoading ||
                            isRevokeButtonLoading ||
                            isFormLoading ||
                            areFeesLoading ||
                            isComposing
                        }
                        isDisabled={isSwapButtonDisabled || isRevokeButtonDisabled}
                    >
                        <Translation id="TR_TRADING_SWAP" />
                    </Button>

                    <TextButton
                        onClick={() =>
                            isRevokeButtonDisabled ||
                            isRevokeButtonLoading ||
                            isSwapButtonDisabled ||
                            isSwapButtonLoading
                                ? null
                                : handleRevokeClick(onRevokeClick)
                        }
                        $disabled={isRevokeButtonDisabled || isSwapButtonDisabled}
                    >
                        <Translation id="TR_EXCHANGE_APPROVAL_FORM_REVOKE_BUTTON" />
                    </TextButton>
                </>
            )}

            {approvalStep === 'LOADING' && (
                <Button
                    data-testid="@trading/form/swap-button"
                    intent="brand"
                    size="large"
                    width="100%"
                    isDisabled={true}
                >
                    <Translation id="TR_TRADING_SWAP" />
                </Button>
            )}

            {(!approvalStep || approvalStep === 'ERROR') && (
                <Button
                    onClick={() => handleRefreshClick(onRefreshClick)}
                    intent="brand"
                    size="large"
                    width="100%"
                    isLoading={isRefreshButtonLoading}
                    isDisabled={isRefreshButtonDisabled}
                >
                    <Translation id="TR_EXCHANGE_APPROVAL_FORM_REFRESH_BUTTON" />
                </Button>
            )}

            {approvalStep === 'LOADING' && (
                <PendingTransactionInfo
                    title={
                        <Translation
                            id={
                                allowanceState.transactionType === 'approve'
                                    ? 'TR_EXCHANGE_APPROVAL_FORM_CONFIRMING_APPROVAL'
                                    : 'TR_EXCHANGE_APPROVAL_FORM_REVOKING_APPROVAL'
                            }
                        />
                    }
                    txidLabel={<Translation id="TR_EXCHANGE_APPROVAL_FORM_TRANSACTION_ID" />}
                    txidComponent={
                        tx.approvalTxid ? (
                            <Address
                                isTruncated
                                isChunked={false}
                                value={tx.approvalTxid}
                                intent="brand"
                                typographyStyle="body-md"
                                data-testid="@pending-transaction/txid/value"
                            />
                        ) : (
                            <Translation id="TR_UNKNOWN" />
                        )
                    }
                    onTxClick={
                        tx.approvalTxid && account
                            ? () =>
                                  dispatch(
                                      openModal({
                                          type: 'transaction-detail',
                                          txid: tx.approvalTxid!,
                                          descriptor: account.descriptor,
                                          symbol: account.symbol,
                                          deviceState: account.deviceState,
                                          flow: 'detail',
                                      }),
                                  )
                            : undefined
                    }
                />
            )}
        </Column>
    );
};
