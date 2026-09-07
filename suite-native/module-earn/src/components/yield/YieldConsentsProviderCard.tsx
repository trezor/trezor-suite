import { useState } from 'react';

import { Box, Button, Card, CheckBox, HStack, Text, VStack } from '@suite-native/atoms';
import { Icon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import { Link } from '@suite-native/link';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';
import { MORPHO_DISCLAIMER_URL, TREZOR_SUITE_TOS_URL } from '@trezor/urls';

import { EarnConsentsItem } from '../earn/EarnConsentsItem';

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
    isConfirmLoading?: boolean;
    onConfirm: () => void;
};

export const YieldConsentsProviderCard = ({
    providerName,
    tokenSymbol,
    isConfirmLoading,
    onConfirm,
}: YieldConsentsProviderCardProps) => {
    const { applyStyle } = useNativeStyles();
    const [hasAgreed, setHasAgreed] = useState(false);

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
                <EarnConsentsItem iconName="warningCircle" color="contentPrimary">
                    <Translation
                        id="earn.yieldConsentsScreen.providerCard.thirdItem"
                        values={{ providerName }}
                    />
                </EarnConsentsItem>
                <HStack spacing="sp12" alignItems="center">
                    <CheckBox
                        isChecked={hasAgreed}
                        onChange={setHasAgreed}
                        testID="@earn/yield-consent/checkbox"
                    />
                    <Box flex={1}>
                        <Text>
                            <Translation
                                id="earn.yieldConsentsScreen.terms"
                                values={{
                                    providerName,
                                    tos: chunks => (
                                        <Link href={TREZOR_SUITE_TOS_URL} label={chunks} />
                                    ),
                                    disclaimer: chunks => (
                                        <Link href={MORPHO_DISCLAIMER_URL} label={chunks} />
                                    ),
                                }}
                            />
                        </Text>
                    </Box>
                </HStack>
            </VStack>
            <HStack style={applyStyle(buttonRowStyle)}>
                <Button
                    intent="info"
                    isDisabled={!hasAgreed}
                    isLoading={isConfirmLoading}
                    onPress={onConfirm}
                    style={applyStyle(buttonStyle)}
                >
                    <Translation id="generic.buttons.understand" />
                </Button>
            </HStack>
        </Card>
    );
};
