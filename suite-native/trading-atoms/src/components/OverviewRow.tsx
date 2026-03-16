import { type ReactNode } from 'react';
import { Pressable } from 'react-native';

import { Box, HStack, InlineAlertBox, Text, VStack } from '@suite-native/atoms';
import { Icon } from '@suite-native/icons';
import { useTranslate } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

export type TradeOverviewOptionProps = {
    title: string;
    children: ReactNode;
    onPress?: () => void;
    noBottomBorder?: boolean;
    noCaret?: boolean;
    testID?: string;
    warning?: ReactNode;
};

const pressableStyle = prepareNativeStyle<{ noBottomBorder: boolean }>(
    ({ borders, colors }, { noBottomBorder }) => ({
        extend: [
            {
                condition: !noBottomBorder,
                style: {
                    borderBottomWidth: borders.widths.small,
                    borderBottomColor: colors.backgroundSurfaceElevation0,
                },
            },
        ],
    }),
);

export const OverviewRow = ({
    title,
    children,
    onPress,
    noBottomBorder = false,
    noCaret = false,
    testID,
    warning,
}: TradeOverviewOptionProps) => {
    const { applyStyle } = useNativeStyles();
    const { translate } = useTranslate();

    return (
        <Pressable
            onPress={onPress}
            accessible={true}
            accessibilityLabel={title}
            accessibilityRole="button"
            style={applyStyle(pressableStyle, { noBottomBorder })}
            testID={testID}
        >
            <VStack spacing={0}>
                <HStack paddingHorizontal="sp12" justifyContent="space-between">
                    <Box paddingVertical="sp20" paddingHorizontal="sp8" flex={0}>
                        <Text color="textDefault" variant="body-sm">
                            {title}
                        </Text>
                    </Box>
                    <HStack flex={1} justifyContent="flex-end" alignItems="center">
                        <Box flex={1} justifyContent="flex-end" alignItems="flex-end">
                            {children}
                        </Box>
                        {!noCaret && (
                            <Box flex={0}>
                                <Icon name="caretDown" size="medium" color="textSubdued" />
                            </Box>
                        )}
                    </HStack>
                </HStack>
                {warning && (
                    <Box paddingHorizontal="sp16" paddingBottom="sp12">
                        <InlineAlertBox
                            variant="warning"
                            title={warning}
                            accessibilityHint={translate('generic.warning')}
                        />
                    </Box>
                )}
            </VStack>
        </Pressable>
    );
};
