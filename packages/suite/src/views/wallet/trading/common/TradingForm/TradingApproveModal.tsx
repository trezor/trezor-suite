import { type AllowanceLimitType } from '@suite-common/wallet-types';

import { ApproveModal } from 'src/components/wallet/Allowance/ApproveModal';
import { useTradingAllowanceModal } from 'src/hooks/wallet/trading/allowance/useTradingAllowanceModal';
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
    const {
        account,
        modalParams,
        reportAction,
        onConfirm,
        onSendStart,
        onSent,
        onSendFailed,
        onCancel,
    } = useTradingAllowanceModal({ type: 'approve', getCryptoInfo });

    if (!modalParams || !account) {
        return null;
    }

    const onSelectLimitType = (limitType: AllowanceLimitType) => {
        reportAction(LIMIT_TYPE_ANALYTICS_ACTION[limitType]);
    };

    return (
        <ApproveModal
            amount={amount}
            account={account}
            tokenContractAddress={modalParams.tokenContractAddress}
            provider={modalParams.provider}
            spender={modalParams.spender}
            preapprovedAmount={modalParams.preapprovedAmount}
            heading="TR_APPROVAL_APPROVE_TOKEN_SPENDING"
            description="TR_EXCHANGE_APPROVAL_APPROVE_TOKEN_SPENDING_DESCRIPTION"
            onSelectLimitType={onSelectLimitType}
            onConfirm={onConfirm}
            onSendStart={onSendStart}
            onSent={onSent}
            onSendFailed={onSendFailed}
            onCancel={onCancel}
        />
    );
};
