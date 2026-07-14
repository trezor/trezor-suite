import { useCallback } from 'react';

import { type RouteProp, useNavigation, useRoute } from '@react-navigation/native';

import { isApyAvailable } from '@suite-common/wallet-utils';
import { useAlert } from '@suite-native/alerts';
import { Button, TimelineDetailsCard, VStack } from '@suite-native/atoms';
import { Translation, useTranslate } from '@suite-native/intl';
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
import { StablecoinYieldApyBreakdown } from '../components/StablecoinYieldApyBreakdown';
import { useResolvedYieldFlowData } from '../hooks/useResolvedYieldFlowData';
import { createHowYieldWorksPreset } from '../presets/HowEarnWorks/yieldPresets';

type NavigationProps = StackNavigationProps<YieldStackParamList, YieldStackRoutes.HowYieldWorks>;

export const HowYieldWorksScreen = () => {
    const navigation = useNavigation<NavigationProps>();
    const route = useRoute<RouteProp<YieldStackParamList, YieldStackRoutes.HowYieldWorks>>();
    const { showAlert } = useAlert();
    const { translate } = useTranslate();
    const {
        account,
        apy,
        vault,
        tokenSymbol,
        vaultTokenSymbol,
        bonusRewardTokenName,
        resolutionStatus,
    } = useResolvedYieldFlowData(route.params);

    const apyValueText = apy && isApyAvailable(apy) ? `~${apy.toFixed(2)}%` : null;

    const handleNavigateToYieldConsents = () => {
        navigation.navigate(YieldStackRoutes.YieldConsents, route.params);
    };

    const onApyPress = useCallback(() => {
        if (!account || !vault) {
            return;
        }

        showAlert({
            title: vault.outputToken?.name ?? '',
            description: translate(
                'moduleAccounts.accountDetail.stablecoinYield.apyBreakdown.apyLabel',
                { apy: apyValueText },
            ),
            appendix: (
                <StablecoinYieldApyBreakdown
                    networkSymbol={account.symbol}
                    rewards={vault.rewardRate.components}
                    underlyingToken={vault.token}
                    tokenSymbol={vault.token.symbol}
                />
            ),
            textAlign: 'center',
            titleSpacing: 'sp4',
            primaryButtonTitle: translate('generic.buttons.close'),
            testID: '@account-detail/stablecoin-yield/apy-breakdown-alert',
        });
    }, [account, apyValueText, showAlert, translate, vault]);

    if (resolutionStatus !== 'resolved') {
        return null;
    }

    const { benefitItems, timelineSections } = createHowYieldWorksPreset({
        tokenSymbol,
        vaultTokenSymbol,
        apy,
        onApyPress,
        bonusRewardTokenName,
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
