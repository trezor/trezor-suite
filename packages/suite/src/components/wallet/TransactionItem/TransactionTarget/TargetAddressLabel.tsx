import { Translation } from '@suite/intl';
import { type AccountLabels } from '@suite-common/metadata-types';
import { selectSuiteSyncAddressLabels } from '@suite-common/suite-sync';
import type { NetworkSymbol } from '@suite-common/wallet-config';
import type { StaticSessionId } from '@trezor/connect';
import { type ArrayElement } from '@trezor/type-utils';

import { Address, AddressLabeling } from 'src/components/suite';
import { type WalletAccountTransaction } from 'src/types/wallet';

import { useSelector } from '../../../../hooks/suite';

type TargetAddressLabelProps = {
    symbol: NetworkSymbol;
    target: ArrayElement<WalletAccountTransaction['targets']>;
    type: WalletAccountTransaction['type'];
    accountMetadata?: AccountLabels;
    deviceStaticSessionId: StaticSessionId;
};

export const TargetAddressLabel = ({
    symbol,
    target,
    type,
    accountMetadata,
    deviceStaticSessionId,
}: TargetAddressLabelProps) => {
    const isLocalTarget = (type === 'sent' || type === 'self') && target.isAccountTarget;

    const suiteSyncAddressLabels = useSelector(state =>
        selectSuiteSyncAddressLabels(state, deviceStaticSessionId),
    );

    if (isLocalTarget) {
        return <Translation id="TR_SENT_TO_SELF" />;
    }

    return (
        <span data-testid="@wallet/transaction/target-address">
            {target.addresses?.map((a, i) => {
                const addressLabel =
                    suiteSyncAddressLabels.find(it => it.address === a)?.label ??
                    accountMetadata?.addressLabels[a];

                if (a.startsWith('OP_RETURN ')) {
                    return <span key={i}>{a}</span>;
                }

                // either it may be AddressLabeling - sent to another account associated with this device, e.g: "Bitcoin #2"
                // or it may show address metadata label added from receive tab e.g "My address for illegal things"
                return type === 'sent' ? (
                    // Using index as a key is safe as the array doesn't change (no filter/reordering, pushing new items)
                    <AddressLabeling key={i} address={a} symbol={symbol} />
                ) : (
                    <span key={i}>{addressLabel ?? <Address value={a} isTruncated />}</span>
                );
            })}
        </span>
    );
};
