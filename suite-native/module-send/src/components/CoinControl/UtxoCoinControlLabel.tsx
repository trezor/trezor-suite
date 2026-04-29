import { useSelector } from 'react-redux';

import { type SuiteSyncDataRootState, selectSuiteSyncOutputLabel } from '@suite-common/suite-sync';
import { HStack, Text, type TextProps } from '@suite-native/atoms';
import { AddressFormatter } from '@suite-native/formatters';
import {
    AddressLabel,
    TransactionOutputLabel,
    selectIsLabellingAllowed,
} from '@suite-native/labeling';
import type { StaticSessionId } from '@trezor/connect';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

const ADDRESS_LABEL_MAX_LENGTH = 25;

const flexStyle = prepareNativeStyle(() => ({
    flex: 1,
}));

const LabelText = (props: TextProps) => (
    <Text variant="body-sm" color="contentSecondary" numberOfLines={1} {...props} />
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

    const isLabellingAllowed = useSelector(selectIsLabellingAllowed);

    const outputLabel = useSelector((state: SuiteSyncDataRootState) =>
        selectSuiteSyncOutputLabel(state, txId, outputIndex, deviceStaticSessionId),
    );

    const hasOutputLabel = isLabellingAllowed && !!outputLabel;

    return (
        <HStack alignItems="center">
            <AddressLabel
                address={address}
                deviceStaticSessionId={deviceStaticSessionId}
                variant="body-sm"
                color="contentSecondary"
                style={hasOutputLabel ? undefined : applyStyle(flexStyle)}
                maxLength={hasOutputLabel ? ADDRESS_LABEL_MAX_LENGTH : undefined}
                fallback={
                    <AddressFormatter
                        format="long"
                        value={address}
                        variant="body-sm"
                        color="contentSecondary"
                        style={applyStyle(flexStyle)}
                    />
                }
            />
            {hasOutputLabel && (
                <>
                    <LabelText>•</LabelText>
                    <TransactionOutputLabel
                        txId={txId}
                        outputIndex={outputIndex}
                        deviceStaticSessionId={deviceStaticSessionId}
                        variant="body-sm"
                        color="contentSecondary"
                        style={applyStyle(flexStyle)}
                    />
                </>
            )}
        </HStack>
    );
};
