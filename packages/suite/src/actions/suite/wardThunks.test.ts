import { suiteSettingsInitialState } from '@suite/settings';
import { type EnsureDelegatedIdentityKey } from '@suite-common/delegated-identity-key-types';
import { deviceInitialState } from '@suite-common/device';
import { createMockDispatch } from '@suite-common/redux-utils/mocks';
import { asDelegatedIdentityKey } from '@suite-common/suite-types';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import TrezorConnect, { type StaticSessionId } from '@trezor/connect';
import { err, ok } from '@trezor/type-utils';

import {
    type WardFlushThunkDeps,
    type WardFlushThunkState,
    wardFlushThunk,
    wardQueueEntryThunk,
    wardResetAppThunk,
    wardStatusThunk,
} from './wardThunks';

const WALLET_A: StaticSessionId = 'walletA@device-id:0';
const WALLET_B: StaticSessionId = 'walletB@device-id:1';
const WARDD_TOKEN = 'wardd-pairing-token';
// Any 32-byte P-256 scalar below the curve order; the proof is really signed with it.
const DELEGATED_KEY = asDelegatedIdentityKey('01'.repeat(32));

const QUEUE_ENTRY = { appId: 'contacts', identifier: 'ab'.repeat(32), value: '416c696365' };

const mockWallet = (staticSessionId: StaticSessionId, sessionId = 'session-1') =>
    mockSuiteDevice({
        path: '1',
        connected: true,
        instance: staticSessionId === WALLET_A ? undefined : 1,
        useEmptyPassphrase: staticSessionId === WALLET_A,
        state: { staticSessionId, sessionId },
    });

type CreateStateParams = {
    selectedWallet?: StaticSessionId;
    warddToken?: string;
    sessionId?: string;
};

const createState = ({
    selectedWallet = WALLET_A,
    warddToken = WARDD_TOKEN,
    sessionId,
}: CreateStateParams = {}): WardFlushThunkState => {
    const devices = [mockWallet(WALLET_A, sessionId), mockWallet(WALLET_B, sessionId)];

    return {
        device: {
            ...deviceInitialState,
            devices,
            selectedDevice: devices.find(
                device => device.state?.staticSessionId === selectedWallet,
            ),
        },
        suiteSettings: {
            ...suiteSettingsInitialState,
            debug: { ...suiteSettingsInitialState.debug, warddToken },
        },
    };
};

const createWardThunkDeps = (params?: CreateStateParams) => {
    let state = createState(params);
    const getState = () => state;
    const setState = (nextParams: CreateStateParams) => {
        state = createState(nextParams);
    };
    const ensureDelegatedIdentityKey = jest.fn<
        ReturnType<EnsureDelegatedIdentityKey>,
        Parameters<EnsureDelegatedIdentityKey>
    >(() => Promise.resolve(ok(DELEGATED_KEY)));
    const extra: WardFlushThunkDeps = { services: { ensureDelegatedIdentityKey } };
    const { actions, dispatch } = createMockDispatch({ getState, extra });

    return { actions, dispatch, getState, setState, extra, ensureDelegatedIdentityKey };
};

const mockWardRelay = jest.mocked(TrezorConnect.wardRelay);
const mockWardQueueSetEntry = jest.mocked(TrezorConnect.wardQueueSetEntry);
const mockWardResetApp = jest.mocked(TrezorConnect.wardResetApp);

const mockWardRelayError = (message: string) =>
    mockWardRelay.mockResolvedValueOnce({ success: false, error: { message, code: 'Runtime' } });

