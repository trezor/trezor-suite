import { type AnalyticsSharedEvents } from '@suite-common/analytics';
import { createMockDispatch } from '@suite-common/redux-utils/mocks';
import { type TrezorDevice } from '@suite-common/suite-types';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { tokenDefinitionsInitialState } from '@suite-common/token-definitions';
import { type NetworkSymbol, asNetworkSymbol } from '@suite-common/wallet-config';
import {
    blockchainInitialState,
    discoveryActions,
    initialWalletSettingsState,
} from '@suite-common/wallet-core';
import { type Account, asAccountDescriptor } from '@suite-common/wallet-types';
import { mockGetTradedAccountKeys, mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { mockAnalytics } from '@trezor/analytics-uploader/mocks';
import { type StaticSessionId, asDeviceUniquePath } from '@trezor/connect';

import {
    type ActivateNetworkWithDiscoveryThunkDeps,
    type ActivateNetworkWithDiscoveryThunkState,
    activateNetworkWithDiscoveryThunk,
} from './activateNetworkWithDiscoveryThunk';

type ChangeCoinVisibilityParams = {
    symbol: NetworkSymbol;
    shouldBeVisible: boolean;
};

const mockChangeCoinVisibility = jest.fn<Promise<void>, [ChangeCoinVisibilityParams]>();
const mockRunAdditionalDiscovery = jest.fn<Promise<void>, [StaticSessionId]>();
const mockCancelDiscovery = jest.fn<void, [TrezorDevice]>();

jest.mock('@suite-common/wallet-core', () => {
    const actualModule = jest.requireActual('@suite-common/wallet-core');
    const { createThunk } = jest.requireActual('@suite-common/redux-utils');

    return {
        ...actualModule,
        changeCoinVisibilityThunk: createThunk(
            '@test/changeCoinVisibility',
            (params: ChangeCoinVisibilityParams) => mockChangeCoinVisibility(params),
        ),
        runAdditionalDiscoveryThunk: createThunk(
            '@test/runAdditionalDiscovery',
            (staticSessionId: StaticSessionId) => mockRunAdditionalDiscovery(staticSessionId),
        ),
        cancelDiscoveryThunk: createThunk('@test/cancelDiscovery', (device: TrezorDevice) =>
            mockCancelDiscovery(device),
        ),
    };
});

const devicePath = asDeviceUniquePath('device-path');
const staticSessionId: StaticSessionId = 'wallet@device:0';
const networkSymbol = asNetworkSymbol('eth');

const createDevice = (): TrezorDevice =>
    mockSuiteDevice({
        path: devicePath,
        state: { staticSessionId },
        connected: true,
        available: true,
    });

const createState = ({
    accounts = [],
    enabledNetworks = [],
    device = createDevice(),
}: {
    accounts?: Account[];
    enabledNetworks?: NetworkSymbol[];
    device?: TrezorDevice;
} = {}): ActivateNetworkWithDiscoveryThunkState => ({
    wallet: {
        accounts,
        blockchain: blockchainInitialState,
        discovery: {},
        settings: { ...initialWalletSettingsState, enabledNetworks },
    },
    device: {
        devices: [device],
        selectedDevice: device,
        persistentDeviceData: [],
    },
    tokenDefinitions: tokenDefinitionsInitialState,
});

const createExtra = (): ActivateNetworkWithDiscoveryThunkDeps => ({
    services: {
        analytics: mockAnalytics<AnalyticsSharedEvents>(),
        getTradedAccountKeys: mockGetTradedAccountKeys(),
    },
});

const runThunk = async (state: ActivateNetworkWithDiscoveryThunkState) => {
    const getState = () => state;
    const extra = createExtra();
    const { actions, dispatch } = createMockDispatch({ getState, extra });
    const result = await dispatch(
        activateNetworkWithDiscoveryThunk({ devicePath, staticSessionId, networkSymbol }),
    ).unwrap();

    return { actions, result };
};

describe(activateNetworkWithDiscoveryThunk.name, () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockChangeCoinVisibility.mockResolvedValue();
    });

    it('enables the network, completes discovery and counts visible accounts', async () => {
        const state = createState();
        mockRunAdditionalDiscovery.mockImplementation(() => {
            state.wallet.accounts = [
                mockWalletAccount({
                    descriptor: asAccountDescriptor('visibleAccount'),
                    deviceState: staticSessionId,
                    symbol: networkSymbol,
                    visible: true,
                }),
                mockWalletAccount({
                    descriptor: asAccountDescriptor('hiddenAccount'),
                    deviceState: staticSessionId,
                    symbol: networkSymbol,
                    visible: false,
                }),
            ];
            state.wallet.discovery[devicePath] = { status: 'complete' };

            return Promise.resolve();
        });

        const { result } = await runThunk(state);

        expect(result).toEqual({ success: true, discoveredAccountCount: 1 });
        expect(mockChangeCoinVisibility).toHaveBeenCalledTimes(1);
        expect(mockChangeCoinVisibility).toHaveBeenCalledWith({
            symbol: networkSymbol,
            shouldBeVisible: true,
        });
        expect(mockRunAdditionalDiscovery).toHaveBeenCalledWith(staticSessionId);
    });

    it('restores network visibility when activation fails', async () => {
        const state = createState();
        mockChangeCoinVisibility.mockImplementation(({ shouldBeVisible }) => {
            if (shouldBeVisible) {
                return Promise.reject(new Error('Network activation failed'));
            }

            return Promise.resolve();
        });

        const { actions, result } = await runThunk(state);

        expect(result).toEqual({
            success: false,
            error: 'Network activation failed',
            wasCancelled: false,
        });
        expect(mockChangeCoinVisibility.mock.calls).toEqual([
            [{ symbol: networkSymbol, shouldBeVisible: true }],
            [{ symbol: networkSymbol, shouldBeVisible: false }],
        ]);
        expect(actions).toContainEqual(
            discoveryActions.updateDiscovery(
                { status: 'failed', error: 'Network activation failed' },
                devicePath,
            ),
        );
        expect(mockRunAdditionalDiscovery).not.toHaveBeenCalled();
    });

    it('cancels discovery and restores network visibility when aborted', async () => {
        const state = createState();
        let markDiscoveryStarted = () => {};
        const discoveryStarted = new Promise<void>(resolve => {
            markDiscoveryStarted = resolve;
        });
        let markRollbackComplete = () => {};
        const rollbackComplete = new Promise<void>(resolve => {
            markRollbackComplete = resolve;
        });

        mockRunAdditionalDiscovery.mockImplementation(() => {
            markDiscoveryStarted();

            return new Promise(() => {});
        });
        mockChangeCoinVisibility.mockImplementation(({ shouldBeVisible }) => {
            if (!shouldBeVisible) {
                markRollbackComplete();
            }

            return Promise.resolve();
        });

        const getState = () => state;
        const extra = createExtra();
        const { dispatch } = createMockDispatch({ getState, extra });
        const activationPromise = dispatch(
            activateNetworkWithDiscoveryThunk({ devicePath, staticSessionId, networkSymbol }),
        );

        await discoveryStarted;
        activationPromise.abort();
        const result = await activationPromise;
        await rollbackComplete;

        expect(activateNetworkWithDiscoveryThunk.rejected.match(result)).toBe(true);
        expect(result).toEqual(
            expect.objectContaining({ meta: expect.objectContaining({ aborted: true }) }),
        );
        expect(mockCancelDiscovery).toHaveBeenCalledWith(state.device.devices[0]);
        expect(mockChangeCoinVisibility.mock.calls).toEqual([
            [{ symbol: networkSymbol, shouldBeVisible: true }],
            [{ symbol: networkSymbol, shouldBeVisible: false }],
        ]);
    });
});
