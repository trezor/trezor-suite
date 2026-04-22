import { type RouteProp, useNavigation, useRoute } from '@react-navigation/native';

import { Button, TimelineDetailsCard, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import {
    Screen,
    ScreenHeader,
    type StackNavigationProps,
    type YieldStackParamList,
    YieldStackRoutes,
} from '@suite-native/navigation';

import { HowEarnWorksBenefitsSection } from '../components/HowEarnWorks/HowEarnWorksBenefitsSection';
import { HowEarnWorksHeaderSection } from '../components/HowEarnWorks/HowEarnWorksHeaderSection';
import { HowEarnWorksTimelineCard } from '../components/HowEarnWorks/HowEarnWorksTimelineCard';
import { useResolvedYieldFlowData } from '../hooks/useResolvedYieldFlowData';
import { createHowYieldWorksPreset } from '../presets/HowEarnWorks/yieldPresets';

type NavigationProps = StackNavigationProps<YieldStackParamList, YieldStackRoutes.HowYieldWorks>;

export const HowYieldWorksScreen = () => {
    const navigation = useNavigation<NavigationProps>();
    const route = useRoute<RouteProp<YieldStackParamList, YieldStackRoutes.HowYieldWorks>>();
    const { vault, apy, tokenSymbol, vaultTokenName, resolutionStatus } = useResolvedYieldFlowData(
        route.params,
    );

    const handleNavigateToYieldConsents = () => {
        navigation.navigate(YieldStackRoutes.YieldConsents, route.params);
    };

    if (resolutionStatus !== 'resolved' || !vault) {
        return null;
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
                <Button onPress={handleNavigateToYieldConsents}>
                    <Translation id="generic.buttons.continue" />
                </Button>
            </VStack>
        </Screen>
    );
};
