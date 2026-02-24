import { useSelector } from 'react-redux';

import {
    SuiteSyncDataRootState,
    selectSuiteSyncAddressLabel,
    selectSuiteSyncOutputLabel,
} from '@suite-common/suite-sync';
import { HStack, Text, TextProps } from '@suite-native/atoms';
import { AddressFormatter } from '@suite-native/formatters';
import type { StaticSessionId } from '@trezor/connect';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

const ADDRESS_LABEL_MAX_LENGTH = 25;

const truncateAddressLabel = (label: string | null) =>
    label && label.length > ADDRESS_LABEL_MAX_LENGTH
        ? `${label.slice(0, ADDRESS_LABEL_MAX_LENGTH)}…`
        : label;

const textStyle = prepareNativeStyle(() => ({
    flex: 1,
}));

const LabelText = (props: TextProps) => (
    <Text variant="body-sm" color="textSubdued" numberOfLines={1} {...props} />
);

type UtxoCoinControlLabelProps = {
    address: string;
    txId: string;
    outputIndex: string;
    deviceStaticSessionId: StaticSessionId;
};

export const UtxoCoinControlLabel = ({
    address,
    txId,
    outputIndex,
    deviceStaticSessionId,
}: UtxoCoinControlLabelProps) => {
    const { applyStyle } = useNativeStyles();

    const addressLabel = useSelector((state: SuiteSyncDataRootState) =>
        selectSuiteSyncAddressLabel(state, deviceStaticSessionId, address),
    );
    const utxoLabel = useSelector((state: SuiteSyncDataRootState) =>
        selectSuiteSyncOutputLabel(state, txId, outputIndex, deviceStaticSessionId),
    );

    if (!utxoLabel && !addressLabel) {
        return <AddressFormatter value={address} variant="body-sm" color="textSubdued" />;
    }

    if (!utxoLabel) {
        return <LabelText>{addressLabel}</LabelText>;
    }

    const truncatedAddressLabel = truncateAddressLabel(addressLabel);

    const addressPart = truncatedAddressLabel ? (
        <LabelText>{truncatedAddressLabel}</LabelText>
    ) : (
        <AddressFormatter
            value={address}
            variant="body-sm"
            color="textSubdued"
            style={applyStyle(textStyle)}
        />
    );

    return (
        <HStack alignItems="center">
            {addressPart}
            <LabelText>•</LabelText>

            <LabelText style={applyStyle(textStyle)}>{utxoLabel}</LabelText>
        </HStack>
    );
};
