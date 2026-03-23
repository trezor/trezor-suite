import React from 'react';

import { Box, Card, HStack, Text } from '@suite-native/atoms';
import { Icon, type IconName } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { type EarnPromoSectionType } from '../types';

const cardStyle = prepareNativeStyle(_ => ({
    borderBottomWidth: 0,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    marginBottom: 0,
    overflow: 'hidden',
}));

type EarnPromoListHeaderProps = {
    item: EarnPromoSectionType;
};

export const EarnPromoListHeader = React.memo(({ item }: EarnPromoListHeaderProps) => {
    const { applyStyle } = useNativeStyles();

    const sectionIcon: IconName = item === 'staking' ? 'piggyBank' : 'coins';
    const sectionTitleTranslationId = item === 'staking' ? 'earn.staking' : 'earn.stablecoinYield';

    return (
        <Card borderColor="borderElevation1" noPadding noShadow style={applyStyle(cardStyle)}>
            <Box paddingHorizontal="sp20" paddingVertical="sp8">
                <HStack alignItems="center" spacing="sp8">
                    <Icon name={sectionIcon} color="iconSubdued" size="mediumLarge" />
                    <Text variant="body-md" color="textSubdued">
                        <Translation id={sectionTitleTranslationId} />
                    </Text>
                </HStack>
            </Box>
        </Card>
    );
});
