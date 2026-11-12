import { events } from '@suite-common/analytics';
import { deviceInitialState } from '@suite-common/device';
import { type TrezorDevice } from '@suite-common/suite-types';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { testMocks } from '@suite-common/test-utils';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { mockAnalytics } from '@trezor/analytics-uploader/mocks';

import {
    type SignVerifyDep,
    createSignVerifyCompositionRoot,
} from './createSignVerifyCompositionRoot';
import { type SignVerifyRootState } from './getStateParams';
import { verifyThunk } from './verifyThunk';

const ADDRESS = 'ADDRESS';
const MESSAGE = 'MESSAGE';
const SIGNATURE = 'SIGNATURE';
const ACCOUNT = mockWalletAccount({ symbol: asNetworkSymbol('btc') });

const CONNECTED_DEVICE = mockSuiteDevice({ connected: true, available: true });

const createState = (selectedDevice: TrezorDevice | undefined): SignVerifyRootState => ({
    device: { ...deviceInitialState, selectedDevice },
});

describe(verifyThunk.name, () => {
    let dispatch: jest.Mock;
    let deps: { services: SignVerifyDep & { analytics: ReturnType<typeof mockAnalytics> } };

    // The thunk only reads the selected device, so a state literal is enough — no store, no
    // middleware.
    const getState = () => createState(CONNECTED_DEVICE);

    beforeEach(() => {
        dispatch = jest.fn();
        deps = {
            services: {
                analytics: mockAnalytics(),
                // The thunks reach the device through these services, on the Connect mock.
                ...createSignVerifyCompositionRoot({
                    getTrezorConnect: () => testMocks.getTrezorConnectMock(),
                }),
            },
        };
    });

    const dispatchedToastTypes = () =>
        dispatch.mock.calls
            .map(([action]) => action?.payload?.type)
            .filter((type): type is string => typeof type === 'string');

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
        expect(res).toStrictEqual('verified');
    });

    describe('hex format', () => {
        const connect = () => testMocks.getTrezorConnectMock();

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
    });

    describe('analytics', () => {
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

        it.each(['Method_Cancel', 'Failure_ActionCancelled'])(
            'settles a verify rejected with %s as cancelled, not as a failure',
            async code => {
                testMocks.setTrezorConnectFixtures({
                    success: false,
                    error: { message: 'Cancelled', code },
                });

                const result = await verifyThunk(
                    ACCOUNT,
                    ADDRESS,
                    MESSAGE,
                    SIGNATURE,
                )(dispatch, getState, deps);

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

            const result = await verifyThunk(
                ACCOUNT,
                ADDRESS,
                MESSAGE,
                SIGNATURE,
            )(dispatch, getState, deps);

            expect(result).toBe('failed');
            expect(dispatchedToastTypes()).toEqual(['verify-message-error']);
        });

        it('never reports the message, the address or the signature', async () => {
            testMocks.setTrezorConnectFixtures({
                success: true,
                payload: { address: ADDRESS, signature: SIGNATURE },
            });

            await verifyThunk(ACCOUNT, ADDRESS, MESSAGE, SIGNATURE)(dispatch, getState, deps);

            const reported = JSON.stringify(deps.services.analytics.report.mock.calls);

            expect(reported).not.toContain(MESSAGE);
            expect(reported).not.toContain(ADDRESS);
            expect(reported).not.toContain(SIGNATURE);
        });
    });
});
