import { TouchableOpacity, View } from 'react-native';
import { ReactNode } from 'react';

import { useTranslate } from '@suite-native/intl';
import { useNativeStyles, prepareNativeStyle } from '@trezor/styles';

import { Card } from './Card/Card';
import { VStack } from './Stack';
import { Box } from './Box';
import { Badge } from './Badge';
import { Text } from './Text';
import { Radio } from './Radio';

const cardStyle = prepareNativeStyle((utils, { isSelected }: { isSelected: boolean }) => ({
    padding: utils.spacings.medium,
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

const titleWrapper = prepareNativeStyle(_ => ({
    flexDirection: 'row',
    justifyContent: 'space-between',
}));

const radioWrapper = prepareNativeStyle(_ => ({
    width: '100%',
    alignItems: 'flex-end',
    paddingTop: 12,
}));

const subtitleWrapper = prepareNativeStyle(utils => ({
    paddingBottom: utils.spacings.extraSmall,
}));

const badgeWrapper = prepareNativeStyle(utils => ({
    paddingTop: utils.spacings.extraSmall,
}));

type SelectableItemProps = {
    title: string;
    subtitle?: string;
    description?: ReactNode;
    isSelected: boolean;
    isDefault: boolean;
    onSelected: () => void;
};

export const SelectableItem = ({
    title,
    subtitle,
    description,
    isSelected,
    isDefault,
    onSelected,
}: SelectableItemProps) => {
    const { applyStyle, utils } = useNativeStyles();
    const { translate } = useTranslate();

    return (
        <TouchableOpacity onPress={onSelected} activeOpacity={0.6}>
            <Card style={applyStyle(cardStyle, { isSelected })}>
                <VStack spacing={utils.spacings.extraSmall}>
                    <Box style={applyStyle(titleWrapper)}>
                        <Text variant="titleSmall" color="textDefault">
                            {title}
                        </Text>
                        {isDefault && (
                            <View style={applyStyle(badgeWrapper)}>
                                <Badge
                                    key="defaultType"
                                    variant="green"
                                    label={translate('generic.default')}
                                    icon="checkCircle"
                                />
                            </View>
                        )}
                    </Box>
                    <Text variant="hint" color="textDefault" style={applyStyle(subtitleWrapper)}>
                        {subtitle}
                    </Text>
                    <Text>{description}</Text>
                </VStack>
                <View style={applyStyle(radioWrapper)}>
                    <Radio value="toggle" onPress={onSelected} isChecked={isSelected} />
                </View>
            </Card>
        </TouchableOpacity>
    );
};
