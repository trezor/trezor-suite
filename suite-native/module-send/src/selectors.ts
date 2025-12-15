import { type AccountKey, type TokenAddress } from '@suite-common/wallet-types';
import { getSendFormDraftKey } from '@suite-common/wallet-utils';
import { type NativeSendRootState } from '@suite-native/transaction-management';

// Create memoized selector for complex computations
export const selectDestinationTagFromDraft = (
    state: NativeSendRootState,
    accountKey: AccountKey,
    tokenContract?: TokenAddress,
) => {
    const draftKey = getSendFormDraftKey(accountKey, tokenContract);

    return state.wallet.send.drafts[draftKey]?.destinationTag;
};
