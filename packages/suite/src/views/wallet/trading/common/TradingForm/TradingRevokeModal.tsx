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
import { getErc20ApproveSpender } from '@suite-common/wallet-utils';
import { useServices } from '@trezor/dependency-injection';

import { RevokeModal } from 'src/components/wallet/Allowance/RevokeModal';
import { useTradingAllowanceContext } from 'src/hooks/wallet/trading/allowance/useTradingAllowanceContext';
import { useExchangeApproval } from 'src/hooks/wallet/trading/form/exchange/useExchangeApproval';
import { useModalLastValidParams } from 'src/hooks/wallet/trading/form/useModalLastValidParams';
import { type GetTradingExchangeCryptoInfo } from 'src/hooks/wallet/trading/form/useTradingExchangeCryptoAndProviderInfo';

type TradingRevokeModalProps = {
    getCryptoInfo: GetTradingExchangeCryptoInfo;
};

export const TradingRevokeModal = ({ getCryptoInfo }: TradingRevokeModalProps) => {
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
                type: 'revoke-modal',
                action: 'cancel',
                ...getCryptoInfo(),
            },
        });

        state.closeRevokeModal();

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
                type: 'revoke-modal',
                action: 'continue',
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
        state.closeRevokeModal();
    };

    const onSendFailed = () => {
        state.setIsWaitingForDevice(false);
    };

    const getRevokeParams = () => {
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
            approveAmount: selectedQuote.sendStringAmount,
            preapprovedAmount: selectedQuote.preapprovedStringAmount,
        };
    };

    const modalParams = useModalLastValidParams(getRevokeParams(), state.isRevokeModalOpen);

    if (!modalParams || !account) {
        return null;
    }

    const { provider, spender, tokenContractAddress, approveAmount, preapprovedAmount } =
        modalParams;
    const providerLogo = provider.logo ? tradeApi.getProviderLogoUrl(provider.logo) : undefined;

    return (
        <RevokeModal
            account={account}
            tokenContractAddress={tokenContractAddress}
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
            onSendStart={onSendStart}
            onSent={onSent}
            onSendFailed={onSendFailed}
            onCancel={handleCancel}
        />
    );
};
