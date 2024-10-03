import { TouchableOpacity, View } from 'react-native';
import { ReactNode } from 'react';

import { Translation } from '@suite-native/intl';
import { useNativeStyles, prepareNativeStyle } from '@trezor/styles';

import { VStack } from './Stack';
import { Box } from './Box';
import { Badge } from './Badge';
import { Text } from './Text';
import { Radio } from './Radio';

const cardStyle = prepareNativeStyle((utils, { isSelected }: { isSelected: boolean }) => ({
    backgroundColor: utils.colors.backgroundSurfaceElevation1,
    borderRadius: utils.borders.radii.r16,
    padding: utils.spacings.sp16,
    ...utils.boxShadows.small,
    extend: [
        {
            condition: isSelected,
            style: {
                borderColor: utils.colors.iconPrimaryDefault,
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
        <TouchableOpacity
            onPress={onSelected}
            activeOpacity={0.6}
            style={applyStyle(cardStyle, { isSelected })}
        >
            <VStack spacing={utils.spacings.sp4}>
                <Box style={applyStyle(titleWrapperStyle)}>
                    <Text variant="titleSmall" color="textDefault">
                        {title}
                    </Text>
                    {isDefault && (
                        <View style={applyStyle(badgeWrapperStyle)}>
                            <Badge
                                key="defaultType"
                                variant="greenSubtle"
                                label={<Translation id="generic.default" />}
                                icon="checkCircleSolid"
                            />
                        </View>
                    )}
                </Box>
                <Text variant="hint" color="textDefault" style={applyStyle(subtitleWrapperStyle)}>
                    {subtitle}
                </Text>
                <Box>{content}</Box>
            </VStack>
            <View style={applyStyle(radioWrapperStyle)}>
                <Radio value="toggle" onPress={onSelected} isChecked={isSelected} />
            </View>
        </TouchableOpacity>
    );
};
