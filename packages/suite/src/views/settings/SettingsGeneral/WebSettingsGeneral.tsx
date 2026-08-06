import { TorSettings } from '@suite/tor-web';

import { SettingsGeneral } from './SettingsGeneral';

export const WebSettingsGeneral = () => <SettingsGeneral torSettings={<TorSettings />} />;
