import { useSelector } from 'react-redux';

import { type RouteProp, useNavigation, useRoute } from '@react-navigation/native';

import type { DeviceRootState } from '@suite-common/device';
import { EVERSTAKE_TOTAL_STAKED_AMOUNT } from '@suite-common/wallet-constants';
import {
    type AccountsRootState,
    selectDeviceAccountsByNetworkSymbol,
} from '@suite-common/wallet-core';
import { Button, InlineAlertBox, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import {
    type RootStackParamList,
    RootStackRoutes,
    Screen,
    ScreenHeader,
    type StackNavigationProps,
} from '@suite-native/navigation';
import {
    type NativeStakingRootState,
    selectApy,
    selectEntryPeriodInDaysBySymbol,
    selectUnstakingPeriodInDaysBySymbol,
} from '@suite-native/staking';

import { HowStakeWorksBenefitsSection } from '../components/HowStakeWorksBenefitsSection';
import { HowStakeWorksHeaderSection } from '../components/HowStakeWorksHeaderSection';
import { HowStakeWorksTimelineCard } from '../components/HowStakeWorksTimelineCard';
import { useMessageSystemStaking } from '../hooks/useMessageSystemStaking';

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

    const handleContinue = () => {
        if (!resolvedAccountKey) {
            return;
        }

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

    const { isStakingDisabled, stakingMessageContent } = useMessageSystemStaking(symbol);

    return (
        <Screen header={<ScreenHeader closeActionType="back" />}>
            <VStack flex={1} justifyContent="space-between">
                <VStack alignItems="flex-start" spacing="sp32">
                    {/* TODO: replace with actual data */}
                    <HowStakeWorksHeaderSection
                        symbol={symbol}
                        totalStakedAmount={EVERSTAKE_TOTAL_STAKED_AMOUNT}
                    />
                    <HowStakeWorksBenefitsSection symbol={symbol} accountKey={resolvedAccountKey} />
                    <HowStakeWorksTimelineCard
                        symbol={symbol}
                        entryPeriodInDays={entryPeriodInDays}
                        unstakingPeriodInDays={unstakingPeriodInDays}
                        apy={apy}
                    />
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
