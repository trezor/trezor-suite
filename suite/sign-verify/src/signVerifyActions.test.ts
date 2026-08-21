import { events } from '@suite/analytics';
import { mockDesktopAnalytics } from '@suite/analytics/mocks';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { configureMockStore, testMocks } from '@suite-common/test-utils';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';

import { showAddress, sign, verify } from './signVerifyActions';

const PATH = 'PATH';
const ADDRESS = 'ADDRESS';
const MESSAGE = 'MESSAGE';
const SIGNATURE = 'SIGNATURE';
const ACCOUNT = mockWalletAccount({ symbol: asNetworkSymbol('btc') });

describe('Sign/Verify actions', () => {
    let store: any;
    let report: jest.Mock;

    beforeEach(() => {
        report = jest.fn();
        store = configureMockStore({
            extra: { services: { analytics: mockDesktopAnalytics(report) } },
            preloadedState: {
                wallet: {
                    settings: { addressDisplayType: 'chunked' },
                },
                device: { selectedDevice: mockSuiteDevice({ connected: true, available: true }) },
            },
        });
    });

    it('showAddress', async () => {
        testMocks.setTrezorConnectFixtures({
            success: true,
            payload: { address: ADDRESS },
        });
        const res = await store.dispatch(showAddress(ACCOUNT, ADDRESS, PATH));
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
        const res = await store.dispatch(sign(ACCOUNT, PATH, MESSAGE));
        expect(res.address).toStrictEqual(ADDRESS);
        expect(res.signature).toStrictEqual(SIGNATURE);
    });

    it('verify', async () => {
        testMocks.setTrezorConnectFixtures({
            success: true,
            payload: { message: MESSAGE },
        });
        const res = await store.dispatch(verify(ACCOUNT, ADDRESS, MESSAGE, SIGNATURE));
        expect(res).toStrictEqual(true);
    });

    describe('analytics', () => {
        it('reports a successful sign with the input format and the signature format', async () => {
            testMocks.setTrezorConnectFixtures({
                success: true,
                payload: { address: ADDRESS, signature: SIGNATURE },
            });

            await store.dispatch(sign(ACCOUNT, PATH, MESSAGE, true, true));

            expect(report).toHaveBeenCalledTimes(1);
            expect(report).toHaveBeenCalledWith({
                type: events.coinSignMessageEvent.name,
                payload: {
                    status: 'success',
                    symbol: 'btc',
                    hex: true,
                    signatureFormat: 'electrum',
                },
            });
        });

        it('reports a failed sign with the error code', async () => {
            testMocks.setTrezorConnectFixtures({
                success: false,
                error: { message: 'Signing failed', code: 'Failure_DataError' },
            });

            await store.dispatch(sign(ACCOUNT, PATH, MESSAGE));

            expect(report).toHaveBeenCalledTimes(1);
            expect(report).toHaveBeenCalledWith({
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

                await store.dispatch(sign(ACCOUNT, PATH, MESSAGE));

                expect(report).toHaveBeenCalledTimes(1);
                expect(report).toHaveBeenCalledWith(
                    expect.objectContaining({
                        type: events.coinSignMessageEvent.name,
                        payload: expect.objectContaining({ status: 'cancelled', error: code }),
                    }),
                );
            },
        );

        it('reports a sign that never reached the device as an error', async () => {
            store = configureMockStore({
                extra: { services: { analytics: mockDesktopAnalytics(report) } },
                preloadedState: {
                    wallet: { settings: { addressDisplayType: 'chunked' } },
                    device: { selectedDevice: undefined },
                },
            });

            await store.dispatch(sign(ACCOUNT, PATH, MESSAGE));

            expect(report).toHaveBeenCalledTimes(1);
            expect(report).toHaveBeenCalledWith({
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

            await store.dispatch(verify(ACCOUNT, ADDRESS, MESSAGE, SIGNATURE, true));

            expect(report).toHaveBeenCalledTimes(1);
            expect(report).toHaveBeenCalledWith({
                type: events.coinVerifyMessageEvent.name,
                payload: { status: 'success', symbol: 'btc', hex: true },
            });
        });

        it('reports a failed verify with the error code', async () => {
            testMocks.setTrezorConnectFixtures({
                success: false,
                error: { message: 'Invalid signature', code: 'Failure_DataError' },
            });

            await store.dispatch(verify(ACCOUNT, ADDRESS, MESSAGE, SIGNATURE));

            expect(report).toHaveBeenCalledTimes(1);
            expect(report).toHaveBeenCalledWith({
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

            await store.dispatch(verify(ACCOUNT, ADDRESS, MESSAGE, SIGNATURE));

            expect(report).toHaveBeenCalledTimes(1);
            expect(report).toHaveBeenCalledWith(
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

            await store.dispatch(sign(ACCOUNT, PATH, MESSAGE));
            await store.dispatch(verify(ACCOUNT, ADDRESS, MESSAGE, SIGNATURE));

            const reported = JSON.stringify(report.mock.calls);

            expect(reported).not.toContain(MESSAGE);
            expect(reported).not.toContain(ADDRESS);
            expect(reported).not.toContain(SIGNATURE);
            expect(reported).not.toContain(PATH);
        });
    });
});
