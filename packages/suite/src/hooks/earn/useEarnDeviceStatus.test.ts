import { renderHook } from '@testing-library/react';

import { MODAL_CONTEXT_DEVICE, MODAL_CONTEXT_NONE } from '@suite/modal';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { UI_EVENTS, UI_REQUESTS } from '@trezor/connect';

import { useEarnDeviceStatus } from './useEarnDeviceStatus';

let mockDevice = mockSuiteDevice({ connected: true, available: true });
let mockModal: object = { context: MODAL_CONTEXT_NONE };

jest.mock('@suite/device', () => ({ useDevice: () => ({ device: mockDevice }) }));
jest.mock('src/hooks/suite', () => ({
    useSelector: (selector: (state: object) => unknown) => selector({ modal: mockModal }),
}));

describe('useEarnDeviceStatus', () => {
    beforeEach(() => {
        mockDevice = mockSuiteDevice({ connected: true, available: true });
        mockModal = { context: MODAL_CONTEXT_NONE };
    });

    it.each([
        [UI_REQUESTS.REQUEST_PIN, 'pin'],
        [UI_EVENTS.PIN_INVALID, 'pin'],
        ['ButtonRequest_PinEntry', 'pin'],
        [UI_REQUESTS.REQUEST_PASSPHRASE, 'passphrase'],
        [UI_EVENTS.PASSPHRASE_ON_DEVICE, 'passphrase'],
        ['ButtonRequest_PassphraseEntry', 'passphrase'],
    ])('maps the active %s prompt to %s', (windowType, expected) => {
        mockModal = { context: MODAL_CONTEXT_DEVICE, windowType };

        const { result } = renderHook(useEarnDeviceStatus);

        expect(result.current).toBe(expected);
    });

    it('updates after the authorization prompt closes', () => {
        mockModal = { context: MODAL_CONTEXT_DEVICE, windowType: UI_REQUESTS.REQUEST_PASSPHRASE };
        const { result, rerender } = renderHook(useEarnDeviceStatus);
        expect(result.current).toBe('passphrase');

        mockModal = { context: MODAL_CONTEXT_NONE };
        rerender();

        expect(result.current).toBe('connected');
    });

    it('does not report a stale prompt after disconnection', () => {
        mockDevice = mockSuiteDevice({ connected: false });
        mockModal = { context: MODAL_CONTEXT_DEVICE, windowType: UI_REQUESTS.REQUEST_PIN };
        const { result } = renderHook(useEarnDeviceStatus);

        expect(result.current).toBe('disconnected');
    });
});
