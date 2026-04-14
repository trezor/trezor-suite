import { type NetworkSymbol } from '@suite-common/wallet-config';
import {
    BottomSheetModal,
    Card,
    HStack,
    PressableOpacity,
    Text,
    VStack,
    useBottomSheetModal,
} from '@suite-native/atoms';
import { Icon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { HowStakeWorksStakingTimeline } from './HowStakeWorksStakingTimeline';
import { HowStakeWorksUnstakingTimeline } from './HowStakeWorksUnstakingTimeline';

const timelineCardPressableStyle = prepareNativeStyle(() => ({
    width: '100%',
}));

type HowStakeWorksTimelineCardProps = {
    symbol: NetworkSymbol;
    entryPeriodInDays?: number;
    unstakingPeriodInDays?: number;
    apy?: number | null;
};

export const HowStakeWorksTimelineCard = ({
    symbol,
    entryPeriodInDays,
    unstakingPeriodInDays,
    apy,
}: HowStakeWorksTimelineCardProps) => {
    const { applyStyle } = useNativeStyles();
    const { bottomSheetRef, openModal, closeModal } = useBottomSheetModal();

    return (
        <>
            <PressableOpacity style={applyStyle(timelineCardPressableStyle)} onPress={openModal}>
                <Card borderColor="borderNeutral" noShadow>
                    <HStack alignItems="center" justifyContent="space-between">
                        <Text variant="body-md-strong">
                            <Translation id="earn.howStakeWorksScreen.timelineCardTitle" />
                        </Text>
                        <Icon name="caretDown" color="contentPrimary" />
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
                    <HowStakeWorksStakingTimeline entryPeriodInDays={entryPeriodInDays} apy={apy} />
                    <HowStakeWorksUnstakingTimeline
                        symbol={symbol}
                        unstakingPeriodInDays={unstakingPeriodInDays}
                    />
                </VStack>
            </BottomSheetModal>
        </>
    );
};
