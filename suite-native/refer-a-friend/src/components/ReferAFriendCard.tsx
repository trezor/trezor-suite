import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import {
    selectIsReferralWalletDescriptorAvailable,
    selectReferralLink,
    selectReferralProgramData,
} from '@suite-common/refer-a-friend';
import { selectHasRunningDiscovery } from '@suite-common/wallet-core';
import { useAlert } from '@suite-native/alerts';
import { Box, Button, Card, Text, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import {
    ReferAFriendStackRoutes,
    type RootStackParamList,
    RootStackRoutes,
    type StackNavigationProps,
} from '@suite-native/navigation';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { CardBackgroundSvg } from './CardBackgroundSvg';
import { CopyLinkButton } from './CopyLinkButton';
import { VoucherCard } from './VoucherCard';

type NavigationProps = StackNavigationProps<RootStackParamList, RootStackRoutes>;

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
    const navigation = useNavigation<NavigationProps>();
    const { applyStyle, utils } = useNativeStyles();
    const { showAlert } = useAlert();

    const programData = useSelector(selectReferralProgramData);
    const isReferralWalletDescriptorAvailable = useSelector(
        selectIsReferralWalletDescriptorAvailable,
    );
    const isDiscoveryRunning = useSelector(selectHasRunningDiscovery);
    const referralLink = useSelector(selectReferralLink);

    if (!programData) {
        return null;
    }

    const navigateToReferAFriend = () => {
        if (isReferralWalletDescriptorAvailable) {
            navigation.navigate(RootStackRoutes.ReferAFriendStack, {
                screen: ReferAFriendStackRoutes.ReferAFriend,
            });
        } else {
            showAlert({
                title: <Translation id="referAFriend.standardWalletRequired.title" />,
                description: <Translation id="referAFriend.standardWalletRequired.description" />,
                primaryButtonTitle: <Translation id="generic.buttons.gotIt" />,
            });
        }
    };

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
                            <Translation id="referAFriend.card.subtitle" values={programData} />
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
                        {programData.rewardAmount}
                    </Text>
                </VoucherCard>
            </Box>
            <VStack marginTop="sp12" marginHorizontal="sp16" marginBottom="sp16" spacing="sp12">
                <Box alignItems="center">
                    <Text variant="body-md-strong">
                        <Translation id="referAFriend.card.title" />
                    </Text>
                    <Text variant="body-md" color="contentSecondary">
                        <Translation id="referAFriend.card.subtitle" values={programData} />
                    </Text>
                </Box>
                <Button
                    intent="neutral"
                    onPress={navigateToReferAFriend}
                    isLoading={isDiscoveryRunning}
                >
                    <Translation id="referAFriend.title" />
                </Button>
            </VStack>
        </Card>
    );
};
