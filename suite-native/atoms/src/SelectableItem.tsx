import { type ReactNode } from 'react';
import { View } from 'react-native';

import { Translation } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { Badge } from './Badge';
import { Box } from './Box';
import { PressableOpacity } from './Pressable';
import { Radio } from './Radio';
import { VStack } from './Stack';
import { Text } from './Text';

const cardStyle = prepareNativeStyle((utils, { isSelected }: { isSelected: boolean }) => ({
    backgroundColor: utils.colors.surfaceFillRaised,
    borderRadius: utils.borders.radii.r16,
    padding: utils.spacings.sp16,
    ...utils.boxShadows.small,
    extend: [
        {
            condition: isSelected,
            style: {
                borderColor: utils.colors.contentBrand,
                borderWidth: utils.borders.widths.large,
                padding: utils.spacings.sp16 - utils.borders.widths.large,
                ...utils.boxShadows.medium,
            },
        },
    ],
}));

const titleWrapperStyle = prepareNativeStyle(_ => ({
    flexDirection: 'row',
    justifyContent: 'space-between',
}));

const radioWrapperStyle = prepareNativeStyle(utils => ({
    width: '100%',
    alignItems: 'flex-end',
    paddingTop: utils.spacings.sp12,
}));

const subtitleWrapperStyle = prepareNativeStyle(utils => ({
    paddingBottom: utils.spacings.sp4,
}));

const badgeWrapperStyle = prepareNativeStyle(utils => ({
    paddingTop: utils.spacings.sp4,
}));

type SelectableItemProps = {
    title: ReactNode;
    subtitle?: ReactNode;
    content?: ReactNode;
    isSelected: boolean;
    isDefault: boolean;
    testID?: string;
    onSelected: () => void;
};

export const SelectableItem = ({
    title,
    subtitle,
    content,
    isSelected,
    isDefault,
    onSelected,
}: SelectableItemProps) => {
    const { applyStyle, utils } = useNativeStyles();

    return (
        <PressableOpacity onPress={onSelected} style={applyStyle(cardStyle, { isSelected })}>
            <VStack spacing={utils.spacings.sp4}>
                <Box style={applyStyle(titleWrapperStyle)}>
                    <Text variant="headline-sm" color="contentPrimary">
                        {title}
                    </Text>
                    {isDefault && (
                        <View style={applyStyle(badgeWrapperStyle)}>
                            <Badge
                                key="defaultType"
                                variant="greenSubtle"
                                label={<Translation id="generic.default" />}
                                icon="checkCircle"
                            />
                        </View>
                    )}
                </Box>
                <Text
                    variant="body-sm"
                    color="contentPrimary"
                    style={applyStyle(subtitleWrapperStyle)}
                >
                    {subtitle}
                </Text>
                <Box>{content}</Box>
            </VStack>
            <View style={applyStyle(radioWrapperStyle)}>
                <Radio value="toggle" onPress={onSelected} isChecked={isSelected} />
            </View>
        </PressableOpacity>
    );
};
