import { useSelector } from 'react-redux';

import { type FormDraftRootState, selectFormDraft } from '@suite-common/wallet-core';
import {
    type AccountKey,
    type FormState,
    type PrecomposedTransactionFinal,
    isFinalPrecomposedTransaction,
} from '@suite-common/wallet-types';
import { getFormDraftKey } from '@suite-common/wallet-utils';
import { type NativeSendRootState, selectFeeLevels } from '@suite-native/transaction-management';

import { type EarnFormDraftPrefix } from '../types';

export const useEarnSelectedPrecomposedTransaction = (
    prefix: EarnFormDraftPrefix,
    accountKey: AccountKey,
): PrecomposedTransactionFinal | undefined => {
    const formDraftKey = getFormDraftKey(prefix, accountKey);
    const formDraft = useSelector((state: FormDraftRootState) =>
        selectFormDraft<FormState>(state, formDraftKey),
    );
    const feeLevels = useSelector((state: NativeSendRootState) => selectFeeLevels(state));

    const selectedLabel = formDraft?.selectedFee ?? 'normal';
    const precomposed = feeLevels[selectedLabel];

    return isFinalPrecomposedTransaction(precomposed) ? precomposed : undefined;
};
