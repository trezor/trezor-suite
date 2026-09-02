import { events } from '@suite/analytics';
import { mockDesktopAnalytics } from '@suite/analytics/mocks';
import { deviceInitialState } from '@suite-common/device';
import { type TrezorDevice } from '@suite-common/suite-types';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { testMocks } from '@suite-common/test-utils';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { initialWalletSettingsState } from '@suite-common/wallet-core';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';

import {
    type SignVerifyRootState,
    showAddressThunk,
    signThunk,
    verifyThunk,
} from './signVerifyActions';

const PATH = 'PATH';
const ADDRESS = 'ADDRESS';
const MESSAGE = 'MESSAGE';
const SIGNATURE = 'SIGNATURE';
const ACCOUNT = mockWalletAccount({ symbol: asNetworkSymbol('btc') });
const LEGACY_ACCOUNT = mockWalletAccount({
    symbol: asNetworkSymbol('btc'),
    accountType: 'legacy',
});
const ETHEREUM_ACCOUNT = mockWalletAccount({ symbol: asNetworkSymbol('eth') });

const CONNECTED_DEVICE = mockSuiteDevice({ connected: true, available: true });

const createState = (selectedDevice: TrezorDevice | undefined): SignVerifyRootState => ({
    device: { ...deviceInitialState, selectedDevice },
    wallet: { settings: initialWalletSettingsState },
});

