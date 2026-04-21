import { type RouteProp, useRoute } from '@react-navigation/native';

import { Button, Text, TimelineDetailsCard, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import {
    Screen,
    ScreenHeader,
    type YieldStackParamList,
    type YieldStackRoutes,
} from '@suite-native/navigation';

import { HowEarnWorksBenefitsSection } from '../components/HowEarnWorks/HowEarnWorksBenefitsSection';
import { HowEarnWorksHeaderSection } from '../components/HowEarnWorks/HowEarnWorksHeaderSection';
import { HowEarnWorksTimelineCard } from '../components/HowEarnWorks/HowEarnWorksTimelineCard';
import { useWorkInProgressAlert } from '../hooks/useWorkInProgressAlert';
import { useYieldOpportunityData } from '../hooks/useYieldOpportunityData';
import { createHowYieldWorksPreset } from '../presets/HowEarnWorks/yieldPresets';

export const HowYieldWorksScreen = () => {
    const route = useRoute<RouteProp<YieldStackParamList, YieldStackRoutes.HowYieldWorks>>();
    const { yieldId } = route.params;
    const handleShowWorkInProgressAlert = useWorkInProgressAlert();
    const { vault, apy, tokenSymbol, vaultTokenName } = useYieldOpportunityData({ yieldId });

    if (!vault) {
        return (
            <Screen header={<ScreenHeader closeActionType="back" />}>
                <VStack flex={1} justifyContent="center" alignItems="center">
                    <Text variant="body-md">
                        <Translation id="earn.notAvailable" />
                    </Text>
                </VStack>
            </Screen>
        );
    }

    const { benefitItems, timelineSections } = createHowYieldWorksPreset({
        tokenSymbol: tokenSymbol || '',
        vaultTokenName: vaultTokenName || '',
        apy,
    });

    return (
        <Screen header={<ScreenHeader closeActionType="back" />}>
            <VStack flex={1} justifyContent="space-between">
                <VStack alignItems="flex-start" spacing="sp32">
                    <HowEarnWorksHeaderSection
                        title={<Translation id="earn.howYieldWorksScreen.title" />}
                        subtitle={<Translation id="earn.howYieldWorksScreen.subtitle" />}
                    />
                    <HowEarnWorksBenefitsSection items={benefitItems} />
                    <HowEarnWorksTimelineCard
                        cardTitle={<Translation id="earn.howYieldWorksScreen.timelineCardTitle" />}
                        bottomSheetTitle={
                            <Translation id="earn.howYieldWorksScreen.timelineBottomSheetTitle" />
                        }
                    >
                        {timelineSections.map(section => (
                            <TimelineDetailsCard
                                key={section.id}
                                headerTitle={section.title}
                                headerIconName={section.iconName}
                                items={section.items}
                            />
                        ))}
                    </HowEarnWorksTimelineCard>
                </VStack>
                <Button onPress={handleShowWorkInProgressAlert}>
                    <Translation id="generic.buttons.continue" />
                </Button>
            </VStack>
        </Screen>
    );
};
