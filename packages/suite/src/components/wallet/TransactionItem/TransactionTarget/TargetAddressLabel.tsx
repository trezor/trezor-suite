import styled from 'styled-components';

import { selectAddressLabels } from '@suite-common/local-first-storage';
import type { NetworkSymbol } from '@suite-common/wallet-config';
import type { StaticSessionId } from '@trezor/connect';
import { ArrayElement } from '@trezor/type-utils';

import { AddressLabeling, Translation } from 'src/components/suite';
import { AccountLabels } from 'src/types/suite/metadata';
import { WalletAccountTransaction } from 'src/types/wallet';

import { useSelector } from '../../../../hooks/suite';

const TruncatedSpan = styled.span<{ $isBlurred?: boolean }>`
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
`;

interface TargetAddressLabelProps {
    symbol: NetworkSymbol;
    target: ArrayElement<WalletAccountTransaction['targets']>;
    type: WalletAccountTransaction['type'];
    accountMetadata?: AccountLabels;
    deviceSessionStaticId: StaticSessionId;
}

export const TargetAddressLabel = ({
    symbol,
    target,
    type,
    accountMetadata,
    deviceSessionStaticId,
}: TargetAddressLabelProps) => {
    const isLocalTarget = (type === 'sent' || type === 'self') && target.isAccountTarget;

    const localFirstStorageAddressLabels = useSelector(state =>
        selectAddressLabels(state, deviceSessionStaticId),
    );

    if (isLocalTarget) {
        return (
            <TruncatedSpan>
                <Translation id="TR_SENT_TO_SELF" />
            </TruncatedSpan>
        );
    }

    return (
        <TruncatedSpan data-testid="@wallet/transaction/target-address">
            {target.addresses?.map((a, i) => {
                const addressLabel =
                    localFirstStorageAddressLabels.find(it => it.address === a)?.label ??
                    accountMetadata?.addressLabels[a];

                // either it may be AddressLabeling - sent to another account associated with this device, e.g: "Bitcoin #2"
                // or it may show address metadata label added from receive tab e.g "My address for illegal things"
                return type === 'sent' ? (
                    // Using index as a key is safe as the array doesn't change (no filter/reordering, pushing new items)

                    <AddressLabeling key={i} address={a} symbol={symbol} />
                ) : (
                    <span key={i}>{addressLabel || a}</span>
                );
            })}
        </TruncatedSpan>
    );
};
