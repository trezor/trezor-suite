import { useTranslation } from '@suite/intl';
import { Labeling } from '@suite/labeling';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type AccountDescriptor, createAccountKey } from '@suite-common/wallet-types';
import { Text } from '@trezor/components';
import { type StaticSessionId } from '@trezor/device-utils';
import { type TypographyStyle } from '@trezor/theme';

import { Address } from './Address';

type AddressLabelingProps = {
    accountDescriptor: AccountDescriptor;
    networkSymbol: NetworkSymbol;
    deviceStaticSessionId: StaticSessionId;
    address: string;
    label?: string;
    maxWidth?: number;
    typographyStyle?: TypographyStyle;
    isAddressTruncated?: boolean;
    isDisplayValueMultiline?: boolean;
    addressDataTestId?: string;
};

export const AddressLabeling = ({
    accountDescriptor,
    networkSymbol,
    deviceStaticSessionId,
    address,
    label,
    maxWidth,
    typographyStyle,
    isAddressTruncated = true,
    isDisplayValueMultiline = false,
    addressDataTestId,
}: AddressLabelingProps) => {
    const { translationString } = useTranslation();

    return (
        <Text typographyStyle={typographyStyle}>
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
                displayValue={
                    <Address
                        value={address}
                        isTruncated={isAddressTruncated}
                        data-testid={addressDataTestId}
                    />
                }
                placeholder={translationString('TR_LABELING_ADDRESS_LABEL')}
                minHeight={28}
                maxWidth={maxWidth}
                isDisplayValueMultiline={isDisplayValueMultiline}
            >
                {label}
            </Labeling>
        </Text>
    );
};
