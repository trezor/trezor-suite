import { useSelector } from 'react-redux';

import { selectIsPortfolioTrackerDevice } from '@suite-common/device';
import { Box, Button, Card, Text, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { MegaphoneSvg } from './MegaphoneSvg';
import { VoucherCard } from './VoucherCard';
import { useReferAFriend } from '../hooks/useReferAFriend';

const cardsWrapperStyle = prepareNativeStyle(({ borders, colors }) => ({
    height: 140,
    borderTopLeftRadius: borders.radii.r16,
    borderTopRightRadius: borders.radii.r16,
    backgroundColor: colors.elementFillBrandSofter,
    overflow: 'hidden',
}));

const cardStyle = prepareNativeStyle(
    (_, { translateX, rotate }: { translateX: number; rotate: number }) => ({
        position: 'absolute',
        transform: `scale(0.7) translateX(${translateX}px) translateY(12px) rotate(${rotate}deg)`,
    }),
);

export const ReferAFriendCard = () => {
    const { applyStyle } = useNativeStyles();

    const isPortfolioTracker = useSelector(selectIsPortfolioTrackerDevice);

    const { rewardAmount } = useReferAFriend();

    if (isPortfolioTracker) {
        return null;
    }

    if (1 === 1) {
        return (
            <Card>
                <VStack marginBottom="sp8" alignItems="center" spacing="sp12">
                    <MegaphoneSvg />
                    <Box alignItems="center">
                        <Text variant="body-md-strong">
                            <Translation id="referAFriend.card.title" />
                        </Text>
                        <Text variant="body-md">
                            <Translation id="referAFriend.card.subtitle.disconnected" />
                        </Text>
                    </Box>
                </VStack>
            </Card>
        );
    }

    return (
        <Card noPadding>
            <Box style={applyStyle(cardsWrapperStyle)}>
                <VoucherCard style={applyStyle(cardStyle, { translateX: 20, rotate: 2 })} />
                <VoucherCard style={applyStyle(cardStyle, { translateX: -20, rotate: -5 })}>
                    <Text variant="headline-sm" color="contentOnDarkBrand">
                        {rewardAmount}
                    </Text>
                </VoucherCard>
            </Box>
            <VStack marginTop="sp12" marginHorizontal="sp16" marginBottom="sp16" spacing="sp12">
                <Box alignItems="center">
                    <Text variant="body-md-strong">
                        <Translation id="referAFriend.card.title" />
                    </Text>
                    <Text variant="body-md">
                        <Translation
                            id="referAFriend.card.subtitle.connected"
                            values={{ rewardAmount }}
                        />
                    </Text>
                </Box>
                <Button intent="neutral">
                    <Translation id="referAFriend.card.button" />
                </Button>
            </VStack>
        </Card>
    );
};
