import { type Route } from '@suite/router';
import { GearSixIcon } from '@trezor/icons';

import { NavigationItem } from './NavigationItem';

const SETTINGS_ROUTES: Route['name'][] = [
    'settings-index',
    'settings-device',
    'settings-coins',
    'settings-debug',
    'settings-connected-apps',
];

export const SettingsNavigationItem = () => (
    <NavigationItem
        nameId="TR_SETTINGS"
        icon={GearSixIcon}
        goToRoute="settings-index"
        routes={SETTINGS_ROUTES}
        data-testid="@suite/menu/settings"
        shortcut={['MOD', 'COMMA']}
    />
);
