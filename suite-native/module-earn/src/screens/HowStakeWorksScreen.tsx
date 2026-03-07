import { RouteProp, useRoute } from '@react-navigation/native';

import { Button, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import {
    RootStackParamList,
    RootStackRoutes,
    Screen,
    ScreenHeader,
} from '@suite-native/navigation';

import { HowStakeWorksBenefitsSection } from '../components/HowStakeWorksBenefitsSection';
import { HowStakeWorksHeaderSection } from '../components/HowStakeWorksHeaderSection';
import { HowStakeWorksTimelineCard } from '../components/HowStakeWorksTimelineCard';

export const HowStakeWorksScreen = () => {
    const route = useRoute<RouteProp<RootStackParamList, RootStackRoutes.HowStakeWorksScreen>>();
    const { symbol, accountKey } = route.params;

    return (
        <Screen header={<ScreenHeader closeActionType="back" />}>
            <VStack flex={1} justifyContent="space-between">
                <VStack alignItems="flex-start" spacing={32}>
                    <HowStakeWorksHeaderSection symbol={symbol} totalStakedAmount="$469,500,000+" />
                    <HowStakeWorksBenefitsSection symbol={symbol} accountKey={accountKey} />
                    <HowStakeWorksTimelineCard symbol={symbol} />
                </VStack>
                <Button>
                    <Translation id="generic.buttons.continue" />
                </Button>
            </VStack>
        </Screen>
    );
};
