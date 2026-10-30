import { type PropsWithChildren } from 'react';

import { fireEvent, render } from '@testing-library/react';

import { type DesktopAnalyticsDep } from '@suite/analytics';
import { mockDesktopAnalytics } from '@suite/analytics/mocks';
import { setConnectionMode, toggleConnectionModal } from '@suite/device';
import { bluetoothActions, type selectAdapterStatus } from '@suite-common/bluetooth';
import { ServicesProvider, mock } from '@trezor/dependency-injection';
import { type Dispatch, type DispatchDep } from '@trezor/redux-utils';

import { SwitchDeviceContent } from './SwitchDevice';

type AdapterStatus = ReturnType<typeof selectAdapterStatus>;

const mockDispatch = mock<Dispatch>();
let mockAdapterStatus: AdapterStatus = 'enabled';

jest.mock('@suite/intl', () => ({ Translation: () => null }));
jest.mock('@trezor/components', () => ({
    Column: ({ children }: PropsWithChildren) => children,
    Button: ({ onClick }: { onClick: () => void }) => <button onClick={onClick}>Connect</button>,
}));
jest.mock('./DeviceItem/DeviceItem', () => ({ DeviceItem: () => null }));
jest.mock('./SwitchDeviceModal', () => ({ SwitchDeviceModal: () => null }));
jest.mock('@suite-common/bluetooth', () => ({
    ...jest.requireActual('@suite-common/bluetooth'),
    selectAdapterStatus: () => mockAdapterStatus,
}));
jest.mock('@suite-common/device', () => ({
    ...jest.requireActual('@suite-common/device'),
    selectDevices: () => [],
}));
jest.mock('src/hooks/suite', () => ({
    useSelector: (selector: () => unknown) => selector(),
}));

const clickConnectButton = (onCancel = jest.fn()) => {
    const services: DesktopAnalyticsDep & { store: DispatchDep } = {
        analytics: mockDesktopAnalytics(jest.fn()),
        store: { dispatch: mockDispatch },
    };
    const { getByRole } = render(
        <ServicesProvider services={services}>
            <SwitchDeviceContent cancelable onCancel={onCancel} />
        </ServicesProvider>,
    );

    fireEvent.click(getByRole('button'));
};

describe('SwitchDeviceContent connect button', () => {
    beforeEach(() => jest.clearAllMocks());

    it.each<AdapterStatus>(['enabled', 'disabled'])(
        'opens the connection modal without presetting the bluetooth mode (adapter %s)',
        adapterStatus => {
            mockAdapterStatus = adapterStatus;
            const onCancel = jest.fn();

            clickConnectButton(onCancel);

            expect(mockDispatch).toHaveBeenCalledWith(toggleConnectionModal());
            expect(mockDispatch).not.toHaveBeenCalledWith(setConnectionMode('bluetooth'));
            expect(onCancel).toHaveBeenCalledTimes(1);
        },
    );

    it('re-enables bluetooth auto-connect when the adapter is enabled', () => {
        mockAdapterStatus = 'enabled';

        clickConnectButton();

        expect(mockDispatch).toHaveBeenCalledWith(bluetoothActions.enableAutoConnect());
    });
});
