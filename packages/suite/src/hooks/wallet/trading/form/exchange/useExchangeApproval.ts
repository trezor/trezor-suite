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
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

import { useTradingExchangeTradeRequest } from '../common/useTradingExchangeTradeRequest';

type UseExchangeApprovalProps = {
    account: Account | undefined;
};

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
export const useExchangeApproval = ({ account }: UseExchangeApprovalProps) => {
    const { dispatch } = useServices(injectDispatch);
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

    type ConfirmApprovalParams = {
        trade?: ExchangeTrade;
        receiveAddress: string;
    };

    const confirmApproval = async ({
        trade: approvalTrade,
        receiveAddress: approvalReceiveAddress,
    }: ConfirmApprovalParams) => {
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
                trade: approvalTrade,
                processResponseData,
            }),
        ).unwrap();
    };

    type ConfirmPendingApprovalParams = {
        trade: ExchangeTrade;
        txid: string;
        approvalType: DexApprovalType | undefined;
    };

    const confirmPendingApproval = async ({
        trade,
        txid,
        approvalType,
    }: ConfirmPendingApprovalParams) => {
        const pendingTrade: ExchangeTrade = {
            ...trade,
            status: 'APPROVAL_PENDING',
            approvalSendTxHash: txid,
            approvalType,
        };

        dispatch(tradingExchangeActions.saveSelectedQuote(pendingTrade));

        if (!trade.receiveAddress) {
            return;
        }

        await confirmApproval({ trade: pendingTrade, receiveAddress: trade.receiveAddress });
    };

    const approveTransaction = async (exchangeTrade: ExchangeTrade) => {
        const { receiveAddress } = exchangeTrade;
        if (!receiveAddress) {
            return false;
        }

        const newTrade = await confirmApproval({
            trade: { ...exchangeTrade, status: 'CONFIRM' },
            receiveAddress,
        });

        const isApproved = !!newTrade;

        return isApproved;
    };

    const revokeApproval = async (exchangeTrade: ExchangeTrade) => {
        const { receiveAddress } = exchangeTrade;
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
        confirmPendingApproval,
        approveTransaction,
        revokeApproval,
    };
};
