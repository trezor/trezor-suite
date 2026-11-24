import { MODAL_CONTEXT_DEVICE, type ModalState, closeModal, modalReducer } from '@suite/modal';
import { mockConnectDevice, mockSuiteDevice } from '@suite-common/suite-types/mocks';
import {
    act,
    createTestCompositionRoot,
    renderHookWithStoreProvider,
} from '@suite-common/test-utils';
import { UI_EVENTS, UI_REQUESTS } from '@trezor/connect';

import { useEarnDeviceStatus } from './useEarnDeviceStatus';
import { type MockSuiteState, mockInitialAppState } from '../../../mocks/mockInitialAppState';

type DeviceWindowType = Extract<ModalState, { context: typeof MODAL_CONTEXT_DEVICE }>['windowType'];

const renderDeviceStatus = (windowType: DeviceWindowType, connected = true) => {
    const { services } = createTestCompositionRoot<void, MockSuiteState>({
        preloadedState: {
            ...mockInitialAppState,
            device: {
                ...mockInitialAppState.device,
                selectedDevice: mockSuiteDevice({ connected, available: true }),
            },
            modal: { context: MODAL_CONTEXT_DEVICE, windowType, device: mockConnectDevice() },
        },
        reducer: (state = mockInitialAppState, action) => ({
            ...state,
            modal: modalReducer(state.modal, action),
        }),
    });

    return {
        ...renderHookWithStoreProvider(useEarnDeviceStatus, { services }),
        store: services.store,
    };
};

describe('useEarnDeviceStatus', () => {
    it.each([
        [UI_REQUESTS.REQUEST_PIN, 'pin'],
        [UI_EVENTS.PIN_INVALID, 'pin'],
        ['ButtonRequest_PinEntry', 'pin'],
        [UI_REQUESTS.REQUEST_PASSPHRASE, 'passphrase'],
        [UI_EVENTS.PASSPHRASE_ON_DEVICE, 'passphrase'],
        ['ButtonRequest_PassphraseEntry', 'passphrase'],
    ] as const)('maps the active %s prompt to %s', (windowType, expected) => {
        const { result } = renderDeviceStatus(windowType);

        expect(result.current).toBe(expected);
    });

    it('updates after the authorization prompt closes', () => {
        const { result, store } = renderDeviceStatus(UI_REQUESTS.REQUEST_PASSPHRASE);
        expect(result.current).toBe('passphrase');

        act(() => {
            store.dispatch(closeModal());
        });

        expect(result.current).toBe('connected');
    });

    it('does not report a stale prompt after disconnection', () => {
        const { result } = renderDeviceStatus(UI_REQUESTS.REQUEST_PIN, false);

        expect(result.current).toBe('disconnected');
    });
});
