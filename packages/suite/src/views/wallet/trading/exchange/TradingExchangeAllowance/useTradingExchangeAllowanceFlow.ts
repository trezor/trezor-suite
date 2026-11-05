import { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';

import { events, injectDesktopAnalytics } from '@suite/analytics';
import { gotoThunk } from '@suite/router';
import { type EventInstance } from '@suite-common/analytics';
import {
    type TradingFormAccountRootState,
    type TradingRootState,
    getApprovalFlowSteps,
    parseCryptoId,
    requiresTokenApproval,
    selectTradingExchangeFormValues,
    selectTradingExchangeProviders,
    selectTradingExchangeSelectedQuote,
    selectTradingProviderByNameAndTradeType,
    selectTradingSendAccount,
    tradingExchangeActions,
    useTradingExchangeAllowance,
} from '@suite-common/trading';
import { getDisplaySymbol } from '@suite-common/wallet-config';
import { useAllowanceTxTracking } from '@suite-common/wallet-core';
import { type FeeLevelLabel } from '@suite-common/wallet-types';
import { findToken } from '@suite-common/wallet-utils';
import { useServices } from '@trezor/dependency-injection';
import { useCurrentRef } from '@trezor/react-utils';
import { injectDispatch } from '@trezor/redux-utils';

import { type AllowanceStepToken } from '#src/components/wallet/Allowance/AllowanceStepToken';
import { useExchangeApproval } from '#src/hooks/wallet/trading/form/exchange/useExchangeApproval';
import { getTradingExchangeCryptoInfo } from '#src/hooks/wallet/trading/form/useTradingExchangeCryptoAndProviderInfo';
import { getTradingAllowanceProvider } from '#src/utils/wallet/trading/tradingUtils';

type ManageApprovalAction = Extract<
    EventInstance<typeof events.tradeApprovalEvent>['payload']['action'],
    'swap' | 'continue' | 'fee-change'
>;

export const useTradingExchangeAllowanceFlow = () => {
    const { analytics, dispatch } = useServices(injectDesktopAnalytics, injectDispatch);
    const account = useSelector((state: TradingFormAccountRootState) =>
        selectTradingSendAccount(state, 'exchange'),
    );
    const quote = useSelector(selectTradingExchangeSelectedQuote);
    const providerInfo = useSelector((state: TradingRootState) =>
        selectTradingProviderByNameAndTradeType(state, quote?.exchange, 'exchange'),
    );
    const formValues = useSelector(selectTradingExchangeFormValues);
    const exchangeProviders = useSelector(selectTradingExchangeProviders);
    const [hasRevoked, setHasRevoked] = useState(false);

    const { allowanceKey, currentAllowance, chainAllowance, isFirstReadRunning, refetchAllowance } =
        useTradingExchangeAllowance({ account });
    const { confirmApproval, revokeApproval } = useExchangeApproval({ account });
    const {
        approvalTxid: revokeTxid,
        status: revokeTxStatus,
        setApprovalTxid: setRevokeTxid,
    } = useAllowanceTxTracking({ accountKey: account?.key ?? null });

    const tokenContractAddress = quote?.send ? parseCryptoId(quote.send).contractAddress : null;
    const accountToken = findToken(account?.tokens, tokenContractAddress);
    const token: AllowanceStepToken | undefined =
        account && accountToken?.symbol && tokenContractAddress
            ? {
                  networkSymbol: account.symbol,
                  contractAddress: tokenContractAddress,
                  symbol: getDisplaySymbol(accountToken.symbol, accountToken.contract),
                  decimals: accountToken.decimals,
              }
            : undefined;

    const isFlowMissing =
        !account ||
        !quote?.send ||
        quote.status === 'ERROR' ||
        !!quote.error ||
        !requiresTokenApproval(quote);

    const isDataMissing = isFlowMissing || !token || !providerInfo;

    useEffect(() => {
        if (isDataMissing) {
            dispatch(gotoThunk({ routeName: 'wallet-trading-exchange', preserveParams: true }));
        }
    }, [isDataMissing, dispatch]);

    const isSpenderUnknown = !isFlowMissing && allowanceKey === undefined;
    const hasRequestedRevokeQuoteRef = useRef(false);
    const isUnmountedRef = useRef(false);
    const revokeApprovalRef = useCurrentRef(revokeApproval);

    useEffect(() => {
        if (!isSpenderUnknown || !quote || hasRequestedRevokeQuoteRef.current) {
            return;
        }

        hasRequestedRevokeQuoteRef.current = true;

        const borrowRevokeQuote = async () => {
            const isBorrowed = await revokeApprovalRef.current(quote);

            if (!isBorrowed && !isUnmountedRef.current) {
                dispatch(gotoThunk({ routeName: 'wallet-trading-exchange', preserveParams: true }));
            }
        };

        borrowRevokeQuote();
    }, [isSpenderUnknown, quote, revokeApprovalRef, dispatch]);

    const handBackProviderQuote = () =>
        quote?.receiveAddress
            ? confirmApproval({
                  trade: { ...quote, approvalType: undefined },
                  receiveAddress: quote.receiveAddress,
              })
            : Promise.resolve(undefined);

    const restoreProviderQuote = () => {
        if (hasRequestedRevokeQuoteRef.current) {
            handBackProviderQuote();
        }
    };
    const restoreProviderQuoteRef = useCurrentRef(restoreProviderQuote);

    useEffect(
        () => () => {
            isUnmountedRef.current = true;
            restoreProviderQuoteRef.current();
        },
        [restoreProviderQuoteRef],
    );

    const refetchAllowanceRef = useCurrentRef(refetchAllowance);

    useEffect(() => {
        if (!revokeTxid) {
            return;
        }

        if (revokeTxStatus.isFailed) {
            setRevokeTxid(null);

            return;
        }

        if (!revokeTxStatus.isConfirmed) {
            return;
        }

        setHasRevoked(true);
        setRevokeTxid(null);
        refetchAllowanceRef.current();
    }, [revokeTxid, revokeTxStatus, setRevokeTxid, refetchAllowanceRef]);

    const reportAction = (action: ManageApprovalAction, selectedFee?: FeeLevelLabel) => {
        const cryptoInfo = getTradingExchangeCryptoInfo({
            values: formValues ?? {},
            quoteExchange: quote?.exchange,
            exchangeProviders,
        });

        analytics.report({
            type: events.tradeApprovalEvent.name,
            payload: {
                type: 'manage-approval',
                action,
                ...cryptoInfo,
                selectedFee: selectedFee ?? cryptoInfo.selectedFee,
            },
        });
    };

    const continueSwap = async () => {
        reportAction('swap');

        if (!quote) {
            return;
        }

        let flowQuote = quote;

        if (hasRequestedRevokeQuoteRef.current) {
            const restoredQuote = await handBackProviderQuote();

            if (!restoredQuote || restoredQuote.status === 'ERROR') {
                return;
            }

            hasRequestedRevokeQuoteRef.current = false;
            flowQuote = restoredQuote;
        }

        dispatch(
            tradingExchangeActions.startApprovalFlow(
                getApprovalFlowSteps(flowQuote, chainAllowance),
            ),
        );
        dispatch(gotoThunk({ routeName: 'wallet-trading-exchange-approval' }));
    };

    return {
        isDataMissing,
        account,
        quote,
        token,
        spender: allowanceKey?.spender,
        provider: providerInfo ? getTradingAllowanceProvider(providerInfo) : undefined,
        currentAllowance,
        isFirstReadRunning,
        revokeTxid,
        hasRevoked,
        onRevokeSent: setRevokeTxid,
        continueSwap,
        reportAction,
    };
};
