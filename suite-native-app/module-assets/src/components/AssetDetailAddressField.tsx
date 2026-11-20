import { type ReactNode } from 'react';

import { COPY_TO_CLIPBOARD_TYPE_BY_ADDRESS_TYPE } from '@suite-common/analytics';
import { type AddressType } from '@suite-common/wallet-types';
import { events, injectNativeAnalytics } from '@suite-native/analytics';
import { HStack, PressableOpacity, Text, VStack } from '@suite-native/atoms';
import { useCopyToClipboard } from '@suite-native/clipboard';
import { AddressFormatter } from '@suite-native/formatters';
import { Icon } from '@suite-native/icons';
import { useTranslate } from '@suite-native/intl';
import { useServices } from '@trezor/dependency-injection';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

type AssetDetailAddressFieldProps = {
    label: ReactNode;
    value: string;
    addressType: AddressType;
    testID: string;
};

const addressValueStyle = prepareNativeStyle(({ colors, borders }) => ({
    backgroundColor: colors.elementFillField,
    borderRadius: borders.radii.r12,
}));

export const AssetDetailAddressField = ({
    label,
    value,
    addressType,
    testID,
}: AssetDetailAddressFieldProps) => {
    const { applyStyle } = useNativeStyles();
    const { translate } = useTranslate();
    const copyToClipboard = useCopyToClipboard();
    const { analytics } = useServices(injectNativeAnalytics);

    const copyAddress = () => {
        void copyToClipboard(value);
        analytics.report({
            type: events.appCopyToClipboardEvent.name,
            payload: {
                from: 'asset-detail',
                type: COPY_TO_CLIPBOARD_TYPE_BY_ADDRESS_TYPE[addressType],
            },
        });
    };

    return (
        <VStack spacing="sp8" paddingVertical="sp8">
            <Text variant="body-xs" color="contentSecondary">
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
                    onPress={copyAddress}
                    testID={`${testID}/copy`}
                >
                    <Icon name="copy" color="contentSecondary" size="mediumLarge" />
                </PressableOpacity>
            </HStack>
        </VStack>
    );
};
