import { useSelector } from 'react-redux';

import { events, injectDesktopAnalytics } from '@suite/analytics';
import {
    type TradingFormAccountRootState,
    type TradingRootState,
    parseCryptoId,
    selectTradingExchangeSelectedQuote,
    selectTradingProviderByNameAndTradeType,
    selectTradingSendAccount,
    tradeApi,
} from '@suite-common/trading';
import { type AllowanceLimitType } from '@suite-common/wallet-types';
import { getErc20ApproveSpender } from '@suite-common/wallet-utils';
import { useServices } from '@trezor/dependency-injection';

import { ApproveModal } from 'src/components/wallet/Allowance/ApproveModal';
import { useTradingAllowanceContext } from 'src/hooks/wallet/trading/allowance/useTradingAllowanceContext';
import { useExchangeApproval } from 'src/hooks/wallet/trading/form/exchange/useExchangeApproval';
import { useModalLastValidParams } from 'src/hooks/wallet/trading/form/useModalLastValidParams';
import { type GetTradingExchangeCryptoInfo } from 'src/hooks/wallet/trading/form/useTradingExchangeCryptoAndProviderInfo';

const LIMIT_TYPE_ANALYTICS_ACTION = {
    minimal: 'limit-exact',
    unlimited: 'limit-unlimited',
} as const satisfies Record<AllowanceLimitType, 'limit-exact' | 'limit-unlimited'>;

type TradingApproveModalProps = {
    amount: string;
    getCryptoInfo: GetTradingExchangeCryptoInfo;
};

export const TradingApproveModal = ({ amount, getCryptoInfo }: TradingApproveModalProps) => {
    const { state, tx } = useTradingAllowanceContext();
    const account = useSelector((reduxState: TradingFormAccountRootState) =>
        selectTradingSendAccount(reduxState, 'exchange'),
    );
    const { analytics } = useServices(injectDesktopAnalytics);
    const selectedQuote = useSelector(selectTradingExchangeSelectedQuote);
    const providerInfo = useSelector((reduxState: TradingRootState) =>
        selectTradingProviderByNameAndTradeType(reduxState, selectedQuote?.exchange, 'exchange'),
    );
    const { confirmApproval } = useExchangeApproval({ account });

    const handleCancel = async () => {
        analytics.report({
            type: events.tradeApprovalEvent.name,
            payload: {
                type: 'approve-modal',
                action: 'cancel',
                ...getCryptoInfo(),
            },
        });

        state.closeApproveModal();

        if (selectedQuote?.receiveAddress) {
            await confirmApproval({
                trade: { ...selectedQuote, approvalType: undefined },
                receiveAddress: selectedQuote.receiveAddress,
            });
        }
    };

    const onConfirm = () => {
        analytics.report({
            type: events.tradeApprovalEvent.name,
            payload: {
                type: 'approve-modal',
                action: 'continue',
                ...getCryptoInfo(),
            },
        });
    };

    const onSelectLimitType = (limitType: AllowanceLimitType) => {
        analytics.report({
            type: events.tradeApprovalEvent.name,
            payload: {
                type: 'approve-modal',
                action: LIMIT_TYPE_ANALYTICS_ACTION[limitType],
                ...getCryptoInfo(),
            },
        });
    };

    const onSendStart = () => {
        state.setIsWaitingForDevice(true);
    };

    const onSent = (txid: string) => {
        tx.setApprovalTxid(txid);
        state.setIsWaitingForDevice(false);
        state.closeApproveModal();
    };

    const onSendFailed = () => {
        state.setIsWaitingForDevice(false);
    };

    const getApproveParams = () => {
        if (!selectedQuote?.send) {
            return null;
        }

        const spender = getErc20ApproveSpender(selectedQuote.dexTx?.data);
        const { contractAddress: tokenContractAddress } = parseCryptoId(selectedQuote.send);

        if (!providerInfo || !spender || !tokenContractAddress) {
            return null;
        }

        return {
            provider: providerInfo,
            spender,
            tokenContractAddress,
            preapprovedAmount: selectedQuote.preapprovedStringAmount,
        };
    };

    const modalParams = useModalLastValidParams(getApproveParams(), state.isApproveModalOpen);

    if (!modalParams || !account) {
        return null;
    }

    const { provider, spender, tokenContractAddress, preapprovedAmount } = modalParams;
    const providerLogo = provider.logo ? tradeApi.getProviderLogoUrl(provider.logo) : undefined;

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
