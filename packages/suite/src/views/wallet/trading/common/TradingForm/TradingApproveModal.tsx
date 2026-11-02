import { useCallback, useMemo } from 'react';

import { type CryptoId } from 'invity-api';

import { events, injectDesktopAnalytics } from '@suite/analytics';
import {
    parseCryptoId,
    selectTradingExchangeProviders,
    selectTradingExchangeSelectedQuote,
    selectTradingSendAccount,
    tradeApi,
} from '@suite-common/trading';
import { type AllowanceLimitType } from '@suite-common/wallet-types';
import { getErc20ApproveSpender } from '@suite-common/wallet-utils';
import { useServices } from '@trezor/dependency-injection';

import { ApproveModal } from 'src/components/wallet/Allowance/ApproveModal';
import { useSelector } from 'src/hooks/suite';
import { useTradingAllowanceContext } from 'src/hooks/wallet/trading/allowance/useTradingAllowanceContext';
import { useModalLastValidParams } from 'src/hooks/wallet/trading/form/useModalLastValidParams';
import { useTradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';
import { useTradingExchangeCryptoAndProviderInfo } from 'src/hooks/wallet/trading/form/useTradingExchangeCryptoAndProviderInfo';
import { isTradingExchangeContext } from 'src/utils/wallet/trading/tradingTypingUtils';

type TradingApproveModalProps = {
    amount: string;
    cryptoId: CryptoId;
};

const LIMIT_TYPE_ANALYTICS_ACTION = {
    minimal: 'limit-exact',
    unlimited: 'limit-unlimited',
} as const satisfies Record<AllowanceLimitType, 'limit-exact' | 'limit-unlimited'>;

export const TradingApproveModal = ({ amount, cryptoId }: TradingApproveModalProps) => {
    const { state, tx } = useTradingAllowanceContext();
    const context = useTradingFormContext();
    const account = useSelector(reduxState => selectTradingSendAccount(reduxState, context.type));
    const { analytics } = useServices(injectDesktopAnalytics);
    const getCryptoInfo = useTradingExchangeCryptoAndProviderInfo();
    const selectedQuote = useSelector(selectTradingExchangeSelectedQuote);
    const providersInfo = useSelector(selectTradingExchangeProviders);

    const handleCancel = useCallback(async () => {
        analytics.report({
            type: events.tradeApprovalEvent.name,
            payload: {
                type: 'approve-modal',
                action: 'cancel',
                ...getCryptoInfo(),
            },
        });

        state.closeApproveModal();

        if (isTradingExchangeContext(context) && selectedQuote?.receiveAddress) {
            await context.confirmApproval({
                trade: { ...selectedQuote, approvalType: undefined },
                receiveAddress: selectedQuote.receiveAddress,
            });
        }
    }, [analytics, getCryptoInfo, state, context, selectedQuote]);

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

    const onSelectLimitType = useCallback(
        (limitType: AllowanceLimitType) => {
            analytics.report({
                type: events.tradeApprovalEvent.name,
                payload: {
                    type: 'approve-modal',
                    action: LIMIT_TYPE_ANALYTICS_ACTION[limitType],
                    ...getCryptoInfo(),
                },
            });
        },
        [analytics, getCryptoInfo],
    );

    const onSendStart = useCallback(() => {
        state.setIsWaitingForDevice(true);
    }, [state]);

    const onSent = useCallback(
        (txid: string) => {
            tx.setApprovalTxid(txid);
            state.setIsWaitingForDevice(false);
            state.closeApproveModal();
        },
        [tx, state],
    );

    const onSendFailed = useCallback(() => {
        state.setIsWaitingForDevice(false);
    }, [state]);

    const approveParams = useMemo(() => {
        if (!isTradingExchangeContext(context)) {
            return null;
        }

        const exchange = selectedQuote?.exchange;
        const provider = exchange ? providersInfo?.[exchange] : null;

        const spender = getErc20ApproveSpender(selectedQuote?.dexTx?.data) ?? null;
        const preapprovedAmount = selectedQuote?.preapprovedStringAmount;

        return provider && spender ? { provider, spender, preapprovedAmount } : null;
    }, [context, providersInfo, selectedQuote]);

    const { provider, spender, preapprovedAmount } =
        useModalLastValidParams(approveParams, state.isApproveModalOpen) ?? {};

    if (!state.isApproveModalOpen || !provider || !spender || !account) {
        return null;
    }

    const providerLogo = provider.logo ? tradeApi.getProviderLogoUrl(provider.logo) : undefined;
    const { contractAddress: tokenContractAddress = '' } = parseCryptoId(cryptoId);

    return (
        <ApproveModal
            amount={amount}
            account={account}
            tokenContractAddress={tokenContractAddress}
            provider={{
                ...provider,
                logo: providerLogo,
                label: 'TR_TRADING_PROVIDER',
            }}
            spender={spender}
            preapprovedAmount={preapprovedAmount}
            heading="TR_APPROVAL_APPROVE_TOKEN_SPENDING"
            description="TR_EXCHANGE_APPROVAL_APPROVE_TOKEN_SPENDING_DESCRIPTION"
            onSelectLimitType={onSelectLimitType}
            onConfirm={onConfirm}
            onSendStart={onSendStart}
            onSent={onSent}
            onSendFailed={onSendFailed}
            onCancel={handleCancel}
        />
    );
};
