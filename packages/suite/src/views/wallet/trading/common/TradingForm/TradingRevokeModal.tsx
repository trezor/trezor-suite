import { useCallback, useMemo } from 'react';

import { type CryptoId } from 'invity-api';

import { events } from '@suite/analytics';
import { getEvmApprovalTxData } from '@suite-common/wallet-utils';

import { RevokeModal } from 'src/components/suite/modals/ReduxModal/UserContextModal/AllowanceModals/RevokeModal';
import { useAllowanceContext } from 'src/hooks/wallet/allowance';
import { useTradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';
import { useTradingExchangeCryptoAndProviderInfo } from 'src/hooks/wallet/trading/form/useTradingExchangeCryptoAndProviderInfo';
import { useAnalytics } from 'src/support/useAnalytics';
import {
    getProvidersInfoProps,
    isTradingExchangeContext,
} from 'src/utils/wallet/trading/tradingTypingUtils';

interface TradingRevokeModalProps {
    cryptoId: CryptoId;
}

export const TradingRevokeModal = ({ cryptoId }: TradingRevokeModalProps) => {
    const { state } = useAllowanceContext();
    const context = useTradingFormContext();
    const analytics = useAnalytics();
    const getCryptoInfo = useTradingExchangeCryptoAndProviderInfo();

    const handleCancel = useCallback(async () => {
        analytics.report({
            type: events.tradeApprovalEvent.name,
            payload: {
                type: 'revoke-modal',
                action: 'cancel',
                ...getCryptoInfo(),
            },
        });

        if (isTradingExchangeContext(context)) {
            context.setIsApproval(false);

            if (context.selectedQuote?.receiveAddress) {
                await context.confirmApproval({
                    trade: { ...context.selectedQuote, approvalType: undefined },
                    receiveAddress: context.selectedQuote.receiveAddress,
                });
            }
        }
    }, [analytics, getCryptoInfo, context]);

    const onConfirm = useCallback(() => {
        analytics.report({
            type: events.tradeApprovalEvent.name,
            payload: {
                type: 'revoke-modal',
                action: 'continue',
                ...getCryptoInfo(),
            },
        });
    }, [analytics, getCryptoInfo]);

    const revokeParams = useMemo(() => {
        if (!isTradingExchangeContext(context)) return null;

        const providersInfo = getProvidersInfoProps(context);
        const exchange = context.selectedQuote?.exchange;
        const provider = exchange ? providersInfo?.[exchange] : null;

        const dexTxData = context.selectedQuote?.dexTx?.data;
        const approvalData = getEvmApprovalTxData(dexTxData);
        const spender = approvalData?.spender ?? null;

        const preapprovedAmount = context.selectedQuote?.preapprovedStringAmount;

        return {
            provider,
            spender,
            preapprovedAmount,
        };
    }, [context]);

    const { provider, spender, preapprovedAmount } = revokeParams || {};

    if (!state.isRevokeModalOpen || !provider || !spender) return null;

    return (
        <RevokeModal
            cryptoId={cryptoId}
            account={context.account}
            provider={provider}
            spender={spender}
            preapprovedAmount={preapprovedAmount}
            onConfirm={onConfirm}
            onCancel={handleCancel}
        />
    );
};
