import { RequireExactlyOne } from 'type-fest';
import { G } from '@mobily/ts-belt';

import { VStack, HStack, Text, Box } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { Icon, IconName } from '@suite-common/icons';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Color } from '@trezor/theme';
import { TxKeyPath } from '@suite-native/intl';

const listItemStyle = prepareNativeStyle(() => ({
    width: '90%',
}));

const iconBackgroundStyle = prepareNativeStyle<{ color: Color }>((utils, { color }) => ({
    alignItems: 'center',
    justifyContent: 'center',
    width: utils.spacings.extraLarge,
    height: utils.spacings.extraLarge,
    borderRadius: 12,
    extend: {
        condition: G.isNotNullable(color),
        style: {
            backgroundColor: utils.colors[color],
            borderWidth: utils.borders.widths.small,
            borderColor: utils.colors.borderElevation1,
        },
    },
}));

type ListItemProps = RequireExactlyOne<
    {
        iconBackgroundColor?: Color;
        translationKey: TxKeyPath;
        iconColor?: Color;
        iconName: IconName;
        iconNumber: number;
    },
    'iconName' | 'iconNumber'
>;

const ListItem = ({
    iconName,
    iconColor,
    iconNumber,
    iconBackgroundColor = 'backgroundTertiaryDefaultOnElevation1',
    translationKey,
}: ListItemProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <HStack spacing={12} alignItems="center">
            <Box style={applyStyle(iconBackgroundStyle, { color: iconBackgroundColor })}>
                {iconNumber && <Text color={iconColor}>{iconNumber}</Text>}
                {iconName && <Icon name={iconName} color={iconColor} size="mediumLarge" />}
            </Box>
            <Text style={applyStyle(listItemStyle)}>
                <Translation id={translationKey} />
            </Text>
        </HStack>
    );
};

export const UninitializedDeviceModalAppendix = () => {
    return (
        <VStack>
            <Text variant="callout">
                <Translation id="moduleDevice.noSeedModal.appendix.title" />
            </Text>
            <VStack spacing="medium" paddingTop="large">
                <ListItem
                    iconNumber={1}
                    translationKey="moduleDevice.noSeedModal.appendix.lines.1"
                />

                <ListItem
                    iconNumber={2}
                    translationKey="moduleDevice.noSeedModal.appendix.lines.2"
                />

                <ListItem
                    iconName="checkCircle"
                    iconColor="iconDefaultInverted"
                    iconBackgroundColor="backgroundPrimaryDefault"
                    translationKey="moduleDevice.noSeedModal.appendix.lines.3"
                />
            </VStack>
        </VStack>
    );
};
