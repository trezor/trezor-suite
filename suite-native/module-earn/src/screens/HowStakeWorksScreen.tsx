import { useSelector } from 'react-redux';

import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';

import type { DeviceRootState } from '@suite-common/device';
import { AccountsRootState, selectDeviceAccountsByNetworkSymbol } from '@suite-common/wallet-core';
import { Button, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import {
    RootStackParamList,
    RootStackRoutes,
    Screen,
    ScreenHeader,
    StackNavigationProps,
} from '@suite-native/navigation';

import { HowStakeWorksBenefitsSection } from '../components/HowStakeWorksBenefitsSection';
import { HowStakeWorksHeaderSection } from '../components/HowStakeWorksHeaderSection';
import { HowStakeWorksTimelineCard } from '../components/HowStakeWorksTimelineCard';

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

    return (
        <Screen header={<ScreenHeader closeActionType="back" />}>
            <VStack flex={1} justifyContent="space-between">
                <VStack alignItems="flex-start" spacing={32}>
                    <HowStakeWorksHeaderSection symbol={symbol} totalStakedAmount="$469,500,000+" />
                    <HowStakeWorksBenefitsSection symbol={symbol} accountKey={resolvedAccountKey} />
                    <HowStakeWorksTimelineCard symbol={symbol} />
                </VStack>
                <Button onPress={handleContinue} isDisabled={!resolvedAccountKey}>
                    <Translation id="generic.buttons.continue" />
                </Button>
            </VStack>
        </Screen>
    );
};
