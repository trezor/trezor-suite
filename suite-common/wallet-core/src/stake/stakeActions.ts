import { createAction } from '@reduxjs/toolkit';

import { type NetworkSymbol } from '@suite-common/wallet-config';
import {
    type AccountKey,
    type PrecomposedTransactionFinal,
    type StakeFormState,
} from '@suite-common/wallet-types';

export const STAKE_MODULE_PREFIX = '@common/wallet-core/stake';

type RequestSignTransactionPayload = {
    formValues: StakeFormState;
    transactionInfo: PrecomposedTransactionFinal;
};

type RequestPushTransactionPayload = {
    tx: string;
    symbol: NetworkSymbol;
};

export type VotingDelegationOption =
    { type: 'everstake' } | { type: 'another_drep'; drepId: string };

export type AccountVotingDelegation = {
    accountKey: AccountKey;
    option: VotingDelegationOption;
};

const setVotingDelegationOption = createAction(
    `${STAKE_MODULE_PREFIX}/setVotingDelegationOption`,
    (payload: AccountVotingDelegation) => ({
        payload,
    }),
);

const clearVotingDelegation = createAction(`${STAKE_MODULE_PREFIX}/clearVotingDelegation`);

const requestSignTransaction = createAction(
    `${STAKE_MODULE_PREFIX}/requestSignTransaction`,
    (payload?: RequestSignTransactionPayload) => ({
        payload,
    }),
);

const requestPushTransaction = createAction(
    `${STAKE_MODULE_PREFIX}/requestPushTransaction`,
    (payload?: RequestPushTransactionPayload) => ({
        payload,
    }),
);

const setResolvedEthereumNonce = createAction(
    `${STAKE_MODULE_PREFIX}/setResolvedEthereumNonce`,
    (payload: string) => ({
        payload,
    }),
);

const dispose = createAction(`${STAKE_MODULE_PREFIX}/dispose`);

export const stakeActions = {
    requestSignTransaction,
    requestPushTransaction,
    setVotingDelegationOption,
    clearVotingDelegation,
    setResolvedEthereumNonce,
    dispose,
};