describe('wardThunks', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('wardQueueEntryThunk', () => {
        it('queues a full (not compact) record for the selected wallet', async () => {
            const { dispatch, getState, extra } = createWardThunkDeps();
            mockWardQueueSetEntry.mockResolvedValueOnce({ success: true, payload: {} });

            const result = await wardQueueEntryThunk({ deviceState: WALLET_A, ...QUEUE_ENTRY })(
                dispatch,
                getState,
                extra,
            );

            expect(result.payload).toEqual(ok());
            expect(mockWardQueueSetEntry).toHaveBeenCalledWith({
                device: {
                    path: '1',
                    instance: undefined,
                    state: { staticSessionId: WALLET_A, sessionId: 'session-1' },
                    useEmptyPassphrase: true,
                },
                app_id: 'contacts',
                identifier: QUEUE_ENTRY.identifier,
                value: QUEUE_ENTRY.value,
                compact: false,
            });
        });

        it('reports a refusal by the device', async () => {
            const { dispatch, getState, extra } = createWardThunkDeps();
            mockWardQueueSetEntry.mockResolvedValueOnce({
                success: false,
                error: { message: 'Invalid entry', code: 'Failure_DataError' },
            });

            const result = await wardQueueEntryThunk({ deviceState: WALLET_A, ...QUEUE_ENTRY })(
                dispatch,
                getState,
                extra,
            );

            expect(result.payload).toEqual(
                err({ code: 'device_failure', detail: 'Invalid entry' }),
            );
        });

        it('reports a confirmation the user cancelled', async () => {
            const { dispatch, getState, extra } = createWardThunkDeps();
            mockWardQueueSetEntry.mockResolvedValueOnce({
                success: false,
                error: { message: 'Action cancelled by user', code: 'Failure_ActionCancelled' },
            });

            const result = await wardQueueEntryThunk({ deviceState: WALLET_A, ...QUEUE_ENTRY })(
                dispatch,
                getState,
                extra,
            );

            expect(result.payload).toEqual(
                err({ code: 'cancelled', detail: 'Action cancelled by user' }),
            );
        });

        it('keeps a write confirmed while the user selected another wallet', async () => {
            const { dispatch, getState, setState, extra } = createWardThunkDeps();
            mockWardQueueSetEntry.mockImplementationOnce(() => {
                setState({ selectedWallet: WALLET_B });

                return Promise.resolve({ success: true, payload: {} });
            });

            const result = await wardQueueEntryThunk({ deviceState: WALLET_A, ...QUEUE_ENTRY })(
                dispatch,
                getState,
                extra,
            );

            // The request named wallet A, so the device queued the change for wallet A.
            expect(result.payload).toEqual(ok());
            expect(mockWardQueueSetEntry).toHaveBeenCalledWith(
                expect.objectContaining({
                    device: expect.objectContaining({
                        state: { staticSessionId: WALLET_A, sessionId: 'session-1' },
                    }),
                }),
            );
        });

        it('does not ask the device when another wallet is selected', async () => {
            const { dispatch, getState, extra } = createWardThunkDeps({
                selectedWallet: WALLET_B,
            });

            const result = await wardQueueEntryThunk({ deviceState: WALLET_A, ...QUEUE_ENTRY })(
                dispatch,
                getState,
                extra,
            );

            expect(result.payload).toEqual(err({ code: 'wallet_changed' }));
            expect(mockWardQueueSetEntry).not.toHaveBeenCalled();
        });

        it('does not ask the device to queue a change without a wardd token', async () => {
            const { dispatch, getState, extra } = createWardThunkDeps({ warddToken: '' });

            const result = await wardQueueEntryThunk({ deviceState: WALLET_A, ...QUEUE_ENTRY })(
                dispatch,
                getState,
                extra,
            );

            expect(result.payload).toEqual(err({ code: 'missing_token' }));
            expect(mockWardQueueSetEntry).not.toHaveBeenCalled();
        });
    });

    describe('wardFlushThunk', () => {
        it('flushes through wardd with the token and a delegated identity proof', async () => {
            const { dispatch, getState, extra, ensureDelegatedIdentityKey } = createWardThunkDeps();
            mockWardRelay.mockResolvedValueOnce({
                success: true,
                payload: { counter: 4, root: 'aa', published: 2, remaining: 0 },
            });

            const result = await wardFlushThunk()(dispatch, getState, extra);

            expect(result.payload).toEqual(ok({ published: 2, remaining: 0 }));
            expect(ensureDelegatedIdentityKey).toHaveBeenCalledWith({
                device: getState().device.selectedDevice,
            });
            expect(mockWardRelay).toHaveBeenCalledWith({
                device: {
                    path: '1',
                    instance: undefined,
                    state: { staticSessionId: WALLET_A, sessionId: 'session-1' },
                    useEmptyPassphrase: true,
                },
                url: 'ws://127.0.0.1:21329',
                token: WARDD_TOKEN,
                op: 'flush',
                proof_of_delegated_identity: expect.stringMatching(/^[0-9a-f]{128}$/),
            });
        });

        it('runs on the session the delegated key retrieval left the device in', async () => {
            const { dispatch, getState, setState, extra, ensureDelegatedIdentityKey } =
                createWardThunkDeps();
            ensureDelegatedIdentityKey.mockImplementationOnce(() => {
                setState({ sessionId: 'session-2' });

                return Promise.resolve(ok(DELEGATED_KEY));
            });
            mockWardRelay.mockResolvedValueOnce({
                success: true,
                payload: { published: 0, remaining: 0 },
            });

            await wardFlushThunk()(dispatch, getState, extra);

            expect(mockWardRelay).toHaveBeenCalledWith(
                expect.objectContaining({
                    device: expect.objectContaining({
                        state: { staticSessionId: WALLET_A, sessionId: 'session-2' },
                    }),
                }),
            );
        });

        it('keeps the token and the proof out of every dispatched action', async () => {
            const { actions, dispatch, getState, extra } = createWardThunkDeps();
            mockWardRelay.mockResolvedValueOnce({
                success: true,
                payload: { published: 1, remaining: 0 },
            });

            await wardFlushThunk({ deviceState: WALLET_A })(dispatch, getState, extra);

            const proof = mockWardRelay.mock.calls[0]?.[0].proof_of_delegated_identity;
            const serializedActions = JSON.stringify(actions);

            expect(actions).toHaveLength(2);
            expect(proof).toEqual(expect.any(String));
            expect(serializedActions).not.toContain(WARDD_TOKEN);
            expect(serializedActions).not.toContain(proof);
        });

        it('does not contact wardd without a token', async () => {
            const { dispatch, getState, extra, ensureDelegatedIdentityKey } = createWardThunkDeps({
                warddToken: '',
            });

            const result = await wardFlushThunk()(dispatch, getState, extra);

            expect(result.payload).toEqual(err({ code: 'missing_token' }));
            expect(ensureDelegatedIdentityKey).not.toHaveBeenCalled();
            expect(mockWardRelay).not.toHaveBeenCalled();
        });

        it('refuses to flush another wallet than the one the caller queued for', async () => {
            const { dispatch, getState, extra } = createWardThunkDeps({
                selectedWallet: WALLET_B,
            });

            const result = await wardFlushThunk({ deviceState: WALLET_A })(
                dispatch,
                getState,
                extra,
            );

            expect(result.payload).toEqual(err({ code: 'wallet_changed' }));
            expect(mockWardRelay).not.toHaveBeenCalled();
        });

        it('reports a cancelled delegated key retrieval', async () => {
            const { dispatch, getState, extra, ensureDelegatedIdentityKey } = createWardThunkDeps();
            ensureDelegatedIdentityKey.mockResolvedValueOnce(err({ type: 'DeviceCancelled' }));

            const result = await wardFlushThunk()(dispatch, getState, extra);

            expect(result.payload).toEqual(err({ code: 'cancelled' }));
            expect(mockWardRelay).not.toHaveBeenCalled();
        });

        it.each([
            ['wardd needs_rejoin: off the history', 'needs_rejoin'],
            ['wardd wm_behind: the device is at 5 but the WM holds 4', 'wm_behind'],
            ['wardd wm_conflict: sync and retry', 'wm_conflict'],
            ['wardd unauthorised: wrong pairing token', 'unauthorised'],
            ['wardd no_store: openStore first', 'no_store'],
            ['wardd device_failure: the device refused', 'device_failure'],
            ['wardd version_mismatch: wardd speaks 2.0', 'version_mismatch'],
            ['wardd internal: the WM does not know this wallet', 'internal'],
            ['wardd bad_request: unknown method', 'internal'],
            ['wardd unreachable: wardd is not reachable at ws://127.0.0.1:21329', 'unreachable'],
            ['wardd closed: wardd closed the connection', 'unreachable'],
        ])('maps "%s" to %s', async (message, code) => {
            const { dispatch, getState, extra } = createWardThunkDeps();
            mockWardRelayError(message);

            const result = await wardFlushThunk()(dispatch, getState, extra);

            expect(result.payload).toEqual(err({ code, detail: message }));
        });
    });

    describe('wardStatusThunk', () => {
        it("reports the replica's and the witness's head", async () => {
            const { dispatch, getState, extra } = createWardThunkDeps();
            mockWardRelay.mockResolvedValueOnce({
                success: true,
                payload: { counter: 3, root: 'aa', wmCounter: null, wmRoot: null, behind: false },
            });

            const result = await wardStatusThunk()(dispatch, getState, extra);

            expect(result.payload).toEqual(ok({ counter: 3, wmCounter: null, isBehind: false }));
            expect(mockWardRelay).toHaveBeenCalledWith(expect.objectContaining({ op: 'status' }));
        });

        it('reports a status without counters as a wardd failure', async () => {
            const { dispatch, getState, extra } = createWardThunkDeps();
            mockWardRelay.mockResolvedValueOnce({ success: true, payload: {} });

            const result = await wardStatusThunk()(dispatch, getState, extra);

            expect(result.payload).toEqual(
                err({ code: 'internal', detail: 'wardd sent a status without counters' }),
            );
        });
    });

    describe('wardResetAppThunk', () => {
        it('reports whether a pinned app was retired', async () => {
            const { dispatch, getState, extra } = createWardThunkDeps();
            mockWardResetApp.mockResolvedValueOnce({ success: true, payload: { was_bound: true } });

            const result = await wardResetAppThunk()(dispatch, getState, extra);

            expect(result.payload).toEqual(ok({ wasBound: true }));
        });

        it('needs a connected device', async () => {
            const { dispatch, getState, extra } = createWardThunkDeps({
                selectedWallet: 'walletC@device-id:2',
            });

            const result = await wardResetAppThunk()(dispatch, getState, extra);

            expect(result.payload).toEqual(err({ code: 'no_device' }));
            expect(mockWardResetApp).not.toHaveBeenCalled();
        });
    });
});
