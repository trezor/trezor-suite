import { type SuiteSettingsRootState } from '@suite/settings';
import { type DeviceRootState } from '@suite-common/device';
import { type FirmwareUpdateState } from '@suite-common/firmware';
import { type TransportInfo } from '@trezor/connect';

type FirmwareUpgradeSuiteState = {
    suite: {
        torStatus: string;
        transport?: {
            transports: TransportInfo[];
        };
    };
};

export type FirmwareUpgradeRootState = DeviceRootState &
    SuiteSettingsRootState &
    FirmwareUpgradeSuiteState & {
        firmware: FirmwareUpdateState;
    };

export const selectHasTransportOfType =
    (type: TransportInfo['type']) => (state: FirmwareUpgradeSuiteState) =>
        state.suite.transport?.transports.some(transport => transport.type === type) ?? false;

export const selectIsTorEnabled = (state: FirmwareUpgradeSuiteState) =>
    state.suite.torStatus === 'Enabled' || state.suite.torStatus === 'Slow';
