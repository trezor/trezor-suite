import { useMemo } from 'react';

import { Address, selectAddressLabelsForAccount } from '@suite/address';
import { Translation } from '@suite/intl';
import { useSelector } from '@suite-common/redux-utils';
import { selectAccounts } from '@suite-common/wallet-core';
import type { AccountKey } from '@suite-common/wallet-types';
import { findTransactionSenderAccount } from '@suite-common/wallet-utils';
import { type ArrayElement } from '@trezor/type-utils';

import { AccountLabelForOwnAddress } from 'src/components/suite/labeling/AccountLabelForOwnAddress';
import { AccountLabeling } from 'src/components/suite/labeling/AccountLabeling';
import { type WalletAccountTransaction } from 'src/types/wallet';

type TargetAddressLabelProps = {
    transaction: WalletAccountTransaction;
    target: ArrayElement<WalletAccountTransaction['targets']>;
    accountKey: AccountKey;
};

export const TargetAddressLabel = ({
    transaction,
    target,
    accountKey,
}: TargetAddressLabelProps) => {
    const { symbol, type } = transaction;
    const isLocalTarget = (type === 'sent' || type === 'self') && target.isAccountTarget;
    const addressLabels = useSelector(state =>
        selectAddressLabelsForAccount(state, {
            addresses: target.addresses ?? [],
            accountKey,
            deviceStaticId: transaction.deviceState,
        }),
    );
    const accounts = useSelector(selectAccounts);

    // Targets of a received transaction hold the account's own receiving address, so the sender is
    // resolved instead — a transfer from a sibling account shows its label, like token transfers do.
    const senderAccount = useMemo(
        () => (type === 'recv' ? findTransactionSenderAccount(transaction, accounts) : undefined),
        [type, transaction, accounts],
    );

    if (isLocalTarget) {
        return <Translation id="TR_SENT_TO_SELF" />;
    }

    return (
        <span data-testid="@wallet/transaction/target-address">
            {target.addresses?.map((a, i) => {
                if (a.startsWith('OP_RETURN ')) {
                    return <span key={i}>{a}</span>;
                }

                // either it may be AccountLabelForOwnAddress - sent to another account associated with this device, e.g: "Bitcoin #2"
                // or it may show address metadata label added from receive tab e.g "My address for illegal things"
                if (type === 'sent') {
                    // Using index as a key is safe as the array doesn't change (no filter/reordering, pushing new items)
                    return <AccountLabelForOwnAddress key={i} address={a} symbol={symbol} />;
                }

                if (addressLabels[a]) {
                    return <span key={i}>{addressLabels[a]}</span>;
                }

                if (senderAccount) {
                    return (
                        <AccountLabeling
                            key={i}
                            account={senderAccount}
                            accountTypeBadgeSize="small"
                            showAccountTypeBadge
                        />
                    );
                }

                return (
                    <span key={i}>
                        <Address value={a} isTruncated />
                    </span>
                );
            })}
        </span>
    );
};
