import { useSelector } from 'react-redux';

import { events, injectDesktopAnalytics } from '@suite/analytics';
import { type EventInstance } from '@suite-common/analytics';
import {
    type TradingFormAccountRootState,
    type TradingRootState,
    parseCryptoId,
    selectTradingExchangeSelectedQuote,
    selectTradingProviderByNameAndTradeType,
    selectTradingSendAccount,
    tradeApi,
} from '@suite-common/trading';
import { type AllowanceTransactionType } from '@suite-common/wallet-types';
import { getErc20ApproveSpender } from '@suite-common/wallet-utils';
import { useServices } from '@trezor/dependency-injection';

import { type AllowanceProvider } from 'src/components/wallet/Allowance/AllowanceProviderInfo';
import { useExchangeApproval } from 'src/hooks/wallet/trading/form/exchange/useExchangeApproval';
import { useModalLastValidParams } from 'src/hooks/wallet/trading/form/useModalLastValidParams';
import { type GetTradingExchangeCryptoInfo } from 'src/hooks/wallet/trading/form/useTradingExchangeCryptoAndProviderInfo';

import { useTradingAllowanceContext } from './useTradingAllowanceContext';

type TradeApprovalAction = EventInstance<typeof events.tradeApprovalEvent>['payload']['action'];

type TradingAllowanceModalParams = {
    provider: AllowanceProvider;
    spender: string;
    tokenContractAddress: string;
    preapprovedAmount?: string;
    approveAmount?: string;
};

type UseTradingAllowanceModalParams = {
    type: AllowanceTransactionType;
    getCryptoInfo: GetTradingExchangeCryptoInfo;
};

/**
 * Everything the Trade approve and revoke modals share: the send account, the modal params
 * derived from the selected DEX quote, analytics reporting and the allowance context wiring.
 */
export const useTradingAllowanceModal = ({
    type,
    getCryptoInfo,
}: UseTradingAllowanceModalParams) => {
    const { state, tx } = useTradingAllowanceContext();
    const { analytics } = useServices(injectDesktopAnalytics);
    const account = useSelector((reduxState: TradingFormAccountRootState) =>
        selectTradingSendAccount(reduxState, 'exchange'),
    );
    const selectedQuote = useSelector(selectTradingExchangeSelectedQuote);
    const providerInfo = useSelector((reduxState: TradingRootState) =>
        selectTradingProviderByNameAndTradeType(reduxState, selectedQuote?.exchange, 'exchange'),
    );
    const { confirmApproval } = useExchangeApproval({ account });

    const isOpen = type === 'approve' ? state.isApproveModalOpen : state.isRevokeModalOpen;
    const closeModal = type === 'approve' ? state.closeApproveModal : state.closeRevokeModal;

    const reportAction = (action: TradeApprovalAction) => {
        analytics.report({
            type: events.tradeApprovalEvent.name,
            payload: {
                type: `${type}-modal`,
                action,
                ...getCryptoInfo(),
            },
        });
    };

    const getModalParams = (): TradingAllowanceModalParams | null => {
        if (!selectedQuote?.send) {
            return null;
        }

        const spender = getErc20ApproveSpender(selectedQuote.dexTx?.data);
        const { contractAddress: tokenContractAddress } = parseCryptoId(selectedQuote.send);

        if (!providerInfo || !spender || !tokenContractAddress) {
            return null;
        }

        return {
            provider: {
                ...providerInfo,
                logo: providerInfo.logo
                    ? tradeApi.getProviderLogoUrl(providerInfo.logo)
                    : undefined,
                label: 'TR_TRADING_PROVIDER',
            },
            spender,
            tokenContractAddress,
            preapprovedAmount: selectedQuote.preapprovedStringAmount,
            approveAmount: selectedQuote.sendStringAmount,
        };
    };

    const modalParams = useModalLastValidParams(getModalParams(), isOpen);

    const onConfirm = () => {
        reportAction('continue');
    };

    const onSendStart = () => {
        state.setIsWaitingForDevice(true);
    };

    const onSent = (txid: string) => {
        tx.setApprovalTxid(txid);
        state.setIsWaitingForDevice(false);
        closeModal();
    };

    const onSendFailed = () => {
        state.setIsWaitingForDevice(false);
    };

    const onCancel = async () => {
        reportAction('cancel');
        closeModal();

        if (selectedQuote?.receiveAddress) {
            await confirmApproval({
                trade: { ...selectedQuote, approvalType: undefined },
                receiveAddress: selectedQuote.receiveAddress,
            });
        }
    };

    return {
        account,
        modalParams,
        reportAction,
        onConfirm,
        onSendStart,
        onSent,
        onSendFailed,
        onCancel,
    };
};