describe('Sign/Verify actions', () => {
    let dispatch: jest.Mock;
    let deps: { services: { analytics: ReturnType<typeof mockDesktopAnalytics> } };

    // The thunks only read the selected device and the address display type, so a state literal
    // is enough — no store, no middleware.
    const getState = () => createState(CONNECTED_DEVICE);

    beforeEach(() => {
        dispatch = jest.fn();
        deps = { services: { analytics: mockDesktopAnalytics() } };
    });

    it('showAddress', async () => {
        testMocks.setTrezorConnectFixtures({
            success: true,
            payload: { address: ADDRESS },
        });
        const res = await showAddressThunk(ACCOUNT, ADDRESS, PATH)(dispatch, getState);
        expect(res).toStrictEqual({ address: ADDRESS });
    });

    it('sign', async () => {
        testMocks.setTrezorConnectFixtures({
            success: true,
            payload: {
                address: ADDRESS,
                signature: SIGNATURE,
            },
        });
        const res = await signThunk(ACCOUNT, PATH, MESSAGE)(dispatch, getState, deps);
        expect(res).toStrictEqual({ address: ADDRESS, signature: SIGNATURE });
    });

    it('verify', async () => {
        testMocks.setTrezorConnectFixtures({
            success: true,
            payload: { message: MESSAGE },
        });
        const res = await verifyThunk(
            ACCOUNT,
            ADDRESS,
            MESSAGE,
            SIGNATURE,
        )(dispatch, getState, deps);
        expect(res).toStrictEqual(true);
    });

    describe('hex format', () => {
        const connect = () => testMocks.getTrezorConnectMock();

        it('hands the message to the device as hex when the switch is on', async () => {
            testMocks.setTrezorConnectFixtures({
                success: true,
                payload: { address: ADDRESS, signature: SIGNATURE },
            });

            await signThunk(ACCOUNT, PATH, MESSAGE, true)(dispatch, getState, deps);

            expect(connect().signMessage).toHaveBeenLastCalledWith(
                expect.objectContaining({ message: MESSAGE, hex: true, no_script_type: false }),
            );
        });

        it('hands it over as text when the switch is off', async () => {
            testMocks.setTrezorConnectFixtures({
                success: true,
                payload: { address: ADDRESS, signature: SIGNATURE },
            });

            await signThunk(ACCOUNT, PATH, MESSAGE)(dispatch, getState, deps);

            expect(connect().signMessage).toHaveBeenLastCalledWith(
                expect.objectContaining({ message: MESSAGE, hex: false }),
            );
        });

        it('verifies against the same reading of the message', async () => {
            testMocks.setTrezorConnectFixtures({ success: true, payload: { message: MESSAGE } });

            await verifyThunk(ACCOUNT, ADDRESS, MESSAGE, SIGNATURE, true)(dispatch, getState, deps);

            expect(connect().verifyMessage).toHaveBeenLastCalledWith(
                expect.objectContaining({
                    address: ADDRESS,
                    message: MESSAGE,
                    signature: SIGNATURE,
                    hex: true,
                }),
            );
        });

        it('reports which reading was used', async () => {
            testMocks.setTrezorConnectFixtures({
                success: true,
                payload: { address: ADDRESS, signature: SIGNATURE },
            });

            await signThunk(ACCOUNT, PATH, MESSAGE, true)(dispatch, getState, deps);

            expect(deps.services.analytics.report).toHaveBeenCalledWith(
                expect.objectContaining({ payload: expect.objectContaining({ hex: true }) }),
            );
        });
    });

    describe('analytics', () => {
        it('reports a successful sign with the input format and the signature format', async () => {
            testMocks.setTrezorConnectFixtures({
                success: true,
                payload: { address: ADDRESS, signature: SIGNATURE },
            });

            await signThunk(ACCOUNT, PATH, MESSAGE, true, true)(dispatch, getState, deps);

            expect(deps.services.analytics.report).toHaveBeenCalledTimes(1);
            expect(deps.services.analytics.report).toHaveBeenCalledWith({
                type: events.coinSignMessageEvent.name,
                payload: {
                    status: 'success',
                    symbol: 'btc',
                    hex: true,
                    signatureFormat: 'electrum',
                },
            });
        });

        it.each([
            ['an account signing in a single format', ETHEREUM_ACCOUNT],
            ['an account not offered the choice', LEGACY_ACCOUNT],
        ])('leaves the signature format out for %s', async (_name, account) => {
            testMocks.setTrezorConnectFixtures({
                success: true,
                payload: { address: ADDRESS, signature: SIGNATURE },
            });

            await signThunk(account, PATH, MESSAGE)(dispatch, getState, deps);

            expect(deps.services.analytics.report).toHaveBeenCalledWith({
                type: events.coinSignMessageEvent.name,
                payload: { status: 'success', symbol: account.symbol, hex: false },
            });
        });

        it('reports a failed sign with the error code', async () => {
            testMocks.setTrezorConnectFixtures({
                success: false,
                error: { message: 'Signing failed', code: 'Failure_DataError' },
            });

            await signThunk(ACCOUNT, PATH, MESSAGE)(dispatch, getState, deps);

            expect(deps.services.analytics.report).toHaveBeenCalledTimes(1);
            expect(deps.services.analytics.report).toHaveBeenCalledWith({
                type: events.coinSignMessageEvent.name,
                payload: {
                    status: 'error',
                    error: 'Failure_DataError',
                    symbol: 'btc',
                    hex: false,
                    signatureFormat: 'trezor',
                },
            });
        });

        it.each(['Method_Cancel', 'Failure_ActionCancelled'])(
            'reports a sign rejected with %s as cancelled',
            async code => {
                testMocks.setTrezorConnectFixtures({
                    success: false,
                    error: { message: 'Cancelled', code },
                });

                await signThunk(ACCOUNT, PATH, MESSAGE)(dispatch, getState, deps);

                expect(deps.services.analytics.report).toHaveBeenCalledTimes(1);
                expect(deps.services.analytics.report).toHaveBeenCalledWith(
                    expect.objectContaining({
                        type: events.coinSignMessageEvent.name,
                        payload: expect.objectContaining({ status: 'cancelled', error: code }),
                    }),
                );
            },
        );

        it('reports a sign that never reached the device as an error', async () => {
            const getStateWithoutDevice = () => createState(undefined);

            await signThunk(ACCOUNT, PATH, MESSAGE)(dispatch, getStateWithoutDevice, deps);

            expect(deps.services.analytics.report).toHaveBeenCalledTimes(1);
            expect(deps.services.analytics.report).toHaveBeenCalledWith({
                type: events.coinSignMessageEvent.name,
                payload: {
                    status: 'error',
                    error: 'Device not found',
                    symbol: 'btc',
                    hex: false,
                    signatureFormat: 'trezor',
                },
            });
        });

        it('reports a successful verify', async () => {
            testMocks.setTrezorConnectFixtures({
                success: true,
                payload: { message: MESSAGE },
            });

            await verifyThunk(ACCOUNT, ADDRESS, MESSAGE, SIGNATURE, true)(dispatch, getState, deps);

            expect(deps.services.analytics.report).toHaveBeenCalledTimes(1);
            expect(deps.services.analytics.report).toHaveBeenCalledWith({
                type: events.coinVerifyMessageEvent.name,
                payload: { status: 'success', symbol: 'btc', hex: true },
            });
        });

        it('reports a failed verify with the error code', async () => {
            testMocks.setTrezorConnectFixtures({
                success: false,
                error: { message: 'Invalid signature', code: 'Failure_DataError' },
            });

            await verifyThunk(ACCOUNT, ADDRESS, MESSAGE, SIGNATURE)(dispatch, getState, deps);

            expect(deps.services.analytics.report).toHaveBeenCalledTimes(1);
            expect(deps.services.analytics.report).toHaveBeenCalledWith({
                type: events.coinVerifyMessageEvent.name,
                payload: {
                    status: 'error',
                    error: 'Failure_DataError',
                    symbol: 'btc',
                    hex: false,
                },
            });
        });

        it('reports a verify rejected on the device as cancelled', async () => {
            testMocks.setTrezorConnectFixtures({
                success: false,
                error: { message: 'Cancelled', code: 'Failure_ActionCancelled' },
            });

            await verifyThunk(ACCOUNT, ADDRESS, MESSAGE, SIGNATURE)(dispatch, getState, deps);

            expect(deps.services.analytics.report).toHaveBeenCalledTimes(1);
            expect(deps.services.analytics.report).toHaveBeenCalledWith(
                expect.objectContaining({
                    payload: expect.objectContaining({ status: 'cancelled' }),
                }),
            );
        });

        it('never reports the message, the address or the signature', async () => {
            testMocks.setTrezorConnectFixtures({
                success: true,
                payload: { address: ADDRESS, signature: SIGNATURE },
            });

            await signThunk(ACCOUNT, PATH, MESSAGE)(dispatch, getState, deps);
            await verifyThunk(ACCOUNT, ADDRESS, MESSAGE, SIGNATURE)(dispatch, getState, deps);

            const reported = JSON.stringify(deps.services.analytics.report.mock.calls);

            expect(reported).not.toContain(MESSAGE);
            expect(reported).not.toContain(ADDRESS);
            expect(reported).not.toContain(SIGNATURE);
            expect(reported).not.toContain(PATH);
        });
    });
});
