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
import { type TokenInfo } from '@trezor/connect';

import { sendYieldTransaction } from './stablecoin-yield/signingHelpers';
import { addToken } from './tokenActions';

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

            // Make sure re-wrapping doesn't create a duplicate
            const isAlreadyTracked = account.tokens?.some(
                accountToken =>
                    accountToken.contract.toLowerCase() === token.contractAddress.toLowerCase(),
            );

            if (!isAlreadyTracked) {
                const wrappedTokenInfo: TokenInfo = {
                    // Only affects symbol casing (both ERC20 and BEP20 preserve it); the real
                    // standard/balance are filled in by the next backend account refresh.
                    standard: 'ERC20',
                    contract: token.contractAddress,
                    symbol: token.symbol,
                    name: token.symbol,
                    decimals: token.decimals,
                    balance: '0',
                };

                dispatch(addToken(account, [wrappedTokenInfo], { showSuccessToast: false }));
            }

            dispatch(
                notificationsActions.addToast({
                    type: 'tx-wrap',
                    descriptor: account.descriptor,
                    symbol: account.symbol,
                    txid: sendResult.txid,
                    formattedAmount: wrapAmount,
                    metadata: {
                        send: {
                            symbol: account.symbol,
                            displaySymbol: getNetworkDisplaySymbol(account.symbol),
                            amount: wrapAmount,
                        },
                        receive: {
                            symbol: account.symbol,
                            displaySymbol: token.symbol,
                            contractAddress: token.contractAddress,
                            amount: wrapAmount,
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
