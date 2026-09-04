import { useSelector } from 'react-redux';

import { type RouteProp, useNavigation, useRoute } from '@react-navigation/native';

import { useServices } from '@suite-common/dependency-injection';
import type { DeviceRootState } from '@suite-common/device';
import { getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import {
    type AccountsRootState,
    type StakeRootState,
    selectApy,
    selectDeviceAccountsByNetworkSymbol,
    selectEntryPeriodInDaysBySymbol,
    selectUnstakingPeriodInDaysBySymbol,
} from '@suite-common/wallet-core';
import { events, selectNativeAnalyticsDep } from '@suite-native/analytics';
import { BannerInline, Button, TimelineDetailsCard, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import {
    type RootStackParamList,
    RootStackRoutes,
    Screen,
    ScreenHeader,
    type StackNavigationProps,
} from '@suite-native/navigation';

import { HowEarnWorksBenefitsSection } from '../../components/earn/HowEarnWorks/HowEarnWorksBenefitsSection';
import { HowEarnWorksHeaderSection } from '../../components/earn/HowEarnWorks/HowEarnWorksHeaderSection';
import { HowEarnWorksTimelineCard } from '../../components/earn/HowEarnWorks/HowEarnWorksTimelineCard';
import { createHowStakeWorksPreset } from '../../components/earn/HowEarnWorks/stakePresets';
import { useNavigateBackAnalytics } from '../../hooks/earn/useNavigateBackAnalytics';
import { useMessageSystemStaking } from '../../hooks/staking/useMessageSystemStaking';

export const HowStakeWorksScreen = () => {
    const route = useRoute<RouteProp<RootStackParamList, RootStackRoutes.HowStakeWorksScreen>>();
    const { symbol, accountKey } = route.params;
    const navigation =
        useNavigation<
            StackNavigationProps<RootStackParamList, RootStackRoutes.HowStakeWorksScreen>
        >();

    const accounts = useSelector((state: AccountsRootState & DeviceRootState) =>
        selectDeviceAccountsByNetworkSymbol(state, symbol),
    );

    const resolvedAccountKey = accountKey || accounts[0]?.key;

    const { analytics } = useServices(selectNativeAnalyticsDep);
    const registerNavigateBackAnalytics = useNavigateBackAnalytics({
        type: events.stakingStakeEvent.name,
        payload: {
            action: 'cancel',
            step: 'stake-in-a-nutshell-modal',
            networkSymbol: symbol,
        },
    });

    const handleContinue = () => {
        if (!resolvedAccountKey) {
            return;
        }

        registerNavigateBackAnalytics();
        analytics.report({
            type: events.stakingStakeEvent.name,
            payload: {
                action: 'continue',
                step: 'stake-in-a-nutshell-modal',
                networkSymbol: symbol,
            },
        });
        navigation.navigate(RootStackRoutes.EarnForm, { accountKey: resolvedAccountKey });
    };

    const unstakingPeriodInDays = useSelector((state: StakeRootState) =>
        selectUnstakingPeriodInDaysBySymbol(state, symbol),
    );

    const entryPeriodInDays = useSelector((state: StakeRootState) =>
        selectEntryPeriodInDaysBySymbol(state, symbol),
    );

    const apy = useSelector((state: StakeRootState) => selectApy(state, { networkSymbol: symbol }));

    const displaySymbol = getNetworkDisplaySymbol(symbol);

    const { isStakingDisabled, stakingMessageContent } = useMessageSystemStaking(symbol);
    const { benefitItems, timelineSections } = createHowStakeWorksPreset({
        symbol,
        entryPeriodInDays,
        unstakingPeriodInDays,
        apy,
    });

    return (
        <Screen header={<ScreenHeader closeActionType="back" />}>
            <VStack flex={1} justifyContent="space-between">
                <VStack alignItems="flex-start" spacing="sp32">
                    {/* TODO: replace with actual data */}
                    <HowEarnWorksHeaderSection
                        title={
                            <Translation
                                id="earn.howStakeWorksScreen.title"
                                values={{ displaySymbol }}
                            />
                        }
                        subtitle={
                            <Translation
                                id="earn.howStakeWorksScreen.subtitle"
                                values={{ displaySymbol }}
                            />
                        }
                    />
                    <HowEarnWorksBenefitsSection items={benefitItems} />
                    <HowEarnWorksTimelineCard
                        cardTitle={<Translation id="earn.howStakeWorksScreen.timelineCardTitle" />}
                        bottomSheetTitle={
                            <Translation id="earn.howStakeWorksScreen.timelineBottomSheetTitle" />
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
                {isStakingDisabled && stakingMessageContent && (
                    <BannerInline intent="warning" title={stakingMessageContent} />
                )}
                <Button
                    onPress={handleContinue}
                    isDisabled={!resolvedAccountKey || isStakingDisabled}
                >
                    <Translation id="generic.buttons.continue" />
                </Button>
            </VStack>
        </Screen>
    );
};
