import { IconName } from '@trezor/icons';
import { SettingsStackRoutes } from './navigation/routes';

export type SettingItem = {
    title: string;
    description: string;
    iconName: IconName;
    route?: SettingsStackRoutes;
};
