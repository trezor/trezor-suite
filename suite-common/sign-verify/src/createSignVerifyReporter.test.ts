import { events } from '@suite-common/analytics';
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
    type SignReportParams,
    type SignVerifyReporterDeps,
    createSignVerifyReporter,
} from './createSignVerifyReporter';

const ADDRESS = 'ADDRESS';
const SIGNATURE = 'SIGNATURE';
const SYMBOL = asNetworkSymbol('btc');
const SIGNED_MESSAGE = { address: ADDRESS, signature: SIGNATURE };

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

    describe('reportSign', () => {
        const reportSign = (
            result: Result<SignedMessage, SignError>,
            { hex = false, signatureFormat }: Partial<SignReportParams> = {},
        ) =>
            createSignVerifyReporter(deps).reportSign(
                { symbol: SYMBOL, hex, signatureFormat },
                result,
            );

        it('reports which reading was used', () => {
            reportSign(ok(SIGNED_MESSAGE), { hex: true });

            expect(deps.analytics.report).toHaveBeenCalledWith(
                expect.objectContaining({ payload: expect.objectContaining({ hex: true }) }),
            );
        });

        it('reports a successful sign with the input format and the signature format', () => {
            reportSign(ok(SIGNED_MESSAGE), { hex: true, signatureFormat: 'electrum' });

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

        it('reports a failed sign with the error code', () => {
            reportSign(
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
            code => {
                reportSign(err(connectErrorToSignVerifyError({ message: 'Canceled', code })));

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

        it('never reports the address or the signature', () => {
            reportSign(ok(SIGNED_MESSAGE));

            const reported = JSON.stringify(deps.analytics.report.mock.calls);

            expect(reported).not.toContain(ADDRESS);
            expect(reported).not.toContain(SIGNATURE);
        });
    });

    describe('reportVerify', () => {
        const reportVerify = (result: Result<void, VerifyError>, hex = false) =>
            createSignVerifyReporter(deps).reportVerify({ symbol: SYMBOL, hex }, result);

        it('reports a successful verify', () => {
            reportVerify(ok(), true);

            expect(deps.analytics.report).toHaveBeenCalledTimes(1);
            expect(deps.analytics.report).toHaveBeenCalledWith({
                type: events.coinVerifyMessageEvent.name,
                payload: { status: 'success', symbol: 'btc', hex: true },
            });
        });

        it('reports a failed verify with the error code', () => {
            reportVerify(
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

        it('reports a verify rejected on the device as cancelled', () => {
            reportVerify(
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
            'says a verify rejected with %s was cancelled, not that it failed',
            code => {
                reportVerify(err(connectErrorToSignVerifyError({ message: 'Canceled', code })));

                expect(dispatchedToastTypes()).toEqual(['verify-message-cancelled']);
            },
        );

        it('says a signature that does not verify failed', () => {
            reportVerify(
                err(
                    connectErrorToSignVerifyError({
                        message: 'Invalid signature',
                        code: 'Failure_DataError',
                    }),
                ),
            );

            expect(dispatchedToastTypes()).toEqual(['verify-message-error']);
        });
    });
});
