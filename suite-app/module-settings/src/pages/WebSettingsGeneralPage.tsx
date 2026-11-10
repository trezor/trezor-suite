import { TorSettings } from '@suite/tor-web';
import { SettingsGeneral } from '@trezor/suite';

export const WebSettingsGeneralPage = () => <SettingsGeneral torSettings={<TorSettings />} />;
