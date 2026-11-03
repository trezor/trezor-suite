import { type ReactNode } from 'react';

import { HStack, PressableOpacity, Text, VStack } from '@suite-native/atoms';
import { useCopyToClipboard } from '@suite-native/clipboard';
import { AddressFormatter } from '@suite-native/formatters';
import { Icon } from '@suite-native/icons';
import { useTranslate } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

type AssetDetailAddressFieldProps = {
    label: ReactNode;
    value: string;
    testID: string;
};

const addressValueStyle = prepareNativeStyle(({ colors, borders }) => ({
    backgroundColor: colors.elementFillField,
    borderRadius: borders.radii.r12,
}));

export const AssetDetailAddressField = ({ label, value, testID }: AssetDetailAddressFieldProps) => {
    const { applyStyle } = useNativeStyles();
    const { translate } = useTranslate();
    const copyToClipboard = useCopyToClipboard();

    return (
        <VStack spacing="sp8" paddingVertical="sp8">
            <Text variant="body-sm" color="contentSecondary">
                {label}
            </Text>
            <HStack
                alignItems="center"
                justifyContent="space-between"
                spacing="sp12"
                paddingHorizontal="sp12"
                paddingVertical="sp8"
                style={applyStyle(addressValueStyle)}
            >
                <AddressFormatter
                    value={value}
                    format="short"
                    variant="body-sm"
                    numberOfLines={1}
                />
                <PressableOpacity
                    accessibilityRole="button"
                    accessibilityLabel={translate('generic.buttons.copy')}
                    onPress={() => void copyToClipboard(value)}
                    testID={`${testID}/copy`}
                >
                    <Icon name="copy" color="contentSecondary" size="mediumLarge" />
                </PressableOpacity>
            </HStack>
        </VStack>
    );
};
