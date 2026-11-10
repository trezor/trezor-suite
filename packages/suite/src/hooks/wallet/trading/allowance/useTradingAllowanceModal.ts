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
import { getErc20ApproveSpender } from '@suite-common/wallet-utils';
import { useServices } from '@trezor/dependency-injection';

import { type AllowanceProvider } from '../../../../components/wallet/Allowance/AllowanceProviderInfo';
import { useExchangeApproval } from '../form/exchange/useExchangeApproval';
import { useModalLastValidParams } from '../form/useModalLastValidParams';
import { type GetTradingExchangeCryptoInfo } from '../form/useTradingExchangeCryptoAndProviderInfo';

type TradeApprovalAction = EventInstance<typeof events.tradeApprovalEvent>['payload']['action'];

type TradingAllowanceModalParams = {
    provider: AllowanceProvider;
    spender: string;
    tokenContractAddress: string;
    preapprovedAmount?: string;
    approveAmount?: string;
};

type UseTradingAllowanceModalParams = {
    isOpen: boolean;
    onClose: () => void;
    getCryptoInfo: GetTradingExchangeCryptoInfo;
};

/**
 * The Trade revoke modal wiring: the send account, the modal params derived from the selected
 * DEX quote and analytics reporting.
 */
export const useTradingAllowanceModal = ({
    isOpen,
    onClose,
    getCryptoInfo,
}: UseTradingAllowanceModalParams) => {
    const { analytics } = useServices(injectDesktopAnalytics);
    const account = useSelector((reduxState: TradingFormAccountRootState) =>
        selectTradingSendAccount(reduxState, 'exchange'),
    );
    const selectedQuote = useSelector(selectTradingExchangeSelectedQuote);
    const providerInfo = useSelector((reduxState: TradingRootState) =>
        selectTradingProviderByNameAndTradeType(reduxState, selectedQuote?.exchange, 'exchange'),
    );
    const { confirmApproval } = useExchangeApproval({ account });

    const reportAction = (action: TradeApprovalAction) => {
        analytics.report({
            type: events.tradeApprovalEvent.name,
            payload: {
                type: 'revoke-modal',
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

    const onCancel = async () => {
        reportAction('cancel');
        onClose();

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
        onConfirm,
        onCancel,
    };
};
