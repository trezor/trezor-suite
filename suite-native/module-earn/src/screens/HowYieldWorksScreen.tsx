import { type RouteProp, useNavigation, useRoute } from '@react-navigation/native';

import { events } from '@suite-common/analytics';
import { useServices } from '@suite-common/dependency-injection';
import { selectNativeAnalyticsDep } from '@suite-native/analytics';
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
import { useApyBreakdownAlert } from '../hooks/useApyBreakdownAlert';
import { useNavigateBackAnalytics } from '../hooks/useNavigateBackAnalytics';
import { useResolvedYieldFlowData } from '../hooks/useResolvedYieldFlowData';
import { createHowYieldWorksPreset } from '../presets/HowEarnWorks/yieldPresets';

type NavigationProps = StackNavigationProps<YieldStackParamList, YieldStackRoutes.HowYieldWorks>;

export const HowYieldWorksScreen = () => {
    const navigation = useNavigation<NavigationProps>();
    const route = useRoute<RouteProp<YieldStackParamList, YieldStackRoutes.HowYieldWorks>>();
    const {
        account,
        apy,
        vault,
        tokenSymbol,
        vaultTokenSymbol,
        bonusRewardTokenName,
        resolutionStatus,
    } = useResolvedYieldFlowData(route.params);

    const apyBreakdownAlert = useApyBreakdownAlert({ account, vault, apy });
    const { analytics } = useServices(selectNativeAnalyticsDep);
    const registerNavigateBackAnalytics = useNavigateBackAnalytics({
        type: events.yieldNavigateEvent.name,
        payload: {
            action: 'cancel',
            from: 'deposit-in-a-nutshell-modal',
            to: 'deposit-in-a-nutshell-modal',
            networkSymbol: account?.symbol,
            vaultId: vault?.id,
        },
    });

    const handleNavigateToYieldConsents = () => {
        analytics.report({
            type: events.yieldNavigateEvent.name,
            payload: {
                action: 'continue',
                from: 'deposit-in-a-nutshell-modal',
                to: 'deposit-legal-modal',
                networkSymbol: account?.symbol,
                vaultId: vault?.id,
            },
        });
        registerNavigateBackAnalytics();
        navigation.navigate(YieldStackRoutes.YieldConsents, route.params);
    };

    const handleTimelineOpen = () => {
        analytics.report({
            type: events.yieldInteractionEvent.name,
            payload: {
                element: 'in-a-nutshell-process-tab',
                value: 'deposit',
                networkSymbol: account?.symbol,
                vaultId: vault?.id,
            },
        });
    };

    if (resolutionStatus !== 'resolved') {
        return null;
    }

    const { benefitItems, timelineSections } = createHowYieldWorksPreset({
        tokenSymbol,
        vaultTokenSymbol,
        apy,
        onApyPress: apyBreakdownAlert.onPress,
        bonusRewardTokenName,
    });

    return (
        <Screen header={<ScreenHeader closeActionType="back" />}>
            <VStack flex={1} justifyContent="space-between">
                <VStack alignItems="flex-start" spacing="sp32">
                    <HowEarnWorksHeaderSection
                        title={<Translation id="earn.howYieldWorksScreen.defiYieldTitle" />}
                        subtitle={<Translation id="earn.howYieldWorksScreen.defiYieldSubtitle" />}
                    />
                    <HowEarnWorksBenefitsSection items={benefitItems} />
                    <HowEarnWorksTimelineCard
                        cardTitle={<Translation id="earn.howYieldWorksScreen.timelineCardTitle" />}
                        bottomSheetTitle={
                            <Translation id="earn.howYieldWorksScreen.timelineBottomSheetTitle" />
                        }
                        onOpen={handleTimelineOpen}
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
