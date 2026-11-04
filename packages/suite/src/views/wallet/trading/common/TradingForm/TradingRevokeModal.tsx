import { RevokeModal } from 'src/components/wallet/Allowance/RevokeModal';
import { useTradingAllowanceModal } from 'src/hooks/wallet/trading/allowance/useTradingAllowanceModal';
import { type GetTradingExchangeCryptoInfo } from 'src/hooks/wallet/trading/form/useTradingExchangeCryptoAndProviderInfo';

type TradingRevokeModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onSent: (txid: string) => void;
    getCryptoInfo: GetTradingExchangeCryptoInfo;
};

export const TradingRevokeModal = ({
    isOpen,
    onClose,
    onSent,
    getCryptoInfo,
}: TradingRevokeModalProps) => {
    const { account, modalParams, onConfirm, onCancel } = useTradingAllowanceModal({
        isOpen,
        onClose,
        getCryptoInfo,
    });

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
            onSent={onSent}
            onCancel={onCancel}
        />
    );
};
