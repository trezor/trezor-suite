import { type TrezorDevice } from '@suite-common/suite-types';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { type DiscoveryStatus, type DiscoveryTrigger } from '@suite-common/wallet-types';
import { type Device, asDeviceUniquePath } from '@trezor/connect';
import { createMockDispatch } from '@trezor/redux-utils/mocks';

import { type EjectAllWalletsThunkState, ejectAllWalletsThunk } from './ejectAllWalletsThunk';

type ForgetDisconnectedDevicesParams = {
    device: Device | TrezorDevice;
    forceForget?: boolean;
};

type StartDiscoveryParams = {
    device: TrezorDevice;
    trigger: DiscoveryTrigger;
};

const mockCancelDiscoveryForRestart = jest.fn<void, [TrezorDevice]>();
const mockForgetDisconnectedDevices = jest.fn<void, [ForgetDisconnectedDevicesParams]>();
const mockStartDiscovery = jest.fn<void, [StartDiscoveryParams]>();

jest.mock('./discoveryThunks', () => {
    const actualModule = jest.requireActual('./discoveryThunks');
    const { createThunk } = jest.requireActual('@trezor/redux-utils');

    return {
        ...actualModule,
        cancelDiscoveryForRestartThunk: createThunk(
            '@test/cancelDiscoveryForRestart',
            (device: TrezorDevice) => mockCancelDiscoveryForRestart(device),
        ),
        startDiscoveryThunk: createThunk('@test/startDiscovery', (params: StartDiscoveryParams) =>
            mockStartDiscovery(params),
        ),
    };
});

jest.mock('../device/deviceThunks', () => {
    const actualModule = jest.requireActual('../device/deviceThunks');
    const { createThunk } = jest.requireActual('@trezor/redux-utils');

    return {
        ...actualModule,
        forgetDisconnectedDevicesThunk: createThunk(
            '@test/forgetDisconnectedDevices',
            (params: ForgetDisconnectedDevicesParams) => mockForgetDisconnectedDevices(params),
        ),
    };
});

const devicePath = asDeviceUniquePath('device-path');
const device = mockSuiteDevice({ path: devicePath });

const createState = (discoveryStatus: DiscoveryStatus['status']): EjectAllWalletsThunkState => ({
    wallet: {
        discovery: { [devicePath]: { status: discoveryStatus } as DiscoveryStatus },
    },
    device: {
        devices: [device],
        selectedDevice: device,
        buttonRequestsByPath: {},
    },
});

const runThunk = async (state: EjectAllWalletsThunkState) => {
    const getState = () => state;
    const { dispatch } = createMockDispatch({ getState, extra: {} });

    await dispatch(ejectAllWalletsThunk({ device }));
};

describe(ejectAllWalletsThunk.name, () => {
    beforeEach(() => {
        jest.resetAllMocks();
    });

    it('forgets all wallets of the device, regardless of connection, then starts discovery', async () => {
        mockForgetDisconnectedDevices.mockImplementation(() => {
            expect(mockStartDiscovery).not.toHaveBeenCalled();
        });

        const discoveryStatus = 'complete';
        await runThunk(createState(discoveryStatus));

        expect(mockCancelDiscoveryForRestart).not.toHaveBeenCalled();
        expect(mockForgetDisconnectedDevices).toHaveBeenCalledWith({ device, forceForget: true });
        expect(mockStartDiscovery).toHaveBeenCalledWith({ device, trigger: 'device-check' });
    });

    it('cancels a running discovery before forgetting all wallets, then starts discovery', async () => {
        mockCancelDiscoveryForRestart.mockImplementation(() => {
            expect(mockForgetDisconnectedDevices).not.toHaveBeenCalled();
        });
        mockForgetDisconnectedDevices.mockImplementation(() => {
            expect(mockStartDiscovery).not.toHaveBeenCalled();
        });

        const discoveryStatus = 'progress';
        await runThunk(createState(discoveryStatus));

        expect(mockCancelDiscoveryForRestart).toHaveBeenCalledWith(device);
        expect(mockForgetDisconnectedDevices).toHaveBeenCalledWith({ device, forceForget: true });
        expect(mockStartDiscovery).toHaveBeenCalledWith({ device, trigger: 'device-check' });
    });
});
