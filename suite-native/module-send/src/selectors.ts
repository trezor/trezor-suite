import { type AccountsRootState, selectAccountByKey } from '@suite-common/wallet-core';
import { type AccountKey, type TokenAddress } from '@suite-common/wallet-types';
import { getSendFormDraftKey } from '@suite-common/wallet-utils';
import { type NativeSendRootState } from '@suite-native/transaction-management';

export const selectDestinationTagFromDraft = (
    state: NativeSendRootState,
    accountKey: AccountKey,
    tokenContract?: TokenAddress,
) => {
    const draftKey = getSendFormDraftKey(accountKey, tokenContract);

    return state.wallet.send.drafts[draftKey]?.destinationTag;
};

export const selectSendFormAccountUtxos = (state: AccountsRootState, accountKey: AccountKey) =>
    selectAccountByKey(state, accountKey)?.utxo;

export const selectSendFormAccountAnonymitySet = (
    state: AccountsRootState,
    accountKey: AccountKey,
) => selectAccountByKey(state, accountKey)?.addresses?.anonymitySet;

export const selectSendFormAccountRippleReserve = (
    state: AccountsRootState,
    accountKey: AccountKey,
) => {
    const account = selectAccountByKey(state, accountKey);
    const reserve =
        account?.misc && 'reserve' in account.misc && account.misc.reserve
            ? account.misc.reserve
            : undefined;

    return account?.networkType === 'ripple' ? reserve : undefined;
};
