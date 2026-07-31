import { useCallback, useMemo } from 'react';

import { type CryptoId, type DexApprovalType } from 'invity-api';

import { events, selectDesktopAnalyticsDep } from '@suite/analytics';
import { Calldata } from '@suite-common/calldata';
import { useServices } from '@suite-common/dependency-injection';
import {
    selectTradingExchangeSelectedQuote,
    selectTradingSendAccount,
    tradeApi,
} from '@suite-common/trading';

import { ApproveModal } from 'src/components/suite/modals/ReduxModal/UserContextModal/AllowanceModals/ApproveModal';
import { useSelector } from 'src/hooks/suite';
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
    const account = useSelector(reduxState => selectTradingSendAccount(reduxState, context.type));
    const { analytics } = useServices(selectDesktopAnalyticsDep);
    const getCryptoInfo = useTradingExchangeCryptoAndProviderInfo();
    const selectedQuote = useSelector(selectTradingExchangeSelectedQuote);

    const handleCancel = useCallback(async () => {
        analytics.report({
            type: events.tradeApprovalEvent.name,
            payload: {
                type: 'approve-modal',
                action: 'cancel',
                ...getCryptoInfo(),
            },
        });

        if (isTradingExchangeContext(context)) {
            context.setIsApproval(false);

            if (selectedQuote?.receiveAddress) {
                await context.confirmApproval({
                    trade: { ...selectedQuote, approvalType: undefined },
                    receiveAddress: selectedQuote.receiveAddress,
                });
            }
        }
    }, [analytics, getCryptoInfo, context, selectedQuote]);

    const onConfirm = useCallback(() => {
        analytics.report({
            type: events.tradeApprovalEvent.name,
            payload: {
                type: 'approve-modal',
                action: 'continue',
                ...getCryptoInfo(),
            },
        });
    }, [analytics, getCryptoInfo]);

    const onSelectApprovalType = useCallback(
        (approvalType: DexApprovalType) => {
            if (approvalType !== 'MINIMAL' && approvalType !== 'INFINITE') return;

            analytics.report({
                type: events.tradeApprovalEvent.name,
                payload: {
                    type: 'approve-modal',
                    action: approvalType === 'MINIMAL' ? 'limit-exact' : 'limit-unlimited',
                    ...getCryptoInfo(),
                },
            });
        },
        [analytics, getCryptoInfo],
    );

    const approveParams = useMemo(() => {
        if (!isTradingExchangeContext(context)) {
            return null;
        }

        const providersInfo = getProvidersInfoProps(context);
        const exchange = selectedQuote?.exchange;
        const provider = exchange ? providersInfo?.[exchange] : null;

        const approvalData = Calldata.evm.erc20.approve.decode(selectedQuote?.dexTx?.data);
        const spender = approvalData?.spender ?? null;
        const preapprovedAmount = selectedQuote?.preapprovedStringAmount;

        return provider && spender ? { provider, spender, preapprovedAmount } : null;
    }, [context, selectedQuote]);

    const { provider, spender, preapprovedAmount } =
        useModalLastValidParams(approveParams, state.isApproveModalOpen) ?? {};

    if (!state.isApproveModalOpen || !provider || !spender || !account) {
        return null;
    }

    const providerLogo = provider.logo ? tradeApi.getProviderLogoUrl(provider.logo) : undefined;

    return (
        <ApproveModal
            amount={amount}
            cryptoId={cryptoId}
            account={account}
            provider={{
                ...provider,
                logo: providerLogo,
                label: 'TR_TRADING_PROVIDER',
            }}
            spender={spender}
            preapprovedAmount={preapprovedAmount}
            heading="TR_APPROVAL_APPROVE_TOKEN_SPENDING"
            description="TR_EXCHANGE_APPROVAL_APPROVE_TOKEN_SPENDING_DESCRIPTION"
            onSelectApprovalType={onSelectApprovalType}
            onConfirm={onConfirm}
            onCancel={handleCancel}
        />
    );
};
