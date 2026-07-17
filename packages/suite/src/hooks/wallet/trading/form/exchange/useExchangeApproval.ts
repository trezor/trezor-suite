import { type DexApprovalType, type ExchangeTrade } from 'invity-api';

import { exchangeThunks, tradingExchangeActions, tradingThunks } from '@suite-common/trading';
import { type Account } from '@suite-common/wallet-types';

import { useDispatch } from 'src/hooks/suite';
import { useTradingExchangeTradeRequest } from 'src/hooks/wallet/trading/form/common/useTradingExchangeTradeRequest';
import { type Dispatch } from 'src/types/suite';

interface UseExchangeApprovalProps {
    account: Account;
    receiveAddress?: string;
    extraField?: string;
}

/**
 * Device-touching exchange trade actions that are not quote-refresh: address
 * verification and the DEX approval flow (confirm / approve / revoke).
 */
export const useExchangeApproval = ({
    account,
    receiveAddress,
    extraField,
}: UseExchangeApprovalProps) => {
    const dispatch = useDispatch();
    const { getTradeRequestParams } = useTradingExchangeTradeRequest(account);

    const verifyAddress =
        (verifiedAccount: Account, address: string | undefined, path: string | undefined) =>
        async (innerDispatch: Dispatch) => {
            await innerDispatch(
                tradingThunks.verifyAddressThunk({
                    account: verifiedAccount,
                    address,
                    path,
                }),
            );
        };

    const confirmApproval = async ({
        trade: approvalTrade,
        receiveAddress: approvalReceiveAddress,
    }: {
        trade?: ExchangeTrade;
        receiveAddress: string;
    }) => {
        const commonFunctions = await getTradeRequestParams(approvalTrade);
        if (!commonFunctions) return undefined;
        const { processResponseData } = commonFunctions;

        return await dispatch(
            exchangeThunks.confirmApprovalThunk({
                receiveAddress: approvalReceiveAddress,
                account,
                extraField,
                trade: approvalTrade,
                processResponseData,
            }),
        ).unwrap();
    };

    const approveTransaction = async (exchangeTrade: ExchangeTrade) => {
        if (!receiveAddress) return false;

        const newTrade = await confirmApproval({
            trade: { ...exchangeTrade, status: 'CONFIRM' },
            receiveAddress,
        });

        const isApproved = !!newTrade;

        return isApproved;
    };

    const revokeApproval = async (exchangeTrade: ExchangeTrade) => {
        if (!receiveAddress) return false;

        const approvalType: DexApprovalType = 'ZERO';
        const updatedTrade: ExchangeTrade = {
            ...exchangeTrade,
            approvalType,
            status: exchangeTrade.status === 'APPROVAL_REQ' ? 'APPROVAL_REQ' : 'CONFIRM',
        };

        dispatch(tradingExchangeActions.saveSelectedQuote(updatedTrade));

        const newTrade = await confirmApproval({
            trade: updatedTrade,
            receiveAddress,
        });

        const isRevoked = !!newTrade;

        return isRevoked;
    };

    return {
        verifyAddress,
        confirmApproval,
        approveTransaction,
        revokeApproval,
    };
};
