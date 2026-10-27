import { deviceInitialState } from '@suite-common/device';
import { type TrezorDevice } from '@suite-common/suite-types';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
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
const cipheredValue = 'ab'.repeat(32);
const expectedSalt = '9a2db2e23f1504cd056606553ac049c5e718e8f9ce9233876df1a7a1821af885';
const params = {
    path: asDeviceUniquePath('1'),
    instance: 1,
    staticSessionId,
    useEmptyPassphrase: false,
};

const mockDevice = (device: Partial<TrezorDevice> = {}) =>
    mockSuiteDevice({ path: '1', state: { staticSessionId }, remember: true, ...device });

const createState = (
    devices: TrezorDevice[],
    trading: Partial<TradingState> = {},
): EnsureTradeApiDeviceSaltThunkState => ({
    device: { ...deviceInitialState, devices },
    wallet: { trading: { ...initialState, ...trading } },
});

const cipherKeyValueSpy = jest.spyOn(TrezorConnect, 'cipherKeyValue') as unknown as jest.Mock;

const runThunk = async (state: EnsureTradeApiDeviceSaltThunkState) => {
    const getState = () => state;
    const { actions, dispatch } = createMockDispatch({ getState, extra: {} });

    await dispatch(ensureTradeApiDeviceSaltThunk(params));

    return actions.filter(tradingActions.setTradeApiDeviceSalt.match);
};

describe('ensureTradeApiDeviceSaltThunk', () => {
    beforeEach(() => {
        cipherKeyValueSpy.mockReset();
        cipherKeyValueSpy.mockResolvedValue({ success: true, payload: { value: cipheredValue } });
    });

    it('asks the wallet with the fixed silent cipherKeyValue request', async () => {
        await runThunk(createState([mockDevice()]));

        expect(cipherKeyValueSpy).toHaveBeenCalledWith({
            device: {
                path: '1',
                instance: 1,
                state: { staticSessionId },
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
            const saltActions = await runThunk(
                createState([mockDevice({ remember, temporaryRemember })]),
            );

            expect(saltActions).toEqual([
                tradingActions.setTradeApiDeviceSalt({
                    staticSessionId,
                    salt: expectedSalt,
                    isRemembered,
                }),
            ]);
        },
    );

    it('stores a session salt for a wallet that is not in the state yet', async () => {
        const saltActions = await runThunk(createState([]));

        expect(saltActions).toEqual([
            tradingActions.setTradeApiDeviceSalt({
                staticSessionId,
                salt: expectedSalt,
                isRemembered: false,
            }),
        ]);
    });

    it.each([
        { scenario: 'remembered', trading: { tradeApiSalts: { [staticSessionId]: 'salt' } } },
        { scenario: 'session', trading: { tradeApiSessionSalts: { [staticSessionId]: 'salt' } } },
    ])('does not ask the device again when a $scenario salt exists', async ({ trading }) => {
        await runThunk(createState([mockDevice()], trading));

        expect(cipherKeyValueSpy).not.toHaveBeenCalled();
    });

    it('does not store a salt when the device request fails', async () => {
        cipherKeyValueSpy.mockResolvedValue({
            success: false,
            payload: { error: 'Device call in progress' },
        });

        expect(await runThunk(createState([mockDevice()]))).toEqual([]);
    });
});
