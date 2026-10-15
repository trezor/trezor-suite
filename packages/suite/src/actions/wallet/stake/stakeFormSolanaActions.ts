import { type Dispatch, type UnknownAction } from '@reduxjs/toolkit';
import { type ThunkDispatch } from 'redux-thunk';

import {
    type BlockchainRootState,
    type ResolveSolanaStakingContextState,
    type SignPreparedSolanaStakingTransactionThunkState,
    WALLET_SDK_SOURCE,
    composeSolanaStakingTransaction,
    getSolanaStakingUserAgent,
    isEarnSigningCancelled,
    prepareSolanaStakingSignContext,
    selectBlockchainUrlBySymbol,
    signPreparedSolanaStakingTransactionThunk,
} from '@suite-common/wallet-core';
import {
    type Account,
    type ComposeActionContext,
    type PrecomposedTransactionFinal,
    type StakeFormState,
} from '@suite-common/wallet-types';

import { events } from '@suite/analytics';
import {
    type StakeSignResult,
    type StakeSignThunkDeps,
    handleStakeSignRejection,
    reportStakeSignFailure,
} from './stakeSignUtils';

type ComposeTransactionThunkState = BlockchainRootState;

export const composeTransactionThunk =
    (formValues: StakeFormState, formState: ComposeActionContext) =>
    async (_: Dispatch<UnknownAction>, getState: () => ComposeTransactionThunkState) => {
        const { account } = formState;
        if (account.networkType !== 'solana') return;

        const blockchainUrl = selectBlockchainUrlBySymbol(getState(), account.symbol);
        if (!blockchainUrl) return;

        return await composeSolanaStakingTransaction({
            formValues,
            composeContext: formState,
            blockchainUrl,
            userAgent: getSolanaStakingUserAgent(),
        });
    };

type SignTransactionThunkState = ResolveSolanaStakingContextState &
    SignPreparedSolanaStakingTransactionThunkState;

type SignTransactionThunkDeps = StakeSignThunkDeps;

type SignTransactionThunkParams = {
    account: Account;
    formValues: StakeFormState;
    transactionInfo: PrecomposedTransactionFinal;
};

export const signTransactionThunk =
    ({ account, formValues, transactionInfo }: SignTransactionThunkParams) =>
    async (
        dispatch: ThunkDispatch<SignTransactionThunkState, SignTransactionThunkDeps, UnknownAction>,
        getState: () => SignTransactionThunkState,
        extra: SignTransactionThunkDeps,
    ): Promise<StakeSignResult> => {
        if (transactionInfo?.type !== 'final') return;
        if (account.networkType !== 'solana') return;

        const prepared = await prepareSolanaStakingSignContext(getState(), {
            accountKey: account.key,
            stakeType: formValues.stakeType,
            precomposedTransaction: transactionInfo,
            source: WALLET_SDK_SOURCE,
        });

        if (!prepared.ok) {
            return reportStakeSignFailure(dispatch, prepared.error.message);
        }

        const signed = await dispatch(
            signPreparedSolanaStakingTransactionThunk({ context: prepared.context }),
        );

        if (signPreparedSolanaStakingTransactionThunk.rejected.match(signed)) {
            if (isEarnSigningCancelled(signed.error)) {
                extra.services.analytics.report({
                    type: events.transactionCancelEvent.name,
                    payload: {
                        txType: 'stake',
                        networkSymbol: account.symbol,
                        stage: 'signing',
                    },
                });
            }

            return handleStakeSignRejection({ dispatch, error: signed.payload });
        }

        return signed.payload.serializedTx;
    };
