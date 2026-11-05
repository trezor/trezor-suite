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
import {
    type ExplorerState,
    selectExplorer,
    useAllowanceTxTracking,
} from '@suite-common/wallet-core';
import { findToken } from '@suite-common/wallet-utils';
import { useServices } from '@trezor/dependency-injection';
import { useCurrentRef } from '@trezor/react-utils';
import { injectDispatch } from '@trezor/redux-utils';

import { type AllowanceStepToken } from 'src/components/wallet/Allowance/AllowanceStepToken';
import { useExchangeApproval } from 'src/hooks/wallet/trading/form/exchange/useExchangeApproval';
import { getTradingExchangeCryptoInfo } from 'src/hooks/wallet/trading/form/useTradingExchangeCryptoAndProviderInfo';
import { getTradingAllowanceProvider } from 'src/utils/wallet/trading/tradingUtils';

export type TradingExchangeAllowanceToken = AllowanceStepToken & { name: string | undefined };

type ManageApprovalAction = Extract<
    EventInstance<typeof events.tradeApprovalEvent>['payload']['action'],
    'swap' | 'continue' | 'cancel'
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
    const explorer = useSelector((state: ExplorerState) => selectExplorer(state, account?.symbol));
    const [hasRevoked, setHasRevoked] = useState(false);

    const { allowance, allowanceKey, currentAllowance, refetchAllowance } =
        useTradingExchangeAllowance({ account });
    const { confirmApproval, revokeApproval } = useExchangeApproval({ account });
    const {
        approvalTxid: revokeTxid,
        status: revokeTxStatus,
        setApprovalTxid: setRevokeTxid,
    } = useAllowanceTxTracking({ accountKey: account?.key ?? null });

    const tokenContractAddress = quote?.send ? parseCryptoId(quote.send).contractAddress : null;
    const accountToken = findToken(account?.tokens, tokenContractAddress);
    const token: TradingExchangeAllowanceToken | undefined =
        account && accountToken?.symbol && tokenContractAddress
            ? {
                  networkSymbol: account.symbol,
                  contractAddress: tokenContractAddress,
                  symbol: getDisplaySymbol(accountToken.symbol, accountToken.contract),
                  decimals: accountToken.decimals,
                  name: accountToken.name,
              }
            : undefined;

    const isFlowMissing =
        !account ||
        !quote?.send ||
        quote.status === 'ERROR' ||
        !!quote.error ||
        !requiresTokenApproval(quote);
    // Without the token on the account or the provider there is nothing to show, so the swap form
    // takes over instead of an empty page.
    const isDataMissing = isFlowMissing || !token || !providerInfo;

    useEffect(() => {
        if (isDataMissing) {
            dispatch(gotoThunk({ routeName: 'wallet-trading-exchange', preserveParams: true }));
        }
    }, [isDataMissing, dispatch]);

    // The provider attaches approve calldata, and with it the spender, only to a quote that still
    // needs an approval. For a quote it already considers approved, ask it once for the revoke
    // transaction, which names the spender. The quote is handed back to the provider on leave.
    const isSpenderUnknown = !isFlowMissing && allowanceKey === undefined;
    const hasRequestedRevokeQuoteRef = useRef(false);
    const revokeApprovalRef = useCurrentRef(revokeApproval);

    useEffect(() => {
        if (!isSpenderUnknown || !quote || hasRequestedRevokeQuoteRef.current) {
            return;
        }

        hasRequestedRevokeQuoteRef.current = true;
        revokeApprovalRef.current(quote);
    }, [isSpenderUnknown, quote, revokeApprovalRef]);

    const restoreProviderQuote = () => {
        if (!hasRequestedRevokeQuoteRef.current || !quote?.receiveAddress) {
            return;
        }

        confirmApproval({
            trade: { ...quote, approvalType: undefined },
            receiveAddress: quote.receiveAddress,
        });
    };
    const restoreProviderQuoteRef = useCurrentRef(restoreProviderQuote);

    useEffect(
        () => () => {
            restoreProviderQuoteRef.current();
        },
        [restoreProviderQuoteRef],
    );

    const refetchAllowanceRef = useCurrentRef(refetchAllowance);
    const handledRevokeTxidRef = useRef<string>(undefined);

    useEffect(() => {
        if (!revokeTxid) {
            return;
        }

        if (revokeTxStatus.isFailed) {
            setRevokeTxid(null);

            return;
        }

        if (!revokeTxStatus.isConfirmed || handledRevokeTxidRef.current === revokeTxid) {
            return;
        }

        handledRevokeTxidRef.current = revokeTxid;
        setHasRevoked(true);
        setRevokeTxid(null);
        refetchAllowanceRef.current();
    }, [revokeTxid, revokeTxStatus, setRevokeTxid, refetchAllowanceRef]);

    const reportAction = (action: ManageApprovalAction) => {
        analytics.report({
            type: events.tradeApprovalEvent.name,
            payload: {
                type: 'manage-approval',
                action,
                ...getTradingExchangeCryptoInfo({
                    values: formValues ?? {},
                    quoteExchange: quote?.exchange,
                    exchangeProviders,
                }),
            },
        });
    };

    // Continues through the approval steps, which skip straight to the swap when the quote is
    // already confirmable. A quote borrowed from the provider only to learn the spender is handed
    // back first, so the steps start from the provider's own view of the approval.
    const continueSwap = async () => {
        reportAction('swap');

        if (!quote) {
            return;
        }

        let flowQuote = quote;

        if (hasRequestedRevokeQuoteRef.current && quote.receiveAddress) {
            hasRequestedRevokeQuoteRef.current = false;

            const restoredQuote = await confirmApproval({
                trade: { ...quote, approvalType: undefined },
                receiveAddress: quote.receiveAddress,
            });

            if (!restoredQuote || restoredQuote.status === 'ERROR') {
                return;
            }

            flowQuote = restoredQuote;
        }

        const chainAllowance =
            currentAllowance.source === 'chain' ? currentAllowance.amount : undefined;

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
        explorer,
        provider: providerInfo ? getTradingAllowanceProvider(providerInfo) : undefined,
        allowance,
        currentAllowance,
        revokeTxid,
        hasRevoked,
        onRevokeSent: setRevokeTxid,
        continueSwap,
        reportAction,
    };
};
