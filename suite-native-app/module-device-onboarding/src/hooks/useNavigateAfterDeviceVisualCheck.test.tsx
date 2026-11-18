import type { PersistentDeviceData, TrezorDevice } from '@suite-common/suite-types';
import {
    defaultDevicePersistentData,
    mockStoredAuthenticateDeviceResult,
    mockSuiteDevice,
} from '@suite-common/suite-types/mocks';
import { DeviceOnboardingStackRoutes } from '@suite-native/navigation';
import { act, renderHookWithStoreProvider } from '@suite-native/test-utils-store';
import { DeviceModelInternal } from '@trezor/device-utils';

import { useNavigateAfterDeviceVisualCheck } from './useNavigateAfterDeviceVisualCheck';

const mockReplace = jest.fn();
const mockNavigateToInitialScreen = jest.fn();

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useNavigation: () => ({ replace: mockReplace }),
}));

jest.mock('@suite-native/navigation', () => ({
    ...jest.requireActual('@suite-native/navigation'),
    useNavigateToInitialScreen: () => mockNavigateToInitialScreen,
}));

const DEVICE_ID = 'device-id';

type RenderParams = {
    device: TrezorDevice;
    persistentDeviceData?: Partial<PersistentDeviceData>;
    enabledNetworks?: string[];
};

const renderUseNavigateAfterDeviceVisualCheck = ({
    device,
    persistentDeviceData,
    enabledNetworks = [],
}: RenderParams) =>
    renderHookWithStoreProvider(() => useNavigateAfterDeviceVisualCheck(), {
        preloadedState: {
            appSettings: { isDeviceAuthenticityCheckEnabled: true },
            device: { selectedDevice: device, devices: [device] },
            persistentDeviceData: {
                devices: [
                    {
                        ...defaultDevicePersistentData,
                        device_id: DEVICE_ID,
                        internal_model: device.features?.internal_model,
                        ...persistentDeviceData,
                    },
                ],
            },
            wallet: { settings: { enabledNetworks } },
            firmware: {},
            thp: {},
        },
    });

// Without a firmware release, the firmware update is not offered.
const withoutFirmwareRelease = (device: TrezorDevice): TrezorDevice => ({
    ...device,
    firmwareReleaseConfigInfo: undefined,
});

const mockInitializedDevice = (internalModel: DeviceModelInternal) =>
    withoutFirmwareRelease(
        mockSuiteDevice(
            { id: DEVICE_ID, connected: true, available: true },
            { internal_model: internalModel, bootloader_locked: true },
        ),
    );

describe(useNavigateAfterDeviceVisualCheck.name, () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('continues to the authenticity check for initialized device without its record', async () => {
        const { result } = await renderUseNavigateAfterDeviceVisualCheck({
            device: mockInitializedDevice(DeviceModelInternal.T3T1),
        });

        await act(() => result.current.navigateAfterDeviceVisualCheck());

        expect(mockReplace).toHaveBeenCalledWith(DeviceOnboardingStackRoutes.DeviceAuthenticity);
        expect(mockNavigateToInitialScreen).not.toHaveBeenCalled();
    });

    it('exits the onboarding for initialized device which already passed the authenticity check', async () => {
        const { result } = await renderUseNavigateAfterDeviceVisualCheck({
            device: mockInitializedDevice(DeviceModelInternal.T3T1),
            persistentDeviceData: { authenticityResult: mockStoredAuthenticateDeviceResult() },
            enabledNetworks: ['btc'],
        });

        await act(() => result.current.navigateAfterDeviceVisualCheck());

        expect(mockReplace).not.toHaveBeenCalled();
        expect(mockNavigateToInitialScreen).toHaveBeenCalled();
    });

    it('exits the onboarding for initialized device which does not require the authenticity check', async () => {
        const { result } = await renderUseNavigateAfterDeviceVisualCheck({
            device: mockInitializedDevice(DeviceModelInternal.T2T1),
        });

        await act(() => result.current.navigateAfterDeviceVisualCheck());

        expect(mockReplace).not.toHaveBeenCalled();
        expect(mockNavigateToInitialScreen).toHaveBeenCalled();
    });

    it('continues to the 2nd step of the manual check for device without firmware', async () => {
        const { result } = await renderUseNavigateAfterDeviceVisualCheck({
            device: withoutFirmwareRelease(
                mockSuiteDevice(
                    { connected: true, available: true, mode: 'bootloader', firmware: 'none' },
                    { initialized: false, firmware_present: false },
                ),
            ),
        });

        await act(() => result.current.navigateAfterDeviceVisualCheck());

        expect(mockReplace).toHaveBeenCalledWith(DeviceOnboardingStackRoutes.PackagingVisualCheck);
    });
});
