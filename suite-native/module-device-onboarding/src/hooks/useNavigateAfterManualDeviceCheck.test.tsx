import type {
    GetDeviceAuthenticityCheckSettingsDep,
    PersistentDeviceData,
    TrezorDevice,
} from '@suite-common/suite-types';
import {
    defaultDevicePersistentData,
    mockGetDeviceAuthenticityCheckSettings,
    mockStoredAuthenticateDeviceResult,
    mockSuiteDevice,
} from '@suite-common/suite-types/mocks';
import {
    AuthorizeDeviceStackRoutes,
    DeviceOnboardingStackRoutes,
    RootStackRoutes,
    navigationContainerRef,
} from '@suite-native/navigation';
import { act, renderHookWithStoreProvider } from '@suite-native/test-utils-store';
import { DeviceModelInternal } from '@trezor/device-utils';

import { useNavigateAfterManualDeviceCheck } from './useNavigateAfterManualDeviceCheck';

const mockReplace = jest.fn();

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useNavigation: () => ({ replace: mockReplace }),
}));

jest.mock('@suite-native/navigation', () => ({
    ...jest.requireActual('@suite-native/navigation'),
    navigationContainerRef: { reset: jest.fn() },
}));

const DEVICE_ID = 'device-id';

type RenderParams = {
    device: TrezorDevice;
    persistentDeviceData?: Partial<PersistentDeviceData>;
    enabledNetworks?: string[];
};

const renderUseNavigateAfterManualDeviceCheck = ({
    device,
    persistentDeviceData,
    enabledNetworks = [],
}: RenderParams) => {
    const services: GetDeviceAuthenticityCheckSettingsDep = {
        getDeviceAuthenticityCheckSettings: mockGetDeviceAuthenticityCheckSettings(),
    };

    return renderHookWithStoreProvider(() => useNavigateAfterManualDeviceCheck(), {
        preloadedState: {
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
        services,
    });
};

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

const getResetRouteScreen = () =>
    jest.mocked(navigationContainerRef.reset).mock.calls[0]?.[0]?.routes?.[1];

describe(useNavigateAfterManualDeviceCheck.name, () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('continues to the authenticity check for initialized device without its record', async () => {
        const { result } = await renderUseNavigateAfterManualDeviceCheck({
            device: mockInitializedDevice(DeviceModelInternal.T3T1),
        });

        await act(() => result.current.navigateAfterManualDeviceCheck());

        expect(mockReplace).toHaveBeenCalledWith(DeviceOnboardingStackRoutes.DeviceAuthenticity);
        expect(navigationContainerRef.reset).not.toHaveBeenCalled();
    });

    it('exits the onboarding for initialized device which already passed the authenticity check', async () => {
        const { result } = await renderUseNavigateAfterManualDeviceCheck({
            device: mockInitializedDevice(DeviceModelInternal.T3T1),
            persistentDeviceData: { authenticityResult: mockStoredAuthenticateDeviceResult() },
            enabledNetworks: ['btc'],
        });

        await act(() => result.current.navigateAfterManualDeviceCheck());

        expect(mockReplace).not.toHaveBeenCalled();
        expect(getResetRouteScreen()).toEqual({
            name: RootStackRoutes.AuthorizeDeviceStack,
            params: { screen: AuthorizeDeviceStackRoutes.ConnectingDevice },
        });
    });

    it('exits the onboarding to coin enabling for initialized device without enabled networks', async () => {
        const { result } = await renderUseNavigateAfterManualDeviceCheck({
            device: mockInitializedDevice(DeviceModelInternal.T2T1),
        });

        await act(() => result.current.navigateAfterManualDeviceCheck());

        expect(mockReplace).not.toHaveBeenCalled();
        expect(getResetRouteScreen()).toEqual({
            name: RootStackRoutes.AuthorizeDeviceStack,
            params: { screen: AuthorizeDeviceStackRoutes.CoinEnablingInit },
        });
    });

    it('continues to the 2nd step of the manual check for device without firmware', async () => {
        const { result } = await renderUseNavigateAfterManualDeviceCheck({
            device: withoutFirmwareRelease(
                mockSuiteDevice(
                    { connected: true, available: true, mode: 'bootloader', firmware: 'none' },
                    { initialized: false, firmware_present: false },
                ),
            ),
        });

        await act(() => result.current.navigateAfterManualDeviceCheck());

        expect(mockReplace).toHaveBeenCalledWith(
            DeviceOnboardingStackRoutes.ManualDeviceCheckWithoutFirmware,
        );
    });
});
