import { RevokeModal } from 'src/components/wallet/Allowance/RevokeModal';
import { useTradingAllowanceModal } from 'src/hooks/wallet/trading/allowance/useTradingAllowanceModal';
import { type GetTradingExchangeCryptoInfo } from 'src/hooks/wallet/trading/form/useTradingExchangeCryptoAndProviderInfo';

type TradingRevokeModalProps = {
    getCryptoInfo: GetTradingExchangeCryptoInfo;
};

export const TradingRevokeModal = ({ getCryptoInfo }: TradingRevokeModalProps) => {
    const { account, modalParams, onConfirm, onSendStart, onSent, onSendFailed, onCancel } =
        useTradingAllowanceModal({ type: 'revoke', getCryptoInfo });

    if (!modalParams || !account) {
        return null;
    }

    return (
        <RevokeModal
            account={account}
            tokenContractAddress={modalParams.tokenContractAddress}
            provider={modalParams.provider}
            spender={modalParams.spender}
            preapprovedAmount={modalParams.preapprovedAmount}
            approveAmount={modalParams.approveAmount}
            followedByApproval
            heading="TR_APPROVAL_REVOKE_TOKEN_SPENDING"
            description="TR_EXCHANGE_APPROVAL_REVOKE_TOKEN_SPENDING_DESCRIPTION"
            onConfirm={onConfirm}
            onSendStart={onSendStart}
            onSent={onSent}
            onSendFailed={onSendFailed}
            onCancel={onCancel}
        />
    );
};
