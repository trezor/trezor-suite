import { events } from '@suite-common/analytics';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { mockAnalytics } from '@trezor/analytics-uploader/mocks';
import {
    type SignError,
    type SignedMessage,
    type VerifyError,
    connectErrorToSignVerifyError,
} from '@trezor/network-module-suite-common-types';
import { type Result, err, ok } from '@trezor/type-utils';

import {
    type SignAndReportParams,
    type SignVerifyReporterDeps,
    createSignVerifyReporter,
} from './createSignVerifyReporter';

const ADDRESS = 'ADDRESS';
const SIGNATURE = 'SIGNATURE';
const SYMBOL = asNetworkSymbol('btc');

const CONNECTED_DEVICE = mockSuiteDevice({
    connected: true,
    available: true,
    state: { staticSessionId: '1@2:3' },
});

const SIGNED_MESSAGE = { address: ADDRESS, signature: SIGNATURE };

type SignOptions = Partial<Pick<SignAndReportParams, 'hex' | 'signatureFormat'>>;

describe(createSignVerifyReporter.name, () => {
    let dispatch: jest.Mock;
    let deps: SignVerifyReporterDeps & { analytics: ReturnType<typeof mockAnalytics> };

    beforeEach(() => {
        dispatch = jest.fn();
        deps = { analytics: mockAnalytics(), dispatch };
    });

    const dispatchedToastTypes = () =>
        dispatch.mock.calls
            .map(([action]) => action?.payload?.type)
            .filter((type): type is string => typeof type === 'string');

    describe('signAndReport', () => {
        const sign = (
            result: Result<SignedMessage, SignError>,
            { hex = false, signatureFormat }: SignOptions = {},
        ) =>
            createSignVerifyReporter(deps).signAndReport(
                { device: CONNECTED_DEVICE, symbol: SYMBOL, hex, signatureFormat },
                () => Promise.resolve(result),
            );

        it('sign', async () => {
            const res = await sign(ok(SIGNED_MESSAGE));

            expect(res).toStrictEqual({ success: true, payload: SIGNED_MESSAGE });
        });

        describe('hex format', () => {
            it('reports which reading was used', async () => {
                await sign(ok(SIGNED_MESSAGE), { hex: true });

                expect(deps.analytics.report).toHaveBeenCalledWith(
                    expect.objectContaining({ payload: expect.objectContaining({ hex: true }) }),
                );
            });
        });

        describe('analytics', () => {
            it('reports a successful sign with the input format and the signature format', async () => {
                await sign(ok(SIGNED_MESSAGE), { hex: true, signatureFormat: 'electrum' });

                expect(deps.analytics.report).toHaveBeenCalledTimes(1);
                expect(deps.analytics.report).toHaveBeenCalledWith({
                    type: events.coinSignMessageEvent.name,
                    payload: {
                        status: 'success',
                        symbol: 'btc',
                        hex: true,
                        signatureFormat: 'electrum',
                    },
                });
            });

            it('leaves the signature format out for an account not offered the choice', async () => {
                await sign(ok(SIGNED_MESSAGE));

                expect(deps.analytics.report).toHaveBeenCalledWith({
                    type: events.coinSignMessageEvent.name,
                    payload: { status: 'success', symbol: 'btc', hex: false },
                });
            });

            it('reports a failed sign with the error code', async () => {
                await sign(
                    err(
                        connectErrorToSignVerifyError({
                            message: 'Signing failed',
                            code: 'Failure_DataError',
                        }),
                    ),
                    { signatureFormat: 'trezor' },
                );

                expect(deps.analytics.report).toHaveBeenCalledTimes(1);
                expect(deps.analytics.report).toHaveBeenCalledWith({
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
                    await sign(err(connectErrorToSignVerifyError({ message: 'Canceled', code })));

                    expect(deps.analytics.report).toHaveBeenCalledTimes(1);
                    expect(deps.analytics.report).toHaveBeenCalledWith(
                        expect.objectContaining({
                            type: events.coinSignMessageEvent.name,
                            payload: expect.objectContaining({
                                status: 'cancelled',
                                error: 'DeviceCancelled',
                            }),
                        }),
                    );
                },
            );

            it('never reports the address or the signature', async () => {
                await sign(ok(SIGNED_MESSAGE));

                const reported = JSON.stringify(deps.analytics.report.mock.calls);

                expect(reported).not.toContain(ADDRESS);
                expect(reported).not.toContain(SIGNATURE);
            });
        });
    });

    describe('verifyAndReport', () => {
        const verify = (result: Result<void, VerifyError>, hex = false) =>
            createSignVerifyReporter(deps).verifyAndReport(
                { device: CONNECTED_DEVICE, symbol: SYMBOL, hex },
                () => Promise.resolve(result),
            );

        it('verify', async () => {
            const res = await verify(ok());

            expect(res.success).toBe(true);
        });

        describe('analytics', () => {
            it('reports a successful verify', async () => {
                await verify(ok(), true);

                expect(deps.analytics.report).toHaveBeenCalledTimes(1);
                expect(deps.analytics.report).toHaveBeenCalledWith({
                    type: events.coinVerifyMessageEvent.name,
                    payload: { status: 'success', symbol: 'btc', hex: true },
                });
            });

            it('reports a failed verify with the error code', async () => {
                await verify(
                    err(
                        connectErrorToSignVerifyError({
                            message: 'Invalid signature',
                            code: 'Failure_DataError',
                        }),
                    ),
                );

                expect(deps.analytics.report).toHaveBeenCalledTimes(1);
                expect(deps.analytics.report).toHaveBeenCalledWith({
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
                await verify(
                    err(
                        connectErrorToSignVerifyError({
                            message: 'Canceled',
                            code: 'Failure_ActionCancelled',
                        }),
                    ),
                );

                expect(deps.analytics.report).toHaveBeenCalledTimes(1);
                expect(deps.analytics.report).toHaveBeenCalledWith(
                    expect.objectContaining({
                        payload: expect.objectContaining({ status: 'cancelled' }),
                    }),
                );
            });

            it.each(['Method_Cancel', 'Failure_ActionCancelled'])(
                'settles a verify rejected with %s as cancelled, not as a failure',
                async code => {
                    const result = await verify(
                        err(connectErrorToSignVerifyError({ message: 'Canceled', code })),
                    );

                    expect(result).toMatchObject({
                        success: false,
                        error: { type: 'DeviceCancelled' },
                    });
                    expect(dispatchedToastTypes()).toEqual(['verify-message-cancelled']);
                },
            );

            it('settles a signature that does not verify as failed, and says so', async () => {
                const result = await verify(
                    err(
                        connectErrorToSignVerifyError({
                            message: 'Invalid signature',
                            code: 'Failure_DataError',
                        }),
                    ),
                );

                expect(result).toMatchObject({
                    success: false,
                    error: { type: 'DeviceError' },
                });
                expect(dispatchedToastTypes()).toEqual(['verify-message-error']);
            });
        });
    });
});
