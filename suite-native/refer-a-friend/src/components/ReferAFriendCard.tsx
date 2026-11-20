import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { selectIsPortfolioTrackerDevice } from '@suite-common/device';
import { Box, Button, Card, Text, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import {
    type RootStackParamList,
    RootStackRoutes,
    type StackNavigationProps,
} from '@suite-native/navigation';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { CardBackgroundSvg } from './CardBackgroundSvg';
import { CopyLinkButton } from './CopyLinkButton';
import { VoucherCard } from './VoucherCard';
import { useReferAFriend } from '../hooks/useReferAFriend';

const cardStyle = prepareNativeStyle(({ colors }) => ({
    backgroundColor: colors.surfaceFillBrandBold,
}));

const voucherCardsStyle = prepareNativeStyle(({ borders, colors }) => ({
    height: 140,
    borderTopLeftRadius: borders.radii.r16,
    borderTopRightRadius: borders.radii.r16,
    backgroundColor: colors.elementFillBrandSofter,
    overflow: 'hidden',
}));

const voucherCardStyle = prepareNativeStyle(
    (_, { translateX, rotate }: { translateX: number; rotate: number }) => ({
        position: 'absolute',
        transform: `scale(0.7) translateX(${translateX}px) translateY(12px) rotate(${rotate}deg)`,
    }),
);

export const ReferAFriendCard = () => {
    const navigation = useNavigation<StackNavigationProps<RootStackParamList, RootStackRoutes>>();
    const { applyStyle, utils } = useNativeStyles();

    const isPortfolioTracker = useSelector(selectIsPortfolioTrackerDevice);

    const referAFriend = useReferAFriend();

    if (isPortfolioTracker || !referAFriend) {
        return null;
    }

    const { program, referralLink } = referAFriend;

    const navigateToReferAFriend = () => navigation.navigate(RootStackRoutes.ReferAFriend);

    if (referralLink) {
        return (
            <Card style={applyStyle(cardStyle)}>
                <CardBackgroundSvg fillColor={utils.colors.elementFillOnDarkBoldDisabled} />
                <VStack spacing="sp12">
                    <Box alignItems="center">
                        <Text variant="body-md-strong" color="contentOnDarkPrimaryInverse">
                            <Translation id="referAFriend.title" />
                        </Text>
                        <Text variant="body-md" color="contentOnDarkSecondaryInverse">
                            <Translation id="referAFriend.card.subtitle" values={program} />
                        </Text>
                    </Box>
                    <CopyLinkButton link={referralLink} />
                    <Button
                        intent="neutral"
                        priority="secondary"
                        isFloating
                        onPress={navigateToReferAFriend}
                    >
                        <Translation id="referAFriend.buttons.viewDetails" />
                    </Button>
                </VStack>
            </Card>
        );
    }

    return (
        <Card noPadding>
            <Box style={applyStyle(voucherCardsStyle)}>
                <VoucherCard style={applyStyle(voucherCardStyle, { translateX: 20, rotate: 2 })} />
                <VoucherCard style={applyStyle(voucherCardStyle, { translateX: -20, rotate: -5 })}>
                    <Text variant="headline-sm" color="contentOnDarkBrand">
                        {program.rewardAmount}
                    </Text>
                </VoucherCard>
            </Box>
            <VStack marginTop="sp12" marginHorizontal="sp16" marginBottom="sp16" spacing="sp12">
                <Box alignItems="center">
                    <Text variant="body-md-strong">
                        <Translation id="referAFriend.card.title" />
                    </Text>
                    <Text variant="body-md" color="contentSecondary">
                        <Translation id="referAFriend.card.subtitle" values={program} />
                    </Text>
                </Box>
                <Button intent="neutral" onPress={navigateToReferAFriend}>
                    <Translation id="referAFriend.title" />
                </Button>
            </VStack>
        </Card>
    );
};
