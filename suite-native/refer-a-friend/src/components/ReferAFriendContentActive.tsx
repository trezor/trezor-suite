import { useAlert } from '@suite-native/alerts';
import { Box, Card, HStack, Input, Text, TextButton, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { CardBackgroundSvg } from './CardBackgroundSvg';
import { CopyLinkButton } from './CopyLinkButton';
import { FaqCollapsibleCard } from './FaqCollapsibleCard';
import { HowItWorksCollapsibleCard } from './HowItWorksCollapsibleCard';
import { RewardsCard } from './RewardsCard';
import { SurfaceWrapper } from './SurfaceWrapper';
import { type ProgramProps, type VoucherProps, type VoucherStats } from '../hooks/useReferAFriend';

type ReferAFriendContentActiveProps = {
    program: ProgramProps;
    referralLink: string;
    stats: VoucherStats;
    vouchers: VoucherProps[];
};

const cardStyle = prepareNativeStyle(({ colors }) => ({
    backgroundColor: colors.surfaceFillBrandBold,
}));

export const ReferAFriendContentActive = ({
    program,
    referralLink,
    stats,
    vouchers,
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
            <Card style={applyStyle(cardStyle)}>
                <CardBackgroundSvg fillColor={utils.colors.elementFillOnDarkBoldDisabled} />
                <VStack spacing="sp12">
                    <Box>
                        <Text variant="body-md-strong" color="contentOnDarkPrimaryInverse">
                            <Translation id="referAFriend.card.title" />
                        </Text>
                        <Text variant="body-sm" color="contentOnDarkSecondaryInverse">
                            <Translation id="referAFriend.card.description" values={program} />
                        </Text>
                    </Box>
                    <SurfaceWrapper>
                        <Input value={referralLink} readOnly />
                    </SurfaceWrapper>
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
                <RewardsCard program={program} stats={stats} vouchers={vouchers} />
            </VStack>
            <HowItWorksCollapsibleCard program={program} isProgramActive />
            <FaqCollapsibleCard program={program} isProgramActive />
        </VStack>
    );
};
