import { useCallback, useMemo } from 'react';

import { type CryptoId } from 'invity-api';

import { events, selectDesktopAnalyticsDep } from '@suite/analytics';
import { Calldata } from '@suite-common/calldata';
import { useServices } from '@suite-common/dependency-injection';
import {
    selectTradingExchangeProviders,
    selectTradingExchangeSelectedQuote,
    selectTradingSendAccount,
    tradeApi,
} from '@suite-common/trading';

import { RevokeModal } from 'src/components/suite/modals/ReduxModal/UserContextModal/AllowanceModals/RevokeModal';
import { useSelector } from 'src/hooks/suite';
import { useAllowanceContext } from 'src/hooks/wallet/allowance';
import { useModalLastValidParams } from 'src/hooks/wallet/trading/form/useModalLastValidParams';
import { useTradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';
import { useTradingExchangeCryptoAndProviderInfo } from 'src/hooks/wallet/trading/form/useTradingExchangeCryptoAndProviderInfo';
import { isTradingExchangeContext } from 'src/utils/wallet/trading/tradingTypingUtils';

interface TradingRevokeModalProps {
    cryptoId: CryptoId;
}

export const TradingRevokeModal = ({ cryptoId }: TradingRevokeModalProps) => {
    const { state } = useAllowanceContext();
    const context = useTradingFormContext();
    const account = useSelector(reduxState => selectTradingSendAccount(reduxState, context.type));
    const { analytics } = useServices(selectDesktopAnalyticsDep);
    const getCryptoInfo = useTradingExchangeCryptoAndProviderInfo();
    const selectedQuote = useSelector(selectTradingExchangeSelectedQuote);
    const providersInfo = useSelector(selectTradingExchangeProviders);

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
                type: 'revoke-modal',
                action: 'continue',
                ...getCryptoInfo(),
            },
        });
    }, [analytics, getCryptoInfo]);

    const revokeParams = useMemo(() => {
        if (!isTradingExchangeContext(context)) {
            return null;
        }

        const exchange = selectedQuote?.exchange;
        const provider = exchange ? providersInfo?.[exchange] : null;

        const dexTxData = selectedQuote?.dexTx?.data;
        const approvalData = Calldata.evm.erc20.approve.decode(dexTxData);
        const spender = approvalData?.spender ?? null;

        const preapprovedAmount = selectedQuote?.preapprovedStringAmount;
        const approveAmount = selectedQuote?.sendStringAmount;

        return provider && spender ? { provider, spender, preapprovedAmount, approveAmount } : null;
    }, [context, providersInfo, selectedQuote]);

    const { provider, spender, preapprovedAmount, approveAmount } =
        useModalLastValidParams(revokeParams, state.isRevokeModalOpen) ?? {};

    if (!state.isRevokeModalOpen || !provider || !spender || !account) {
        return null;
    }

    const providerLogo = provider.logo ? tradeApi.getProviderLogoUrl(provider.logo) : undefined;

    return (
        <RevokeModal
            cryptoId={cryptoId}
            account={account}
            provider={{
                ...provider,
                logo: providerLogo,
                label: 'TR_TRADING_PROVIDER',
            }}
            spender={spender}
            preapprovedAmount={preapprovedAmount}
            approveAmount={approveAmount}
            followedByApproval
            heading="TR_APPROVAL_REVOKE_TOKEN_SPENDING"
            description="TR_EXCHANGE_APPROVAL_REVOKE_TOKEN_SPENDING_DESCRIPTION"
            onConfirm={onConfirm}
            onCancel={handleCancel}
        />
    );
};
