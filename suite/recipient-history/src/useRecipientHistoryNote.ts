import { useSelector } from 'react-redux';

import { injectAddressValidator } from '@suite-common/networks';
import {
    type RecipientHistoryRootState,
    getRecipientLastSentTime,
    isNewRecipient,
    isPossiblePoisoning,
    selectAccountRecipientHistory,
} from '@suite-common/recipient-history';
import { selectAccountByKey } from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import { useServices } from '@trezor/dependency-injection';

export type RecipientHistoryNoteVariant =
    | { type: 'possiblePoisoning' }
    | { type: 'newRecipient' }
    | { type: 'lastSent'; lastSentTime: number };

type UseRecipientHistoryNoteParams = {
    accountKey: AccountKey;
    recipientAddress: string | undefined;
};

export const useRecipientHistoryNote = ({
    accountKey,
    recipientAddress,
}: UseRecipientHistoryNoteParams): RecipientHistoryNoteVariant | undefined => {
    const account = useSelector((state: RecipientHistoryRootState) =>
        selectAccountByKey(state, accountKey),
    );
    const history = useSelector((state: RecipientHistoryRootState) =>
        selectAccountRecipientHistory(state, accountKey),
    );

    const { addressValidator } = useServices(injectAddressValidator);

    if (
        !account ||
        !history ||
        !recipientAddress ||
        !addressValidator.isAddressValid(recipientAddress, account.symbol)
    ) {
        return undefined;
    }

    const recipientParams = {
        address: recipientAddress,
        history,
        networkType: account.networkType,
    };

    // A lookalike is also a new recipient, so the stronger warning goes first.
    if (isPossiblePoisoning(recipientParams)) return { type: 'possiblePoisoning' };

    if (isNewRecipient(recipientParams)) return { type: 'newRecipient' };

    const lastSentTime = getRecipientLastSentTime(recipientParams);

    return lastSentTime === undefined ? undefined : { type: 'lastSent', lastSentTime };
};
