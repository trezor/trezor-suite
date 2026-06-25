import {
    BottomSheetModal,
    type BottomSheetModalRef,
    Box,
    Button,
    Text,
    TimelineDetailsCard,
    VStack,
} from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

import { HowEarnWorksBenefitsSection } from './HowEarnWorks/HowEarnWorksBenefitsSection';
import { HowEarnWorksTimelineCard } from './HowEarnWorks/HowEarnWorksTimelineCard';
import { createHowYieldWorksPreset } from '../presets/HowEarnWorks/yieldPresets';

type YieldDepositInfoBottomSheetProps = {
    apy: number | null;
    onClose: () => void;
    ref: BottomSheetModalRef;
    tokenSymbol: string;
    vaultTokenSymbol: string;
};

export const YieldDepositInfoBottomSheet = ({
    apy,
    onClose,
    ref,
    tokenSymbol,
    vaultTokenSymbol,
}: YieldDepositInfoBottomSheetProps) => {
    const { benefitItems, timelineSections } = createHowYieldWorksPreset({
        apy,
        tokenSymbol,
        vaultTokenSymbol,
    });

    return (
        <BottomSheetModal
            ref={ref}
            title={<Translation id="earn.howYieldWorksScreen.title" />}
            isCloseDisplayed
            onClose={onClose}
            footer={
                <Box paddingHorizontal="sp24" paddingBottom="sp16">
                    <Button onPress={onClose}>
                        <Translation id="generic.buttons.gotIt" />
                    </Button>
                </Box>
            }
        >
            <VStack spacing="sp32">
                <Text variant="body-sm" color="contentSecondary">
                    <Translation id="earn.howYieldWorksScreen.subtitle" />
                </Text>
                <HowEarnWorksBenefitsSection items={benefitItems} />
                <HowEarnWorksTimelineCard
                    cardTitle={<Translation id="earn.howYieldWorksScreen.timelineCardTitle" />}
                    bottomSheetTitle={
                        <Translation id="earn.howYieldWorksScreen.timelineBottomSheetTitle" />
                    }
                >
                    <VStack spacing="sp24">
                        {timelineSections.map(section => (
                            <TimelineDetailsCard
                                key={section.id}
                                headerTitle={section.title}
                                headerIconName={section.iconName}
                                items={section.items}
                            />
                        ))}
                    </VStack>
                </HowEarnWorksTimelineCard>
            </VStack>
        </BottomSheetModal>
    );
};
