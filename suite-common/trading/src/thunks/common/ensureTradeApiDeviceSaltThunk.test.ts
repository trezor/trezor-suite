import { PORTFOLIO_TRACKER_DEVICE_ID, deviceInitialState } from '@suite-common/device';
import { type TrezorDevice } from '@suite-common/suite-types';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { type Discovery } from '@suite-common/wallet-types';
import TrezorConnect, { type StaticSessionId, asDeviceUniquePath } from '@trezor/connect';
import { createMockDispatch } from '@trezor/redux-utils/mocks';

import {
    type EnsureTradeApiDeviceSaltThunkState,
    ensureTradeApiDeviceSaltThunk,
} from './ensureTradeApiDeviceSaltThunk';
import {
    type TradingState,
    initialState,
    tradingActions,
} from '../../reducers/tradingCommonReducer';

const staticSessionId = 'device-id@wallet-id:0' as StaticSessionId;
const account = { deviceState: staticSessionId };
const cipheredValue = 'ab'.repeat(32);
const expectedSalt = '9a2db2e23f1504cd056606553ac049c5e718e8f9ce9233876df1a7a1821af885';

const mockDevice = (
    device: Partial<TrezorDevice> = {},
    features?: Parameters<typeof mockSuiteDevice>[1],
) =>
    mockSuiteDevice(
        {
            path: '1',
            state: { staticSessionId },
            connected: true,
            remember: true,
            ...device,
        },
        features,
    );

type CreateStateParams = {
    devices: TrezorDevice[];
    selectedDevice?: TrezorDevice;
    trading?: Partial<TradingState>;
    discovery?: Discovery;
};

const createState = ({
    devices,
    selectedDevice = devices[0],
    trading = {},
    discovery = {},
}: CreateStateParams): EnsureTradeApiDeviceSaltThunkState => ({
    device: { ...deviceInitialState, devices, selectedDevice },
    wallet: { trading: { ...initialState, ...trading }, discovery },
});

const cipherKeyValueSpy = jest.spyOn(TrezorConnect, 'cipherKeyValue') as unknown as jest.Mock;

const runThunk = async (getState: () => EnsureTradeApiDeviceSaltThunkState) => {
    const { actions, dispatch } = createMockDispatch({ getState, extra: {} });

    await dispatch(ensureTradeApiDeviceSaltThunk({ account }));

    return actions.filter(tradingActions.setTradeApiDeviceSalt.match);
};

describe('ensureTradeApiDeviceSaltThunk', () => {
    beforeEach(() => {
        cipherKeyValueSpy.mockReset();
        cipherKeyValueSpy.mockResolvedValue({ success: true, payload: { value: cipheredValue } });
    });

    it("asks the account's wallet with the fixed silent cipherKeyValue request", async () => {
        const state = createState({
            devices: [mockDevice({ instance: 1, useEmptyPassphrase: false })],
        });

        await runThunk(() => state);

        expect(cipherKeyValueSpy).toHaveBeenCalledWith({
            device: {
                path: '1',
                state: { staticSessionId },
                instance: 1,
                useEmptyPassphrase: false,
            },
            path: "m/20001'/0'",
            key: 'Trezor Suite trade API',
            value: '72ade4f93b6c0e8175a2d9b4e60f3c1a85d27e9b03f64a1c8d5e72b9f06a43d7',
            encrypt: true,
            askOnEncrypt: false,
            askOnDecrypt: false,
        });
    });

    it.each([
        { remember: true, temporaryRemember: false, isRemembered: true },
        { remember: true, temporaryRemember: true, isRemembered: false },
        { remember: false, temporaryRemember: false, isRemembered: false },
    ])(
        'stores sha256 of the device output with isRemembered=$isRemembered for remember=$remember and temporaryRemember=$temporaryRemember',
        async ({ remember, temporaryRemember, isRemembered }) => {
            const state = createState({ devices: [mockDevice({ remember, temporaryRemember })] });

            expect(await runThunk(() => state)).toEqual([
                tradingActions.setTradeApiDeviceSalt({
                    staticSessionId,
                    salt: expectedSalt,
                    isRemembered,
                }),
            ]);
        },
    );

    it.each([
        {
            scenario: 'a remembered salt exists',
            state: createState({
                devices: [mockDevice()],
                trading: { tradeApiSalts: { [staticSessionId]: 'salt' } },
            }),
        },
        {
            scenario: 'a session salt exists',
            state: createState({
                devices: [mockDevice()],
                trading: { tradeApiSessionSalts: { [staticSessionId]: 'salt' } },
            }),
        },
        {
            scenario: 'the device is disconnected',
            state: createState({ devices: [mockDevice({ connected: false })] }),
        },
        {
            scenario: 'the device is locked',
            state: createState({ devices: [mockDevice({}, { unlocked: false })] }),
        },
        {
            scenario: 'another wallet is selected',
            state: createState({
                devices: [mockDevice()],
                selectedDevice: mockDevice({
                    state: { staticSessionId: 'device-id@other-wallet-id:1' as StaticSessionId },
                }),
            }),
        },
        {
            scenario: 'the wallet is the portfolio tracker',
            state: createState({ devices: [mockDevice({ id: PORTFOLIO_TRACKER_DEVICE_ID })] }),
        },
        {
            scenario: 'discovery of the device is running',
            state: createState({
                devices: [mockDevice()],
                discovery: {
                    [asDeviceUniquePath('1')]: {
                        status: 'progress',
                        total: Infinity,
                        progress: 0,
                    },
                },
            }),
        },
    ])('does not ask the device when $scenario', async ({ state }) => {
        await runThunk(() => state);

        expect(cipherKeyValueSpy).not.toHaveBeenCalled();
    });

    it('does not store a salt when the device request fails', async () => {
        cipherKeyValueSpy.mockResolvedValue({
            success: false,
            payload: { error: 'Device call in progress' },
        });
        const state = createState({ devices: [mockDevice()] });

        expect(await runThunk(() => state)).toEqual([]);
    });

    it('does not store a salt when the wallet is forgotten during the request', async () => {
        let state = createState({ devices: [mockDevice()] });
        cipherKeyValueSpy.mockImplementation(() => {
            state = createState({ devices: [] });

            return Promise.resolve({ success: true, payload: { value: cipheredValue } });
        });

        expect(await runThunk(() => state)).toEqual([]);
    });
});
