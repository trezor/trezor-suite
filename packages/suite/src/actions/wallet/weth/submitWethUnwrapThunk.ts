import { asTypedDesktopAnalytics, events } from '@suite/analytics';
import { openDeferredModal } from '@suite/modal';
import { type StablecoinYieldTxSimulationParams } from '@suite-common/earn-stablecoin/src/tx-simulation';
import { createThunk } from '@suite-common/redux-utils';
import { notificationsActions } from '@suite-common/toast-notifications';
import {
    WRAPPED_NATIVE_TOKEN_DECIMALS,
    getWrappedNativeAddress,
    isWrappedNativeToken,
} from '@suite-common/wallet-config';
import { type Account } from '@suite-common/wallet-types';

import { composeWethUnwrapTransaction } from './composeWethUnwrapTransaction';
import { sendYieldTransaction } from '../stablecoin-yield/signingHelpers';

type SubmitWethUnwrapPayload = {
    account: Account;
    amount: string;
};

export const submitWethUnwrapThunk = createThunk(
    '@suite/weth/submitUnwrapThunk',
    async (
        { account, amount }: SubmitWethUnwrapPayload,
        { dispatch, getState, extra },
    ): Promise<string | undefined> => {
        try {
            if (account.networkType !== 'ethereum') {
                throw new Error('Unwrapping currently supports only EVM accounts.');
            }

            const wethAddress = getWrappedNativeAddress(account.symbol);

            if (!wethAddress) {
                throw new Error(`Network ${account.symbol} has no wrapped native token.`);
            }

            const unsignedTransaction = await composeWethUnwrapTransaction({
                account,
                amount,
                dispatch,
                getState,
            });

            const userAcceptedTxSimulation = await dispatch(
                openDeferredModal({
                    type: 'earn-yield-tx-simulation',
                    data: {
                        flow: 'unwrap',
                        unsignedTx: unsignedTransaction,
                        account,
                    } satisfies StablecoinYieldTxSimulationParams,
                }),
            );

            asTypedDesktopAnalytics(extra.services.analytics).report({
                type: events.wethUnwrapEvent.name,
                payload: {
                    type: 'tx-simulation-modal',
                    action: userAcceptedTxSimulation?.value === false ? 'cancel' : 'continue',
                    networkSymbol: account.symbol,
                },
            });

            if (userAcceptedTxSimulation?.value === false) {
                return;
            }

            const selectedFee = userAcceptedTxSimulation?.selectedFee ?? null;

            const wethToken = account.tokens?.find(token =>
                isWrappedNativeToken(account.symbol, token.contract),
            );

            const result = await sendYieldTransaction({
                account,
                amount,
                token: {
                    networkSymbol: account.symbol,
                    symbol: wethToken?.symbol ?? 'WETH',
                    decimals: WRAPPED_NATIVE_TOKEN_DECIMALS,
                    contractAddress: wethAddress,
                },
                unsignedTransaction,
                dispatch,
                getState,
                selectedFee,
            });

            userAcceptedTxSimulation?.resolve();

            if (!result) {
                asTypedDesktopAnalytics(extra.services.analytics).report({
                    type: events.wethUnwrapEvent.name,
                    payload: {
                        type: 'error',
                        action: 'continue',
                        networkSymbol: account.symbol,
                        errorMessage: 'submit-failed',
                    },
                });

                return;
            }

            asTypedDesktopAnalytics(extra.services.analytics).report({
                type: events.wethUnwrapEvent.name,
                payload: {
                    type: 'unwrap',
                    action: 'continue',
                    networkSymbol: account.symbol,
                },
            });

            dispatch(
                notificationsActions.addToast({
                    type: 'tx-sent',
                    formattedAmount: `${amount} ${wethToken?.symbol ?? 'WETH'}`,
                    token: wethToken,
                    descriptor: account.descriptor,
                    symbol: account.symbol,
                    txid: result.txid,
                }),
            );

            return result.txid;
        } catch (error) {
            console.error(error);
            asTypedDesktopAnalytics(extra.services.analytics).report({
                type: events.wethUnwrapEvent.name,
                payload: {
                    type: 'error',
                    action: 'continue',
                    networkSymbol: account.symbol,
                    errorMessage: 'submit-failed',
                },
            });
            dispatch(
                notificationsActions.addToast({
                    type: 'sign-tx-error',
                    error: error instanceof Error ? error.message : String(error),
                }),
            );
        }
    },
);
