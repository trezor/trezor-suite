import { openDeferredModal } from '@suite/modal';
import { type StablecoinYieldTxSimulationParams } from '@suite-common/earn-stablecoin/src/tx-simulation';
import { createThunk } from '@suite-common/redux-utils';
import { notificationsActions } from '@suite-common/toast-notifications';
import { getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import {
    type YieldFlowDisplayToken,
    type YieldWithdrawFlowType,
    composeYieldUnwrapTransactionThunk,
} from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';

import { sendYieldTransaction } from './stablecoin-yield/signingHelpers';

const UNWRAP_NATIVE_TOKEN_PREFIX = '@wallet/unwrap-native-token';

type UnwrapNativeTokenPayload = {
    account: Account;
    token: YieldFlowDisplayToken & { contractAddress: string };
    unwrapAmount: string;
    yieldFlow?: {
        flowKey: string;
        flowType: YieldWithdrawFlowType;
    };
};

export const submitUnwrapNativeTokenThunk = createThunk(
    `${UNWRAP_NATIVE_TOKEN_PREFIX}/submit`,
    async (
        { account, token, unwrapAmount, yieldFlow }: UnwrapNativeTokenPayload,
        { dispatch, getState },
    ) => {
        try {
            const result = await dispatch(
                composeYieldUnwrapTransactionThunk({ account, token, unwrapAmount }),
            ).unwrap();

            if (result.type === 'error') {
                dispatch(
                    notificationsActions.addToast({
                        type: 'sign-tx-error',
                        error: `Failed to compose unwrap transaction (${result.reason}).`,
                    }),
                );

                return undefined;
            }

            const userAcceptedTxSimulation = await dispatch(
                openDeferredModal({
                    type: 'earn-yield-tx-simulation',
                    data: {
                        flow: 'unwrap',
                        unsignedTx: result.unsignedTransaction,
                        account,
                    } satisfies StablecoinYieldTxSimulationParams,
                }),
            );

            if (userAcceptedTxSimulation?.value === false) {
                return undefined;
            }

            const sendResult = await sendYieldTransaction({
                account,
                amount: unwrapAmount,
                token,
                unsignedTransaction: result.unsignedTransaction,
                flowKey: yieldFlow?.flowKey ?? 'standalone-unwrap-native',
                flowType: yieldFlow?.flowType ?? 'withdraw',
                dispatch,
                getState,
                selectedFee: userAcceptedTxSimulation?.selectedFee ?? null,
            });

            userAcceptedTxSimulation?.resolve();

            if (!sendResult) {
                return undefined;
            }

            dispatch(
                notificationsActions.addToast({
                    type: 'tx-unwrap',
                    descriptor: account.descriptor,
                    symbol: account.symbol,
                    txid: sendResult.txid,
                    formattedAmount: unwrapAmount,
                    metadata: {
                        send: {
                            symbol: account.symbol,
                            displaySymbol: token.symbol,
                            contractAddress: token.contractAddress,
                            amount: unwrapAmount,
                        },
                        receive: {
                            symbol: account.symbol,
                            displaySymbol: getNetworkDisplaySymbol(account.symbol),
                            amount: unwrapAmount,
                        },
                    },
                    style: { maxWidth: 'auto' },
                }),
            );

            return sendResult;
        } catch (error) {
            console.error(error);
            dispatch(
                notificationsActions.addToast({
                    type: 'sign-tx-error',
                    error: error instanceof Error ? error.message : String(error),
                }),
            );

            return undefined;
        }
    },
);
