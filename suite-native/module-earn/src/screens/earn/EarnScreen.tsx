import { Context } from '@suite-common/message-system';
import { VStack } from '@suite-native/atoms';
import { DeviceManagerScreenHeader } from '@suite-native/device-manager';
import { ContextMessage } from '@suite-native/message-system';
import { Screen } from '@suite-native/navigation';

import { EarnPortfolioTrackerGuard } from '../../components/earn/EarnPortfolioTrackerGuard';
import { EarnPromoList } from '../../components/earn/EarnPromoList';
import { EarnScreenHeader } from '../../components/earn/EarnScreenHeader';

const EarnScreenContent = () => (
    <Screen header={<DeviceManagerScreenHeader />}>
        <VStack spacing="sp24">
            <ContextMessage context={Context.getEarnDashboard('staking')} />
            <ContextMessage context={Context.getEarnDashboard('yield')} />

            <EarnScreenHeader />
            <EarnPromoList />
        </VStack>
    </Screen>
);

export const EarnScreen = () => (
    <EarnPortfolioTrackerGuard>
        <EarnScreenContent />
    </EarnPortfolioTrackerGuard>
);
