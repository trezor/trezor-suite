import { type UnknownAction } from '@reduxjs/toolkit';
import { type DexApprovalType, type ExchangeTrade } from 'invity-api';
import { type ThunkDispatch } from 'redux-thunk';

import { type OpenModalDep } from '@suite-common/suite-types';
import { exchangeThunks, tradingExchangeActions, tradingThunks } from '@suite-common/trading';
import { type TradingRootState } from '@suite-common/trading';
import {
    type ConfirmAddressOnDeviceThunkState,
    type WalletSettingsRootState,
} from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';

import { useDispatch } from 'src/hooks/suite';
import { useTradingExchangeTradeRequest } from 'src/hooks/wallet/trading/form/common/useTradingExchangeTradeRequest';

interface UseExchangeApprovalProps {
    account: Account | undefined;
    receiveAddress?: string;
    extraField?: string;
}

type VerifyAddressThunkState = ConfirmAddressOnDeviceThunkState &
    TradingRootState &
    WalletSettingsRootState;
type VerifyAddressThunkDeps = { actions: OpenModalDep };
type VerifyAddressThunkDispatch = ThunkDispatch<
    VerifyAddressThunkState,
    VerifyAddressThunkDeps,
    UnknownAction
>;

/**
 * Device-touching exchange trade actions that are not quote-refresh: address
 * verification and the DEX approval flow (confirm / approve / revoke).
 */
export const useExchangeApproval = ({
    account,
    receiveAddress,
    extraField,
}: UseExchangeApprovalProps) => {
    const dispatch = useDispatch<VerifyAddressThunkState, VerifyAddressThunkDeps>();
    const { getTradeRequestParams } = useTradingExchangeTradeRequest(account);

    const verifyAddress =
        (verifiedAccount: Account, address: string | undefined, path: string | undefined) =>
        async (innerDispatch: VerifyAddressThunkDispatch) => {
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
        if (!account) {
            return undefined;
        }

        const commonFunctions = await getTradeRequestParams(approvalTrade);
        if (!commonFunctions) {
            return undefined;
        }
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
        if (!receiveAddress || !account) {
            return false;
        }

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
