import { deviceInitialState } from '@suite-common/device';
import { messageSystemInitialState } from '@suite-common/message-system';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { FirmwareType } from '@trezor/device-utils';

import { selectIsMevProtectionSettingsVisible } from '../mevProtectionSettings';

describe('selectIsMevProtectionSettingsVisible', () => {
    const getState = (firmwareType: FirmwareType) => ({
        device: {
            ...deviceInitialState,
            selectedDevice: mockSuiteDevice({ firmwareType }),
        },
        messageSystem: messageSystemInitialState,
    });

    it('returns true for a device with universal firmware', () => {
        expect(selectIsMevProtectionSettingsVisible(getState(FirmwareType.Universal))).toBe(true);
    });

    it('returns false for a device with bitcoin-only firmware', () => {
        expect(selectIsMevProtectionSettingsVisible(getState(FirmwareType.BitcoinOnly))).toBe(
            false,
        );
    });
});
