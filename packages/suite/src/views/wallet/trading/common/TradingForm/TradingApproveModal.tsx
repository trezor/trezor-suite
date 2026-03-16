import { useCallback, useMemo } from 'react';

import { type CryptoId, type DexApprovalType } from 'invity-api';

import { events } from '@suite/analytics';
import { getEvmApprovalTxData } from '@suite-common/wallet-utils';
import { useCurrentRef } from '@trezor/react-utils';

import { ApproveModal } from 'src/components/suite/modals/ReduxModal/UserContextModal/AllowanceModals/ApproveModal';
import { useAllowanceContext } from 'src/hooks/wallet/allowance';
import { useTradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';
import { useTradingExchangeCryptoAndProviderInfo } from 'src/hooks/wallet/trading/form/useTradingExchangeCryptoAndProviderInfo';
import { useAnalytics } from 'src/support/useAnalytics';
import {
    getProvidersInfoProps,
    isTradingExchangeContext,
} from 'src/utils/wallet/trading/tradingTypingUtils';

interface TradingApproveModalProps {
    amount: string;
    cryptoId: CryptoId;
}

export const TradingApproveModal = ({ amount, cryptoId }: TradingApproveModalProps) => {
    const { state } = useAllowanceContext();
    const context = useTradingFormContext();
    const analytics = useAnalytics();
    const getCryptoInfo = useTradingExchangeCryptoAndProviderInfo();

    const contextRef = useCurrentRef(context);
    const getCryptoInfoRef = useCurrentRef(getCryptoInfo);

    const handleCancel = useCallback(async () => {
        analytics.report({
            type: events.tradeApprovalEvent.name,
            payload: {
                type: 'approve-modal',
                action: 'cancel',
                ...getCryptoInfoRef.current(),
            },
        });

        const ctx = contextRef.current;
        if (isTradingExchangeContext(ctx)) {
            ctx.setIsApproval(false);

            if (ctx.selectedQuote?.receiveAddress) {
                await ctx.confirmApproval({
                    trade: { ...ctx.selectedQuote, approvalType: undefined },
                    receiveAddress: ctx.selectedQuote.receiveAddress,
                });
            }
        }
    }, [analytics, getCryptoInfoRef, contextRef]);

    const onConfirm = useCallback(() => {
        analytics.report({
            type: events.tradeApprovalEvent.name,
            payload: {
                type: 'approve-modal',
                action: 'continue',
                ...getCryptoInfoRef.current(),
            },
        });
    }, [analytics, getCryptoInfoRef]);

    const onSelectApprovalType = useCallback(
        (approvalType: DexApprovalType) => {
            if (approvalType !== 'MINIMAL' && approvalType !== 'INFINITE') return;

            analytics.report({
                type: events.tradeApprovalEvent.name,
                payload: {
                    type: 'approve-modal',
                    action: approvalType === 'MINIMAL' ? 'limit-exact' : 'limit-unlimited',
                    ...getCryptoInfoRef.current(),
                },
            });
        },
        [analytics, getCryptoInfoRef],
    );

    const selectedQuote = isTradingExchangeContext(context) ? context.selectedQuote : undefined;

    const approveParams = useMemo(() => {
        const ctx = contextRef.current;
        if (!isTradingExchangeContext(ctx)) {
            return null;
        }

        const providersInfo = getProvidersInfoProps(ctx);
        const exchange = selectedQuote?.exchange;
        const provider = exchange ? providersInfo?.[exchange] : null;

        const approvalData = getEvmApprovalTxData(selectedQuote?.dexTx?.data);
        const spender = approvalData?.spender ?? null;

        return {
            provider,
            spender,
        };
    }, [selectedQuote, contextRef]);

    const { provider, spender } = approveParams ?? {};

    if (!state.isApproveModalOpen || !provider || !spender) return null;

    return (
        <ApproveModal
            amount={amount}
            cryptoId={cryptoId}
            account={context.account}
            provider={provider}
            spender={spender}
            onSelectApprovalType={onSelectApprovalType}
            onConfirm={onConfirm}
            onCancel={handleCancel}
        />
    );
};
