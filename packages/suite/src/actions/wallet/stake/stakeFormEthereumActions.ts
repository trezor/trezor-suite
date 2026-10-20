import { type UnknownAction } from '@reduxjs/toolkit';
import { type ThunkDispatch } from 'redux-thunk';

import { events } from '@suite/analytics';
import { selectSelectedDevice } from '@suite-common/device';
import {
    type SignPreparedEthereumStakingTransactionThunkState,
    WALLET_SDK_SOURCE,
    composeEthereumStakingTransaction,
    getEthereumStakeFormProviderId,
    prepareEthereumStakingContext,
    signPreparedEthereumStakingTransactionThunk,
} from '@suite-common/wallet-core';
import {
    type Account,
    type ComposeActionContext,
    type PrecomposedTransactionFinal,
    type StakeFormState,
} from '@suite-common/wallet-types';

import {
    type StakeSignResult,
    type StakeSignThunkDeps,
    handleStakeSignRejection,
    isBaseStakeType,
    isStakeSignCancelled,
    reportStakeSignFailure,
} from './stakeSignUtils';

export const composeTransaction =
    (formValues: StakeFormState, formState: ComposeActionContext) => () =>
        composeEthereumStakingTransaction({
            formValues,
            composeContext: formState,
            providerId: getEthereumStakeFormProviderId(formValues),
            source: WALLET_SDK_SOURCE,
        });

type SignTransactionThunkState = SignPreparedEthereumStakingTransactionThunkState;

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
        const device = selectSelectedDevice(getState());
        if (!device || transactionInfo?.type !== 'final') return;

        const { stakeType } = formValues;
        if (account.networkType !== 'ethereum' || !isBaseStakeType(stakeType)) return;

        const prepared = prepareEthereumStakingContext(getState(), {
            accountKey: account.key,
            stakeType,
            providerId: getEthereumStakeFormProviderId(formValues),
            precomposedTransaction: transactionInfo,
            formValues,
            source: WALLET_SDK_SOURCE,
        });

        if (!prepared.ok) {
            return reportStakeSignFailure(dispatch, prepared.error.message);
        }

        const signed = await dispatch(
            signPreparedEthereumStakingTransactionThunk({ context: prepared.context }),
        );

        if (signPreparedEthereumStakingTransactionThunk.rejected.match(signed)) {
            if (isStakeSignCancelled(signed.payload)) {
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
