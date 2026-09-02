import { useTranslation } from '@suite/intl';
import { Labeling } from '@suite/labeling';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type AccountDescriptor, createAccountKey } from '@suite-common/wallet-types';
import { type StaticSessionId } from '@trezor/device-utils';

import { Address } from './Address';

type AddressLabelingProps = {
    accountDescriptor: AccountDescriptor;
    networkSymbol: NetworkSymbol;
    deviceStaticSessionId: StaticSessionId;
    address: string;
    label?: string;
    maxWidth?: number;
};

export const AddressLabeling = ({
    accountDescriptor,
    networkSymbol,
    deviceStaticSessionId,
    address,
    label,
    maxWidth,
}: AddressLabelingProps) => {
    const { translationString } = useTranslation();

    return (
        <Labeling
            payload={{
                type: 'addressLabel',
                entityKey: createAccountKey({
                    accountDescriptor,
                    networkSymbol,
                    deviceStaticSessionId,
                }),
                defaultValue: address,
                networkSymbol,
                accountDescriptor,
            }}
            deviceStaticSessionId={deviceStaticSessionId}
            displayValue={<Address value={address} isTruncated />}
            placeholder={translationString('TR_LABELING_ADDRESS_LABEL')}
            minHeight={28}
            maxWidth={maxWidth}
        >
            {label}
        </Labeling>
    );
};
