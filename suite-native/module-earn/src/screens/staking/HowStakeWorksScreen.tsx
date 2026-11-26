import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { type RouteProp, useIsFocused, useNavigation, useRoute } from '@react-navigation/native';

import type { DeviceRootState } from '@suite-common/device';
import {
    type StakingRootState,
    selectStakeableStakingProductDescriptorBySymbol,
    useNetworkStakingPeriods,
    useNetworkStakingRate,
    useStakingAccess,
} from '@suite-common/earn-staking';
import {
    type AccountsRootState,
    type EarnOnboardingRootState,
    getEarnOpportunityKey,
    selectDeviceAccountsByNetworkSymbol,
    selectIsEarnOnboardingConfirmed,
} from '@suite-common/wallet-core';
import { events, injectNativeAnalytics } from '@suite-native/analytics';
import { AssetSymbol } from '@suite-native/assets';
import { BannerInline, Button, TimelineDetailsCard, VStack } from '@suite-native/atoms';
import { useStakingOperationMessage } from '@suite-native/earn';
import { Translation } from '@suite-native/intl';
import {
    type RootStackParamList,
    RootStackRoutes,
    Screen,
    ScreenHeader,
    type StackNavigationProps,
} from '@suite-native/navigation';
import { useServices } from '@trezor/dependency-injection';

import { EarnLoadingScreen } from '../../components/earn/EarnLoadingScreen';
import { HowEarnWorksBenefitsSection } from '../../components/earn/HowEarnWorks/HowEarnWorksBenefitsSection';
import { HowEarnWorksHeaderSection } from '../../components/earn/HowEarnWorks/HowEarnWorksHeaderSection';
import { HowEarnWorksTimelineCard } from '../../components/earn/HowEarnWorks/HowEarnWorksTimelineCard';
import { useHowStakeWorksPreset } from '../../components/earn/HowEarnWorks/stakePresets';
import { useNavigateBackAnalytics } from '../../hooks/earn/useNavigateBackAnalytics';

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
    const isFocused = useIsFocused();
    const isOnboardingConfirmed = useSelector((state: EarnOnboardingRootState) =>
        selectIsEarnOnboardingConfirmed(
            state,
            resolvedAccountKey,
            getEarnOpportunityKey({ type: 'staking', provider: 'everstake' }),
        ),
    );
    const stakingProductId = useSelector(
        (state: StakingRootState) =>
            selectStakeableStakingProductDescriptorBySymbol(state, symbol)?.id ?? null,
    );
    // Stake is withheld by a switch or the firmware, or left out of the platform's operations.
    const { operations } = useStakingAccess(stakingProductId);
    const isStakingDisabled = !operations.includes('stake');
    const stakingMessageContent = useStakingOperationMessage(stakingProductId, 'stake');

    const [hasShownOnboarding, setHasShownOnboarding] = useState(false);
    const shouldSkipToEarnForm =
        isOnboardingConfirmed &&
        !route.params.isInfoOnly &&
        !isStakingDisabled &&
        !hasShownOnboarding &&
        !!resolvedAccountKey;

    useEffect(() => {
        if (!shouldSkipToEarnForm && !hasShownOnboarding) {
            setHasShownOnboarding(true);
        }
    }, [shouldSkipToEarnForm, hasShownOnboarding]);

    useEffect(() => {
        if (isFocused && shouldSkipToEarnForm && resolvedAccountKey) {
            navigation.replace(RootStackRoutes.StakingForm, { accountKey: resolvedAccountKey });
        }
    }, [isFocused, shouldSkipToEarnForm, resolvedAccountKey, navigation]);

    const { analytics } = useServices(injectNativeAnalytics);
    const registerNavigateBackAnalytics = useNavigateBackAnalytics(
        {
            type: events.stakingStakeEvent.name,
            payload: {
                action: 'cancel',
                step: 'stake-in-a-nutshell-modal',
                networkSymbol: symbol,
            },
        },
        !route.params.isInfoOnly,
    );

    const handleContinue = () => {
        if (route.params.isInfoOnly) {
            registerNavigateBackAnalytics();
            navigation.goBack();

            return;
        }
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
        navigation.navigate(RootStackRoutes.StakingForm, { accountKey: resolvedAccountKey });
    };

    const { entryPeriodDays, exitPeriodDays } = useNetworkStakingPeriods(symbol);
    const { rate, rateKind } = useNetworkStakingRate({ networkSymbol: symbol });

    const { benefitItems, timelineSections } = useHowStakeWorksPreset({
        symbol,
        entryPeriodInDays: entryPeriodDays,
        unstakingPeriodInDays: exitPeriodDays,
        apy: rate,
        rateKind,
    });

    if (shouldSkipToEarnForm) {
        return <EarnLoadingScreen />;
    }

    return (
        <Screen header={<ScreenHeader closeActionType="back" />}>
            <VStack flex={1} justifyContent="space-between">
                <VStack alignItems="flex-start" spacing="sp32">
                    {/* TODO: replace with actual data */}
                    <HowEarnWorksHeaderSection
                        title={
                            <Translation
                                id="earn.howStakeWorksScreen.title"
                                values={{
                                    displaySymbol: (
                                        <AssetSymbol networkSymbol={symbol} variant="headline-md" />
                                    ),
                                }}
                            />
                        }
                        subtitle={
                            <Translation
                                id="earn.howStakeWorksScreen.subtitle"
                                values={{
                                    displaySymbol: (
                                        <AssetSymbol
                                            networkSymbol={symbol}
                                            variant="body-sm"
                                            color="contentSecondary"
                                        />
                                    ),
                                }}
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
                    isDisabled={
                        !route.params.isInfoOnly && (!resolvedAccountKey || isStakingDisabled)
                    }
                >
                    <Translation
                        id={
                            route.params.isInfoOnly
                                ? 'generic.buttons.close'
                                : 'generic.buttons.continue'
                        }
                    />
                </Button>
            </VStack>
        </Screen>
    );
};
