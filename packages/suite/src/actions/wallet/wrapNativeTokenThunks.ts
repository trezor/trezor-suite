import { openDeferredModal } from '@suite/modal';
import { type StablecoinYieldTxSimulationParams } from '@suite-common/earn-stablecoin/src/tx-simulation';
import { createThunk } from '@suite-common/redux-utils';
import { notificationsActions } from '@suite-common/toast-notifications';
import {
    getNetwork,
    getNetworkDisplaySymbol,
    getWrappedNativeAddress,
} from '@suite-common/wallet-config';
import { WETH_DEPOSIT_BACKUP_GAS_LIMIT } from '@suite-common/wallet-constants';
import {
    buildYieldUnsignedTransaction,
    buildYieldWrapTransactionData,
    estimateYieldFeeLevel,
    ethereumGetCurrentNonceThunk,
    selectRawNetworkFeeInfo,
} from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { getAccountIdentity, getConvertedOrDefaultFeeInfo } from '@suite-common/wallet-utils';

import { sendYieldTransaction } from './stablecoin-yield/signingHelpers';

// Standalone wrap flow for the debug "Wrap" action on the dashboard native-asset row. It reuses the
// shared yield building blocks/signer but deliberately keeps its own thunks so the stablecoin-yield
// flow thunks stay untouched.
const WRAP_NATIVE_TOKEN_PREFIX = '@wallet/wrap-native-token';

export type ComposeWrapNativeTokenErrorReason =
    | 'unsupported-network'
    | 'not-wrapped-native'
    | 'missing-fee-level';

export type ComposeWrapNativeTokenResult =
    | {
          type: 'action-ready';
          unsignedTransaction: string;
      }
    | {
          type: 'error';
          reason: ComposeWrapNativeTokenErrorReason;
      };

type WrapNativeTokenPayload = {
    account: Account;
    /** Native coin amount to wrap — the value carried by the transaction. */
    wrapAmount: string;
};

/**
 * Composes an unsigned WETH `deposit()` (wrap) transaction that carries `wrapAmount` in its value.
 * The target is always the chain's canonical wrapped-native contract.
 */
export const composeWrapNativeTokenThunk = createThunk<
    ComposeWrapNativeTokenResult,
    WrapNativeTokenPayload,
    void
>(
    `${WRAP_NATIVE_TOKEN_PREFIX}/compose`,
    async ({ account, wrapAmount }, { dispatch, getState }) => {
        if (account.networkType !== 'ethereum') {
            return { type: 'error', reason: 'unsupported-network' } as const;
        }

        const wethAddress = getWrappedNativeAddress(account.symbol);

        if (!wethAddress) {
            return { type: 'error', reason: 'not-wrapped-native' } as const;
        }

        const network = getNetwork(account.symbol);

        if (!network.chainId) {
            return { type: 'error', reason: 'unsupported-network' } as const;
        }

        const { data, value } = buildYieldWrapTransactionData({
            wrapAmount,
            decimals: network.decimals,
        });

        const [{ nonce }, estimatedFeeLevel] = await Promise.all([
            dispatch(
                ethereumGetCurrentNonceThunk({
                    selectedAccount: account,
                    fetchConfirmedNonce: true,
                }),
            ).unwrap(),
            estimateYieldFeeLevel({
                coin: account.symbol,
                identity: getAccountIdentity(account),
                from: account.descriptor,
                to: wethAddress,
                data,
                value,
            }),
        ]);

        // WETH deposit() is a fixed ~45k-gas call, so fall back to a known backup limit when
        // estimation fails rather than blocking the wrap.
        const gasLimit = estimatedFeeLevel.success
            ? estimatedFeeLevel.payload.feeLimit
            : WETH_DEPOSIT_BACKUP_GAS_LIMIT;

        const feeInfo = getConvertedOrDefaultFeeInfo({
            networkType: account.networkType,
            feeInfo: selectRawNetworkFeeInfo(getState(), account.symbol),
        });
        const normalLevel =
            feeInfo.levels.find(level => level.label === 'normal') ?? feeInfo.levels[0];

        if (!normalLevel) {
            return { type: 'error', reason: 'missing-fee-level' } as const;
        }

        const unsignedTransaction = JSON.stringify(
            buildYieldUnsignedTransaction({
                chainId: network.chainId,
                data,
                feeLevel: normalLevel,
                from: account.descriptor,
                gasLimit,
                nonce: Number(nonce),
                to: wethAddress,
                value,
            }),
        );

        return { type: 'action-ready', unsignedTransaction } as const;
    },
);

/**
 * Debug-only submit for the native-token wrap: composes the `deposit()` tx, shows the tx-simulation
 * preview, then signs on the device and broadcasts. Reuses the shared `sendYieldTransaction` signer
 * as-is — `flowType`/`flowKey` only feed the (flow-agnostic) precomposed-tx store and are inert for
 * a standalone wrap.
 */
export const submitWrapNativeTokenThunk = createThunk(
    `${WRAP_NATIVE_TOKEN_PREFIX}/submit`,
    async ({ account, wrapAmount }: WrapNativeTokenPayload, { dispatch, getState }) => {
        try {
            const result = await dispatch(
                composeWrapNativeTokenThunk({ account, wrapAmount }),
            ).unwrap();

            if (result.type === 'error') {
                dispatch(
                    notificationsActions.addToast({
                        type: 'sign-tx-error',
                        error: `Failed to compose wrap transaction (${result.reason}).`,
                    }),
                );

                return;
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
                return;
            }

            const network = getNetwork(account.symbol);

            const sendResult = await sendYieldTransaction({
                account,
                amount: wrapAmount,
                // Native display token (no contractAddress) ⇒ the review renders the wrap as a
                // native value transfer to the WETH contract, which is what a deposit() call is.
                token: {
                    networkSymbol: account.symbol,
                    symbol: getNetworkDisplaySymbol(account.symbol),
                    decimals: network.decimals,
                    contractAddress: null,
                },
                unsignedTransaction: result.unsignedTransaction,
                flowKey: 'debug-wrap-native',
                flowType: 'deposit',
                dispatch,
                getState,
                selectedFee: userAcceptedTxSimulation?.selectedFee ?? null,
            });

            userAcceptedTxSimulation?.resolve();

            if (!sendResult) {
                return;
            }

            dispatch(
                notificationsActions.addToast({
                    type: 'raw-tx-sent',
                    descriptor: account.descriptor,
                    symbol: account.symbol,
                    txid: sendResult.txid,
                }),
            );
        } catch (error) {
            console.error(error);
            dispatch(
                notificationsActions.addToast({
                    type: 'sign-tx-error',
                    error: error instanceof Error ? error.message : String(error),
                }),
            );
        }
    },
);
