import { type Dispatch, type UnknownAction } from '@reduxjs/toolkit';
import { type ThunkDispatch } from 'redux-thunk';

import { type SelectedAccountRootState, selectSelectedAccount } from '@suite/account';
import {
    type DesktopAnalyticsDep,
    type StakingCardanoPoolDelegationPayload,
    events,
} from '@suite/analytics';
import { closeModal, openDeferredModal, openModal, preserveModal } from '@suite/modal';
import { type DeviceRootState, selectSelectedDevice } from '@suite-common/device';
import {
    type MevProtectionRootState,
    selectIsMevProtectionFeatureEnabled,
} from '@suite-common/mev';
import { EarnFlow } from '@suite-common/suite-types';
import {
    type BlockchainRootState,
    type EthereumGetCurrentNonceThunkState,
    type PushStakeTransactionThunkDeps,
    type PushStakeTransactionThunkState,
    type StakeRootState,
    type WalletSettingsRootState,
    isSupportedAdaStakingNetworkSymbol,
    isSupportedEthStakingNetworkSymbol,
    isSupportedSolStakingNetworkSymbol,
    pushStakeTransactionThunk,
    selectStake,
    stakeActions,
} from '@suite-common/wallet-core';
import {
    type Account,
    type ComposeActionContext,
    type PrecomposedTransactionFinal,
    type StakeFormState,
    type StakeType,
} from '@suite-common/wallet-types';
import TrezorConnect from '@trezor/connect';
import { type SerializedError } from '@trezor/connect-common/src/constants/errors';
import { type WithServices } from '@trezor/redux-utils';
import { type Err } from '@trezor/type-utils';

import * as stakeFormCardanoActions from './stake/stakeFormCardanoActions';
import * as stakeFormEthereumActions from './stake/stakeFormEthereumActions';
import * as stakeFormSolanaActions from './stake/stakeFormSolanaActions';
import { type StakeSignResult } from './stake/stakeSignUtils';

type ComposeTransactionThunkState = BlockchainRootState & SelectedAccountRootState & StakeRootState;

export const composeTransaction =
    (formValues: StakeFormState, formState: ComposeActionContext) =>
    (dispatch: ThunkDispatch<ComposeTransactionThunkState, unknown, UnknownAction>) => {
        const { account } = formState;

        if (isSupportedEthStakingNetworkSymbol(account.symbol)) {
            return dispatch(stakeFormEthereumActions.composeTransaction(formValues, formState));
        }

        if (isSupportedSolStakingNetworkSymbol(account.symbol)) {
            return dispatch(stakeFormSolanaActions.composeTransactionThunk(formValues, formState));
        }

        if (isSupportedAdaStakingNetworkSymbol(account.symbol)) {
            return dispatch(stakeFormCardanoActions.composeTransactionThunk(formValues, formState));
        }

        return Promise.resolve(undefined);
    };

// this could be called at any time during signTransaction or pushTransaction process (from TransactionReviewModal)
type CancelSignTxThunkState = StakeRootState;

export const cancelSignTxThunk =
    (isSuccessTx?: boolean, account?: Account) =>
    (dispatch: Dispatch<UnknownAction>, getState: () => CancelSignTxThunkState) => {
        const { serializedTx, precomposedForm } = selectStake(getState());
        dispatch(stakeActions.requestSignTransaction());
        dispatch(stakeActions.requestPushTransaction());
        // if transaction is not signed yet interrupt signing in TrezorConnect
        if (!serializedTx) {
            TrezorConnect.cancel({ reason: 'tx-cancelled' });

            return;
        }
        // otherwise just close modal and open stake modal
        dispatch(closeModal());

        const { stakeType } = precomposedForm ?? {};
        if (account && stakeType && !isSuccessTx) {
            switch (stakeType) {
                case 'stake':
                    dispatch(openModal({ type: stakeType, flow: EarnFlow.Stake, account }));
                    break;

                default:
                    dispatch(openModal({ type: stakeType, account }));
            }
        }
    };

type PushTransactionThunkState = MevProtectionRootState &
    PushStakeTransactionThunkState &
    SelectedAccountRootState;

type PushTransactionThunkDeps = WithServices<DesktopAnalyticsDep> & PushStakeTransactionThunkDeps;

type PushTransactionResult = { success: true; txid: string } | { success: false };

