import { useCallback, useMemo } from 'react';

import { type CryptoId, type DexApprovalType } from 'invity-api';

import { events, selectDesktopAnalyticsDep } from '@suite/analytics';
import { Calldata } from '@suite-common/calldata';
import { useServices } from '@suite-common/dependency-injection';
import { useCurrentRef } from '@trezor/react-utils';

import { ApproveModal } from 'src/components/suite/modals/ReduxModal/UserContextModal/AllowanceModals/ApproveModal';
import { useAllowanceContext } from 'src/hooks/wallet/allowance';
import { useModalLastValidParams } from 'src/hooks/wallet/trading/form/useModalLastValidParams';
import { useTradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';
import { useTradingExchangeCryptoAndProviderInfo } from 'src/hooks/wallet/trading/form/useTradingExchangeCryptoAndProviderInfo';
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
    const { analytics } = useServices(selectDesktopAnalyticsDep);
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
        if (!isTradingExchangeContext(ctx)) return null;

        const providersInfo = getProvidersInfoProps(ctx);
        const exchange = selectedQuote?.exchange;
        const provider = exchange ? providersInfo?.[exchange] : null;

        const approvalData = Calldata.evm.erc20.approve.decode(selectedQuote?.dexTx?.data);
        const spender = approvalData?.spender ?? null;

        return provider && spender ? { provider, spender } : null;
    }, [selectedQuote, contextRef]);

    const { provider, spender } =
        useModalLastValidParams(approveParams, state.isApproveModalOpen) ?? {};

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
