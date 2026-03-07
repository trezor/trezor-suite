import { NetworkSymbol } from '@suite-common/wallet-config';
import {
    BottomSheetModal,
    Card,
    HStack,
    PressableOpacity,
    Text,
    TimelineDetailsCard,
    VStack,
    useBottomSheetModal,
} from '@suite-native/atoms';
import { Icon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

const timelineCardPressableStyle = prepareNativeStyle(() => ({
    width: '100%',
}));

type HowStakeWorksTimelineCardProps = {
    symbol: NetworkSymbol;
};

export const HowStakeWorksTimelineCard = ({ symbol }: HowStakeWorksTimelineCardProps) => {
    const { applyStyle } = useNativeStyles();
    const { bottomSheetRef, openModal, closeModal } = useBottomSheetModal();
    const uppercasedSymbol = symbol.toUpperCase();

    const stakingTimelineItems = [
        {
            id: 'staking.first',
            title: <Translation id="earn.howStakeWorksScreen.stakingTimeline.first.title" />,
            description: (
                <Translation id="earn.howStakeWorksScreen.stakingTimeline.first.description" />
            ),
        },
        {
            id: 'staking.second',
            title: <Translation id="earn.howStakeWorksScreen.stakingTimeline.second.title" />,
            description: (
                <Translation
                    id="earn.howStakeWorksScreen.stakingTimeline.second.description"
                    values={{ entryPeriod: '~72 days' }}
                />
            ),
        },
        {
            id: 'staking.third',
            title: <Translation id="earn.howStakeWorksScreen.stakingTimeline.third.title" />,
            description: (
                <Translation
                    id="earn.howStakeWorksScreen.stakingTimeline.third.description"
                    values={{ yearlyReward: '1.6% yearly' }}
                />
            ),
        },
    ];

    const unstakeTimelineCardItems = [
        {
            id: 'unstake.first',
            title: <Translation id="earn.howStakeWorksScreen.unstakeTimeline.first.title" />,
            description: (
                <Translation id="earn.howStakeWorksScreen.unstakeTimeline.first.description" />
            ),
        },
        {
            id: 'unstake.second',
            title: <Translation id="earn.howStakeWorksScreen.unstakeTimeline.second.title" />,
            description: (
                <Translation
                    id="earn.howStakeWorksScreen.unstakeTimeline.second.description"
                    values={{ unstakingPeriod: '~10 days' }}
                />
            ),
        },
        {
            id: 'unstake.third',
            title: (
                <Translation
                    id="earn.howStakeWorksScreen.unstakeTimeline.third.title"
                    values={{ symbol: uppercasedSymbol }}
                />
            ),
            description: (
                <Translation id="earn.howStakeWorksScreen.unstakeTimeline.third.description" />
            ),
        },
        {
            id: 'unstake.fourth',
            title: (
                <Translation
                    id="earn.howStakeWorksScreen.unstakeTimeline.fourth.title"
                    values={{ symbol: uppercasedSymbol }}
                />
            ),
            description: (
                <Translation id="earn.howStakeWorksScreen.unstakeTimeline.fourth.description" />
            ),
        },
    ];

    return (
        <>
            <PressableOpacity style={applyStyle(timelineCardPressableStyle)} onPress={openModal}>
                <Card borderColor="borderElevation1" noShadow>
                    <HStack alignItems="center" justifyContent="space-between">
                        <Text variant="body-md-strong">
                            <Translation id="earn.howStakeWorksScreen.timelineCardTitle" />
                        </Text>
                        <Icon name="caretDown" color="textDefault" />
                    </HStack>
                </Card>
            </PressableOpacity>

            <BottomSheetModal
                ref={bottomSheetRef}
                title={<Translation id="earn.howStakeWorksScreen.timelineBottomSheetTitle" />}
                isCloseDisplayed
                onClose={closeModal}
            >
                <VStack spacing="sp24">
                    <TimelineDetailsCard
                        headerTitle={
                            <Translation id="earn.howStakeWorksScreen.stakingTimelineTitle" />
                        }
                        headerIconName="arrowUpRight"
                        items={stakingTimelineItems}
                    />
                    <TimelineDetailsCard
                        headerTitle={
                            <Translation id="earn.howStakeWorksScreen.unstakeTimelineTitle" />
                        }
                        headerIconName="arrowUpRight"
                        items={unstakeTimelineCardItems}
                    />
                </VStack>
            </BottomSheetModal>
        </>
    );
};
