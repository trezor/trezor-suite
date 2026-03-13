import { VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { DynamicScreenHeader, Screen } from '@suite-native/navigation';

import { AnalyticsLogging } from '../components/AnalyticsLogging';
import { DangerZoneCard } from '../components/DangerZoneCard';
import { DebuggingCard } from '../components/DebuggingCard';
import { FeatureFlagsCard } from '../components/FeatureFlagsCard';
import { FillSuiteSyncQuota } from '../components/FillSuiteSyncQuota';
import { FirmwareSourceCard } from '../components/FirmwareSourceCard';
import { InfoCard } from '../components/InfoCard';
import { MessageSystemCard } from '../components/MessageSystemCard';
import { SuiteSyncQuotaManager } from '../components/SuiteSyncQuotaManager';
import { SuiteSyncRelaySettings } from '../components/SuiteSyncRelaySettings';
import { TestnetsToggle } from '../components/TestnetsToggle';
import { TradingCard } from '../components/TradingCard';

export const DevUtilsScreen = () => (
    <Screen
        header={
            <DynamicScreenHeader
                title={<Translation id="moduleSettings.items.features.devUtils.title" />}
                subtitle={<Translation id="moduleSettings.items.features.devUtils.subtitle" />}
            />
        }
    >
        <VStack spacing="sp16">
            <InfoCard />
            <FeatureFlagsCard />
            <TestnetsToggle />
            <AnalyticsLogging />
            <TradingCard />
            <MessageSystemCard />
            <FirmwareSourceCard />
            <SuiteSyncRelaySettings />
            <SuiteSyncQuotaManager />
            <FillSuiteSyncQuota />
            <DebuggingCard />
            <DangerZoneCard />
        </VStack>
    </Screen>
);