// private, called from signTransaction only
const pushTransactionThunk =
    (stakeType: StakeType, cardanoPoolDelegation?: StakingCardanoPoolDelegationPayload) =>
    async (
        dispatch: ThunkDispatch<PushTransactionThunkState, PushTransactionThunkDeps, UnknownAction>,
        getState: () => PushTransactionThunkState,
        extra: PushTransactionThunkDeps,
    ): Promise<PushTransactionResult | undefined> => {
        const { serializedTx, precomposedTx, precomposedForm } = selectStake(getState());
        const account = selectSelectedAccount(getState());
        const isMevProtectionFeatureEnabled = selectIsMevProtectionFeatureEnabled(getState());

        if (!serializedTx || !precomposedTx || !account) return;

        const pushed = await dispatch(
            pushStakeTransactionThunk({
                accountKey: account.key,
                stakeType,
                serializedTx,
                precomposedTransaction: precomposedTx,
                precomposedForm,
                isMevProtectionFeatureEnabled,
            }),
        );
        const isSuccess = pushStakeTransactionThunk.fulfilled.match(pushed);

        // close modal regardless result
        dispatch(closeModal());

        if (isSuccess && cardanoPoolDelegation) {
            extra.services.analytics.report({
                type: events.stakingCardanoPoolDelegationEvent.name,
                payload: cardanoPoolDelegation,
            });
        }

        dispatch(cancelSignTxThunk(isSuccess, account));

        // resolve sign process
        return isSuccess ? { success: true, txid: pushed.payload.txid } : { success: false };
    };

type SignTransactionThunkState = DeviceRootState &
    EthereumGetCurrentNonceThunkState &
    PushTransactionThunkState &
    WalletSettingsRootState;

type SignTransactionThunkDeps = PushTransactionThunkDeps;

export const signTransactionThunk =
    (formValues: StakeFormState, transactionInfo: PrecomposedTransactionFinal) =>
    async (
        dispatch: ThunkDispatch<SignTransactionThunkState, SignTransactionThunkDeps, UnknownAction>,
        getState: () => SignTransactionThunkState,
    ) => {
        const device = selectSelectedDevice(getState());
        const account = selectSelectedAccount(getState());

        if (!device || !account) return;

        const enhancedTxInfo: PrecomposedTransactionFinal = {
            ...transactionInfo,
        };

        // store formValues and transactionInfo in send reducer to be used by TransactionReviewModal
        dispatch(
            stakeActions.requestSignTransaction({
                formValues,
                transactionInfo: enhancedTxInfo,
            }),
        );

        // TransactionReviewModal has 2 steps: signing and pushing
        // TrezorConnect emits UI_EVENTS.CLOSE_UI_WINDOW after the signing process
        // this action is blocked by preserveModal()
        dispatch(preserveModal());

        // signTransaction by Trezor
        let serializedTx: StakeSignResult | Err<SerializedError>;
        if (isSupportedEthStakingNetworkSymbol(account.symbol)) {
            serializedTx = await dispatch(
                stakeFormEthereumActions.signTransactionThunk(formValues, enhancedTxInfo),
            );
        }

        if (isSupportedSolStakingNetworkSymbol(account.symbol)) {
            serializedTx = await dispatch(
                stakeFormSolanaActions.signTransactionThunk(formValues, enhancedTxInfo),
            );
        }

        let cardanoPoolDelegation: StakingCardanoPoolDelegationPayload | undefined;
        if (isSupportedAdaStakingNetworkSymbol(account.symbol)) {
            const signResult = await dispatch(
                stakeFormCardanoActions.signTransactionThunk(formValues, enhancedTxInfo),
            );

            if (signResult && 'serializedTx' in signResult) {
                serializedTx = signResult.serializedTx;
                cardanoPoolDelegation = signResult.poolDelegation;
            } else {
                serializedTx = signResult;
            }
        }

        if (typeof serializedTx !== 'string') {
            const isTimeout =
                serializedTx &&
                ('reason' in serializedTx
                    ? serializedTx.reason === 'timeout'
                    : serializedTx.error?.message === 'tx-timeout');

            if (isTimeout) return;

            // close modal manually since UI_EVENTS.CLOSE_UI_WINDOW was blocked
            dispatch(closeModal());

            const { stakeType } = formValues;
            if (stakeType) {
                switch (stakeType) {
                    case 'stake':
                        dispatch(openModal({ type: stakeType, flow: EarnFlow.Stake, account }));
                        break;

                    default:
                        dispatch(openModal({ type: stakeType, account }));
                }
            }

            return;
        }

        // store serializedTx in reducer (TrezorConnect.pushTransaction params) to be used in TransactionReviewModal and pushTransaction method
        dispatch(
            stakeActions.requestPushTransaction({
                tx: serializedTx,
                symbol: account.symbol,
            }),
        );

        if (account?.networkType === 'cardano') {
            return dispatch(pushTransactionThunk(formValues.stakeType, cardanoPoolDelegation));
        }

        // Open a deferred modal and get the decision
        const decision = await dispatch(openDeferredModal({ type: 'review-transaction' }));
        if (decision) {
            // push tx to the network
            return dispatch(pushTransactionThunk(formValues.stakeType));
        }
    };
