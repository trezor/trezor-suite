import { mockSuiteDevice } from '@suite-common/suite-types/mocks';

import { WATCH_ONLY_DEVICE_ID, portfolioTrackerDevice } from '../src/deviceConstants';
import { isVirtualDevice } from '../src/deviceUtils';

describe(isVirtualDevice.name, () => {
    it('detects the portfolio tracker device', () => {
        expect(isVirtualDevice(portfolioTrackerDevice)).toBe(true);
    });

    it('detects the watch-only accounts device', () => {
        expect(isVirtualDevice(mockSuiteDevice({ id: WATCH_ONLY_DEVICE_ID }))).toBe(true);
    });

    it('does not detect physical devices', () => {
        expect(isVirtualDevice(mockSuiteDevice({ id: 'device-id' }))).toBe(false);
    });

    it('does not detect devices without an id', () => {
        expect(isVirtualDevice(mockSuiteDevice({ id: null }))).toBe(false);
        expect(isVirtualDevice(undefined)).toBe(false);
    });
});
