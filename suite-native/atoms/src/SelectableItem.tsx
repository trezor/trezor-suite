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
    borderRadius: utils.borders.radii.medium,
    padding: utils.spacings.medium,
    ...utils.boxShadows.small,
    extend: [
        {
            condition: isSelected,
            style: {
                borderColor: utils.colors.iconPrimaryDefault,
                borderWidth: utils.borders.widths.large,
                padding: utils.spacings.medium - utils.borders.widths.large,
                ...utils.boxShadows.medium,
            },
        },
    ],
}));

const titleWrapperStyle = prepareNativeStyle(_ => ({
    flexDirection: 'row',
    justifyContent: 'space-between',
}));

const radioWrapperStyle = prepareNativeStyle(_ => ({
    width: '100%',
    alignItems: 'flex-end',
    paddingTop: 12,
}));

const subtitleWrapperStyle = prepareNativeStyle(utils => ({
    paddingBottom: utils.spacings.extraSmall,
}));

const badgeWrapperStyle = prepareNativeStyle(utils => ({
    paddingTop: utils.spacings.extraSmall,
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
            <VStack spacing={utils.spacings.extraSmall}>
                <Box style={applyStyle(titleWrapperStyle)}>
                    <Text variant="titleSmall" color="textDefault">
                        {title}
                    </Text>
                    {isDefault && (
                        <View style={applyStyle(badgeWrapperStyle)}>
                            <Badge
                                key="defaultType"
                                variant="green"
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
