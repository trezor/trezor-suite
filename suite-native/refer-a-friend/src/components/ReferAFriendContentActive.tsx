import { type ReferralProgramData, type ReferralRewards } from '@suite-common/refer-a-friend';
import { useAlert } from '@suite-native/alerts';
import {
    BannerFull,
    Box,
    Card,
    HStack,
    Input,
    Text,
    TextButton,
    VStack,
} from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { CardBackgroundSvg } from './CardBackgroundSvg';
import { CopyLinkButton } from './CopyLinkButton';
import { FaqCollapsibleCard } from './FaqCollapsibleCard';
import { HowItWorksCollapsibleCard } from './HowItWorksCollapsibleCard';
import { RewardsCard } from './RewardsCard';

type ReferAFriendContentActiveProps = {
    programData: ReferralProgramData;
    referralLink: string;
    referralRewards: ReferralRewards;
};

const cardStyle = prepareNativeStyle(({ colors }) => ({
    backgroundColor: colors.surfaceFillBrandBold,
}));

const surfaceWrapperStyle = prepareNativeStyle(({ borders, colors }) => ({
    borderRadius: borders.radii.r12,
    backgroundColor: colors.surfaceFillRaised,
}));

export const ReferAFriendContentActive = ({
    programData,
    referralLink,
    referralRewards,
}: ReferAFriendContentActiveProps) => {
    const { applyStyle, utils } = useNativeStyles();
    const { showAlert } = useAlert();

    const showConditionsAlert = () => {
        showAlert({
            title: <Translation id="referAFriend.conditions.title" />,
            description: <Translation id="referAFriend.conditions.description" />,
            primaryButtonTitle: <Translation id="generic.buttons.gotIt" />,
        });
    };

    return (
        <VStack marginTop="sp8" spacing="sp16">
            {referralRewards.status === 'error' && (
                <BannerFull
                    title={<Translation id="referAFriend.errors.updateFailed.title" />}
                    description={<Translation id="referAFriend.errors.updateFailed.description" />}
                    intent="warning"
                />
            )}
            <Card style={applyStyle(cardStyle)}>
                <CardBackgroundSvg fillColor={utils.colors.elementFillOnDarkBoldDisabled} />
                <VStack spacing="sp12">
                    <Box>
                        <Text variant="body-md-strong" color="contentOnDarkPrimaryInverse">
                            <Translation id="referAFriend.card.title" />
                        </Text>
                        <Text variant="body-sm" color="contentOnDarkSecondaryInverse">
                            <Translation id="referAFriend.card.description" values={programData} />
                        </Text>
                    </Box>
                    <Box style={applyStyle(surfaceWrapperStyle)}>
                        <Input value={referralLink} readOnly lineBreakModeIOS="head" />
                    </Box>
                    <CopyLinkButton link={referralLink} />
                </VStack>
            </Card>
            <VStack marginTop="sp8" spacing="sp12">
                <HStack marginHorizontal="sp4" justifyContent="space-between">
                    <Text variant="body-md-strong">
                        <Translation id="referAFriend.rewards" />
                    </Text>
                    <TextButton iconLeft="info" priority="secondary" onPress={showConditionsAlert}>
                        <Translation id="referAFriend.conditions.title" />
                    </TextButton>
                </HStack>
                <RewardsCard programData={programData} rewards={referralRewards} />
            </VStack>
            <HowItWorksCollapsibleCard programData={programData} isProgramActive />
            <FaqCollapsibleCard programData={programData} isProgramActive />
        </VStack>
    );
};
