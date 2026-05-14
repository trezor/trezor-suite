import { VStack } from '@suite-native/atoms';
import { isDevelopOrDebugEnv } from '@suite-native/config';
import { Translation } from '@suite-native/intl';
import { DynamicScreenHeader, Screen } from '@suite-native/navigation';

import { AnalyticsLogging } from '../components/AnalyticsLogging';
import { ComponentDemoCard } from '../components/ComponentDemoCard';
import { DangerZoneCard } from '../components/DangerZoneCard';
import { DebuggingCard } from '../components/DebuggingCard';
import { FeatureFlagsCard } from '../components/FeatureFlagsCard';
import { FirmwareSourceCard } from '../components/FirmwareSourceCard';
import { InfoCard } from '../components/InfoCard';
import { MessageSystemCard } from '../components/MessageSystemCard';
import { SuiteSyncQuotaManager } from '../components/SuiteSyncQuotaManager';
import { SuiteSyncRelaySettings } from '../components/SuiteSyncRelaySettings';
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
            {isDevelopOrDebugEnv() && <ComponentDemoCard />}
            <FeatureFlagsCard />
            <AnalyticsLogging />
            <TradingCard />
            <MessageSystemCard />
            <FirmwareSourceCard />
            <SuiteSyncRelaySettings />
            <SuiteSyncQuotaManager />
            <DebuggingCard />
            <DangerZoneCard />
        </VStack>
    </Screen>
);
