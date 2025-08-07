import { Translation } from '@suite-native/intl';
import { DynamicScreenHeader, Screen } from '@suite-native/navigation';

import { DevicesManagement } from '../components/ViewOnly/DevicesManagement';

export const SettingsAutoEjectScreen = () => (
    <Screen
        header={
            <DynamicScreenHeader
                title={<Translation id="moduleSettings.viewOnly.autoEject.title" />}
                subtitle={<Translation id="moduleSettings.viewOnly.autoEject.subtitle" />}
            />
        }
    >
        <DevicesManagement />
    </Screen>
);
