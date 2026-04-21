import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { type RouteProp, useNavigation, useRoute } from '@react-navigation/native';

import type { DeviceRootState } from '@suite-common/device';
import { useFormatters } from '@suite-common/formatters';
import { getNetworkDisplaySymbol, getNetworkDisplaySymbolName } from '@suite-common/wallet-config';
import {
    type AccountsRootState,
    selectDeviceAccountsByNetworkSymbol,
} from '@suite-common/wallet-core';
import { calculateRewards } from '@suite-common/wallet-utils';
import { events } from '@suite-native/analytics';
import { Button, InlineAlertBox, TimelineDetailsCard, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import {
    type RootStackParamList,
    RootStackRoutes,
    Screen,
    ScreenHeader,
    type StackNavigationProps,
} from '@suite-native/navigation';
import { useAnalytics } from '@suite-native/services';
import {
    type NativeStakingRootState,
    selectAccountCryptoBalanceWithStaking,
    selectApy,
    selectEntryPeriodInDaysBySymbol,
    selectUnstakingPeriodInDaysBySymbol,
    useSelector as useNativeStakingSelector,
} from '@suite-native/staking';

import { HowEarnWorksBenefitsSection } from '../components/HowEarnWorks/HowEarnWorksBenefitsSection';
import { HowEarnWorksHeaderSection } from '../components/HowEarnWorks/HowEarnWorksHeaderSection';
import { HowEarnWorksTimelineCard } from '../components/HowEarnWorks/HowEarnWorksTimelineCard';
import { useMessageSystemStaking } from '../hooks/useMessageSystemStaking';
import { useNavigateBackAnalytics } from '../hooks/useNavigateBackAnalytics';
import { createHowStakeWorksPreset } from '../presets/HowEarnWorks/stakePresets';

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

    const analytics = useAnalytics();
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

    const unstakingPeriodInDays = useSelector((state: NativeStakingRootState) =>
        selectUnstakingPeriodInDaysBySymbol(state, symbol),
    );

    const entryPeriodInDays = useSelector((state: NativeStakingRootState) =>
        selectEntryPeriodInDaysBySymbol(state),
    );

    const apy = useSelector((state: NativeStakingRootState) =>
        selectApy(state, { accountKey: resolvedAccountKey, networkSymbol: symbol }),
    );

    const { CryptoAmountFormatter } = useFormatters();
    const displaySymbol = getNetworkDisplaySymbol(symbol);
    const networkName = getNetworkDisplaySymbolName(symbol);
    const totalBalance = useNativeStakingSelector(state =>
        resolvedAccountKey ? selectAccountCryptoBalanceWithStaking(state, resolvedAccountKey) : '0',
    );
    const potentialRewards = useMemo(() => {
        const amount = calculateRewards(totalBalance, apy);

        return CryptoAmountFormatter.format(amount, {
            symbol,
            isBalance: true,
            withSymbol: false,
            isEllipsisAppended: false,
            maxDisplayedDecimals: 8,
        });
    }, [CryptoAmountFormatter, apy, symbol, totalBalance]);
    const { isStakingDisabled, stakingMessageContent } = useMessageSystemStaking(symbol);
    const { benefitItems, timelineSections } = createHowStakeWorksPreset({
        displaySymbol,
        potentialRewards,
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
                                values={{ networkName }}
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
                    <InlineAlertBox variant="warning" title={stakingMessageContent} />
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
