import { type YieldDtoV2 } from '@suite-common/earn-stablecoin-api';
import { type Account } from '@suite-common/wallet-types';
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

import { useApyBreakdownAlert } from '../hooks/useApyBreakdownAlert';
import { HowEarnWorksBenefitsSection } from './HowEarnWorks/HowEarnWorksBenefitsSection';
import { HowEarnWorksTimelineCard } from './HowEarnWorks/HowEarnWorksTimelineCard';
import { createHowYieldWorksPreset } from '../presets/HowEarnWorks/yieldPresets';

type YieldDepositInfoBottomSheetProps = {
    apy: number | null;
    bonusRewardTokenSymbol?: string | null;
    onClose: () => void;
    ref: BottomSheetModalRef;
    tokenSymbol: string;
    vaultTokenSymbol: string;
    account: Account;
    vault: YieldDtoV2;
};

export const YieldDepositInfoBottomSheet = ({
    apy,
    bonusRewardTokenSymbol,
    onClose,
    ref,
    tokenSymbol,
    vaultTokenSymbol,
    account,
    vault,
}: YieldDepositInfoBottomSheetProps) => {
    const apyBreakdownAlert = useApyBreakdownAlert({ account, vault, apy });

    const { benefitItems, timelineSections } = createHowYieldWorksPreset({
        apy,
        onApyPress: apyBreakdownAlert.onPress,
        bonusRewardTokenSymbol,
        tokenSymbol,
        vaultTokenSymbol,
    });

    return (
        <BottomSheetModal
            ref={ref}
            title={<Translation id="earn.howYieldWorksScreen.defiYieldTitle" />}
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
                    <Translation id="earn.howYieldWorksScreen.defiYieldSubtitle" />
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
