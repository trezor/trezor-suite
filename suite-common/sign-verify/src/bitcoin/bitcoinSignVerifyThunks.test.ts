import { events } from '@suite-common/analytics';
import { deviceInitialState } from '@suite-common/device';
import { type TrezorDevice } from '@suite-common/suite-types';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { testMocks } from '@suite-common/test-utils';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type Account } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { mockAnalytics } from '@trezor/analytics-uploader/mocks';

import { signBitcoinMessageThunk, verifyBitcoinMessageThunk } from './bitcoinSignVerifyThunks';
import { type SignVerifyRootState } from '../signVerifyRootState';

const PATH = 'PATH';
const ADDRESS = 'ADDRESS';
const MESSAGE = 'MESSAGE';
const SIGNATURE = 'SIGNATURE';
const ACCOUNT = mockWalletAccount({ symbol: asNetworkSymbol('btc') });
const LEGACY_ACCOUNT = mockWalletAccount({
    symbol: asNetworkSymbol('btc'),
    accountType: 'legacy',
});
const DOGE_ACCOUNT = mockWalletAccount({ symbol: asNetworkSymbol('doge') });

const CONNECTED_DEVICE = mockSuiteDevice({ connected: true, available: true });

const createState = (selectedDevice: TrezorDevice | undefined): SignVerifyRootState => ({
    device: { ...deviceInitialState, selectedDevice },
});

describe('Bitcoin sign/verify thunks', () => {
    let dispatch: jest.Mock;
    let deps: { services: { analytics: ReturnType<typeof mockAnalytics> } };

    // The thunks only read the selected device and the address display type, so a state literal
    // is enough — no store, no middleware.
    const getState = () => createState(CONNECTED_DEVICE);

    beforeEach(() => {
        dispatch = jest.fn();
        deps = { services: { analytics: mockAnalytics() } };
    });

    const sign = ({
        account = ACCOUNT,
        hex = false,
        isElectrum = false,
        getSignState = getState,
    }: {
        account?: Account;
        hex?: boolean;
        isElectrum?: boolean;
        getSignState?: () => SignVerifyRootState;
    } = {}) =>
        signBitcoinMessageThunk({ account, path: PATH, message: MESSAGE, hex, isElectrum })(
            dispatch,
            getSignState,
            deps,
        );

    const verify = ({ hex = false }: { hex?: boolean } = {}) =>
        verifyBitcoinMessageThunk({
            account: ACCOUNT,
            address: ADDRESS,
            message: MESSAGE,
            signature: SIGNATURE,
            hex,
        })(dispatch, getState, deps);

    const dispatchedToastTypes = () =>
        dispatch.mock.calls
            .map(([action]) => action?.payload?.type)
            .filter((type): type is string => typeof type === 'string');

    it('sign', async () => {
        testMocks.setTrezorConnectFixtures({
            success: true,
            payload: {
                address: ADDRESS,
                signature: SIGNATURE,
            },
        });
        const res = await sign();
        expect(res).toStrictEqual({ address: ADDRESS, signature: SIGNATURE });
    });

    it('verify', async () => {
        testMocks.setTrezorConnectFixtures({
            success: true,
            payload: { message: MESSAGE },
        });
        const res = await verify();
        expect(res).toStrictEqual('verified');
    });

    describe('hex format', () => {
        const connect = () => testMocks.getTrezorConnectMock();

        it('hands the message to the device as hex when the switch is on', async () => {
            testMocks.setTrezorConnectFixtures({
                success: true,
                payload: { address: ADDRESS, signature: SIGNATURE },
            });

            await sign({ hex: true });

            expect(connect().signMessage).toHaveBeenLastCalledWith(
                expect.objectContaining({ message: MESSAGE, hex: true, no_script_type: false }),
            );
        });

        it('hands it over as text when the switch is off', async () => {
            testMocks.setTrezorConnectFixtures({
                success: true,
                payload: { address: ADDRESS, signature: SIGNATURE },
            });

            await sign();

            expect(connect().signMessage).toHaveBeenLastCalledWith(
                expect.objectContaining({ message: MESSAGE, hex: false }),
            );
        });

        it('verifies against the same reading of the message', async () => {
            testMocks.setTrezorConnectFixtures({ success: true, payload: { message: MESSAGE } });

            await verify({ hex: true });

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

            await sign({ hex: true });

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

            await sign({ hex: true, isElectrum: true });

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
            ['a network with a single account type', DOGE_ACCOUNT],
            ['an account not offered the choice', LEGACY_ACCOUNT],
        ])('leaves the signature format out for %s', async (_name, account) => {
            testMocks.setTrezorConnectFixtures({
                success: true,
                payload: { address: ADDRESS, signature: SIGNATURE },
            });

            await sign({ account });

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

            await sign();

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

                await sign();

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

            await sign({ getSignState: getStateWithoutDevice });

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

            await verify({ hex: true });

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

            await verify();

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

            await verify();

            expect(deps.services.analytics.report).toHaveBeenCalledTimes(1);
            expect(deps.services.analytics.report).toHaveBeenCalledWith(
                expect.objectContaining({
                    payload: expect.objectContaining({ status: 'cancelled' }),
                }),
            );
        });

        it.each(['Method_Cancel', 'Failure_ActionCancelled'])(
            'settles a verify rejected with %s as cancelled, not as a failure',
            async code => {
                testMocks.setTrezorConnectFixtures({
                    success: false,
                    error: { message: 'Cancelled', code },
                });

                const result = await verify();

                expect(result).toBe('cancelled');
                // Said out loud, but as a cancellation — never as a failed verification.
                expect(dispatchedToastTypes()).toEqual(['verify-message-cancelled']);
            },
        );

        it('settles a signature that does not verify as failed, and says so', async () => {
            testMocks.setTrezorConnectFixtures({
                success: false,
                error: { message: 'Invalid signature', code: 'Failure_DataError' },
            });

            const result = await verify();

            expect(result).toBe('failed');
            expect(dispatchedToastTypes()).toEqual(['verify-message-error']);
        });

        it('never reports the message, the address or the signature', async () => {
            testMocks.setTrezorConnectFixtures({
                success: true,
                payload: { address: ADDRESS, signature: SIGNATURE },
            });

            await sign();
            await verify();

            const reported = JSON.stringify(deps.services.analytics.report.mock.calls);

            expect(reported).not.toContain(MESSAGE);
            expect(reported).not.toContain(ADDRESS);
            expect(reported).not.toContain(SIGNATURE);
            expect(reported).not.toContain(PATH);
        });
    });
});
