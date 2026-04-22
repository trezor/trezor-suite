import { Button, Card, HStack, Text, VStack } from '@suite-native/atoms';
import { Icon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { EarnConsentsItem } from './EarnConsentsItem';

const headerSectionStyle = prepareNativeStyle(utils => ({
    paddingVertical: utils.spacings.sp12,
    paddingHorizontal: utils.spacings.sp16,
    borderBottomWidth: utils.borders.widths.small,
    borderBottomColor: utils.colors.borderNeutral,
}));

const itemsSectionStyle = prepareNativeStyle(utils => ({
    padding: utils.spacings.sp16,
    paddingBottom: utils.spacings.sp24,
}));

const buttonRowStyle = prepareNativeStyle(utils => ({
    paddingHorizontal: utils.spacings.sp16,
    paddingBottom: utils.spacings.sp16,
}));

const buttonStyle = prepareNativeStyle(() => ({
    flex: 1,
}));

type YieldConsentsProviderCardProps = {
    providerName: string;
    tokenSymbol: string;
    onConfirm: () => void;
};

export const YieldConsentsProviderCard = ({
    providerName,
    tokenSymbol,
    onConfirm,
}: YieldConsentsProviderCardProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <Card noPadding>
            <HStack spacing="sp8" alignItems="center" style={applyStyle(headerSectionStyle)}>
                <Icon name="arrowUpRight" size="mediumLarge" color="contentSecondary" />
                <Text variant="body-sm" color="contentSecondary">
                    <Translation
                        id="earn.yieldConsentsScreen.providerCard.title"
                        values={{ providerName }}
                    />
                </Text>
            </HStack>
            <VStack spacing="sp16" style={applyStyle(itemsSectionStyle)}>
                <EarnConsentsItem iconName="file" color="contentPrimary">
                    <Translation
                        id="earn.yieldConsentsScreen.providerCard.firstItem"
                        values={{ providerName, tokenSymbol }}
                    />
                </EarnConsentsItem>
                <EarnConsentsItem iconName="shieldWarning" color="contentPrimary">
                    <Translation
                        id="earn.yieldConsentsScreen.providerCard.secondItem"
                        values={{ providerName }}
                    />
                </EarnConsentsItem>
            </VStack>
            <HStack style={applyStyle(buttonRowStyle)}>
                <Button intent="info" onPress={onConfirm} style={applyStyle(buttonStyle)}>
                    <Translation id="generic.buttons.understand" />
                </Button>
            </HStack>
        </Card>
    );
};
