import { createWeakMapSelector } from '@suite-common/redux-utils';
import {
    type AccountsRootState,
    selectAccountByKey,
    selectSendFormDraftByKey,
} from '@suite-common/wallet-core';
import {
    type AccountKey,
    type GeneralPrecomposedTransaction,
    type TokenAddress,
} from '@suite-common/wallet-types';
import {
    type AmountSubunit,
    getCardanoTokenSendMinAdaAmount,
    getSendFormDraftKey,
    isCardanoTokenSendAdaInsufficient,
} from '@suite-common/wallet-utils';
import { type NativeSendRootState, selectFeeLevels } from '@suite-native/transaction-management';

// Create memoized selector for complex computations
export const selectDestinationTagFromDraft = (
    state: NativeSendRootState,
    accountKey: AccountKey,
    tokenContract?: TokenAddress,
) => {
    const draftKey = getSendFormDraftKey(accountKey, tokenContract);

    return state.wallet.send.drafts[draftKey]?.destinationTag;
};

export type CardanoTokenSendRootState = NativeSendRootState & AccountsRootState;

type CardanoTokenSendAdaRequirement = {
    balance: string;
    composedFeeLevel: GeneralPrecomposedTransaction | undefined;
    minAdaAmount: AmountSubunit;
};

const createMemoizedSelector = createWeakMapSelector.withTypes<CardanoTokenSendRootState>();

const selectCardanoTokenSendAdaRequirement = createMemoizedSelector(
    [
        selectAccountByKey,
        (state: CardanoTokenSendRootState, accountKey: AccountKey, tokenContract?: TokenAddress) =>
            selectSendFormDraftByKey(state, accountKey, tokenContract),
        selectFeeLevels,
        (
            _state: CardanoTokenSendRootState,
            _accountKey: AccountKey,
            tokenContract?: TokenAddress,
        ) => tokenContract,
    ],
    (account, draft, feeLevels, tokenContract): CardanoTokenSendAdaRequirement | undefined => {
        if (account?.networkType !== 'cardano' || !tokenContract) return undefined;

        const composedFeeLevel = feeLevels[draft?.selectedFee ?? 'normal'];

        return {
            balance: account.balance,
            composedFeeLevel,
            minAdaAmount: getCardanoTokenSendMinAdaAmount({
                symbol: account.symbol,
                outputs: draft?.outputs ?? [{ token: tokenContract, amount: '' }],
                composedFeeLevel,
            }),
        };
    },
);

// `null` while the transaction is composing, so the amount can render as loading.
export const selectCardanoTokenSendMinAdaAmount = (
    state: CardanoTokenSendRootState,
    accountKey: AccountKey,
    tokenContract?: TokenAddress,
): AmountSubunit | null | undefined => {
    const adaRequirement = selectCardanoTokenSendAdaRequirement(state, accountKey, tokenContract);

    if (!adaRequirement) return undefined;

    return adaRequirement.composedFeeLevel ? adaRequirement.minAdaAmount : null;
};

export const selectIsCardanoTokenSendAdaInsufficient = (
    state: CardanoTokenSendRootState,
    accountKey: AccountKey,
    tokenContract?: TokenAddress,
): boolean => {
    const adaRequirement = selectCardanoTokenSendAdaRequirement(state, accountKey, tokenContract);

    if (!adaRequirement) return false;

    const { balance, composedFeeLevel, minAdaAmount } = adaRequirement;

    if (
        composedFeeLevel?.type === 'error' &&
        composedFeeLevel.error === 'UTXO_BALANCE_INSUFFICIENT'
    ) {
        return true;
    }

    return isCardanoTokenSendAdaInsufficient({ balance, minAdaAmount });
};
