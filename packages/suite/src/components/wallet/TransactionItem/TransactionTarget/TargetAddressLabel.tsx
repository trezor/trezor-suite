import { Address, selectAddressLabelsForAccount } from '@suite/address';
import { Translation } from '@suite/intl';
import type { NetworkSymbol } from '@suite-common/wallet-config';
import type { AccountKey } from '@suite-common/wallet-types';
import type { StaticSessionId } from '@trezor/connect';
import { type ArrayElement } from '@trezor/type-utils';

import { AddressLabeling } from 'src/components/suite';
import { useSelector } from 'src/hooks/suite';
import { type WalletAccountTransaction } from 'src/types/wallet';

type TargetAddressLabelProps = {
    symbol: NetworkSymbol;
    target: ArrayElement<WalletAccountTransaction['targets']>;
    type: WalletAccountTransaction['type'];
    accountKey: AccountKey;
    deviceStaticSessionId: StaticSessionId;
};

export const TargetAddressLabel = ({
    symbol,
    target,
    type,
    accountKey,
    deviceStaticSessionId,
}: TargetAddressLabelProps) => {
    const isLocalTarget = (type === 'sent' || type === 'self') && target.isAccountTarget;
    const addressLabels = useSelector(state =>
        selectAddressLabelsForAccount(state, {
            addresses: target.addresses ?? [],
            accountKey,
            deviceStaticId: deviceStaticSessionId,
        }),
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

                // either it may be AddressLabeling - sent to another account associated with this device, e.g: "Bitcoin #2"
                // or it may show address metadata label added from receive tab e.g "My address for illegal things"
                return type === 'sent' ? (
                    // Using index as a key is safe as the array doesn't change (no filter/reordering, pushing new items)
                    <AddressLabeling key={i} address={a} symbol={symbol} />
                ) : (
                    <span key={i}>{addressLabels[a] ?? <Address value={a} isTruncated />}</span>
                );
            })}
        </span>
    );
};
