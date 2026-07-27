import { openDeferredModal } from '@suite/modal';
import { type StablecoinYieldTxSimulationParams } from '@suite-common/earn-stablecoin/src/tx-simulation';
import { createThunk } from '@suite-common/redux-utils';
import { notificationsActions } from '@suite-common/toast-notifications';
import { getNetwork, getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import {
    type YieldFlowDisplayToken,
    composeYieldWrapTransactionThunk,
} from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';

import { sendYieldTransaction } from './stablecoin-yield/signingHelpers';

const WRAP_NATIVE_TOKEN_PREFIX = '@wallet/wrap-native-token';

type WrapNativeTokenPayload = {
    account: Account;
    token: YieldFlowDisplayToken & { contractAddress: string };
    wrapAmount: string;
    yieldFlow?: {
        flowKey: string;
        flowType: 'deposit';
    };
};

export const submitWrapNativeTokenThunk = createThunk(
    `${WRAP_NATIVE_TOKEN_PREFIX}/submit`,
    async (
        { account, token, wrapAmount, yieldFlow }: WrapNativeTokenPayload,
        { dispatch, getState },
    ) => {
        try {
            const result = await dispatch(
                composeYieldWrapTransactionThunk({ account, token, wrapAmount }),
            ).unwrap();

            if (result.type === 'error') {
                dispatch(
                    notificationsActions.addToast({
                        type: 'sign-tx-error',
                        error: `Failed to compose wrap transaction (${result.reason}).`,
                    }),
                );

                return undefined;
            }

            const userAcceptedTxSimulation = await dispatch(
                openDeferredModal({
                    type: 'earn-yield-tx-simulation',
                    data: {
                        flow: 'wrap',
                        unsignedTx: result.unsignedTransaction,
                        account,
                    } satisfies StablecoinYieldTxSimulationParams,
                }),
            );

            if (userAcceptedTxSimulation?.value === false) {
                return undefined;
            }

            const network = getNetwork(account.symbol);

            const sendResult = await sendYieldTransaction({
                account,
                amount: wrapAmount,
                token: {
                    networkSymbol: account.symbol,
                    symbol: getNetworkDisplaySymbol(account.symbol),
                    decimals: network.decimals,
                    contractAddress: null,
                },
                unsignedTransaction: result.unsignedTransaction,
                flowKey: yieldFlow?.flowKey ?? 'standalone-wrap-native',
                flowType: yieldFlow?.flowType ?? 'deposit',
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
                    type: 'raw-tx-sent',
                    descriptor: account.descriptor,
                    symbol: account.symbol,
                    txid: sendResult.txid,
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
