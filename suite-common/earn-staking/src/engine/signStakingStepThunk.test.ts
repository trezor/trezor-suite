import { type Middleware, combineReducers } from '@reduxjs/toolkit';

import { type AnalyticsSharedEvents, events } from '@suite-common/analytics';
import {
    type ComposedStakingStep,
    STAKING_SIGNING_ERROR_CODES,
    StakingAdapterError,
    type StakingFeeLevelLabel,
    type StakingProductAdapter,
} from '@suite-common/earn-staking-common';
import {
    mockComposedStakingStep,
    mockSignedStakingStep,
    mockStakingErrorFeeLevel,
    mockStakingFeeLevels,
    mockStakingProductAdapter,
    mockStakingProductDescriptor,
} from '@suite-common/earn-staking-common/mocks';
import { createTestCompositionRoot } from '@suite-common/test-utils';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { mockAnalytics } from '@trezor/analytics-uploader/mocks';
import { mock } from '@trezor/dependency-injection';
import { asNetworkSymbol } from '@trezor/network-module-types';

import {
    type SignStakingStepThunkDeps,
    type SignStakingStepThunkState,
    signStakingStepThunk,
} from './signStakingStepThunk';
import {
    mockStakingDeviceAccess,
    mockStakingDeviceAccessRun,
    mockStakingProductRepository,
    mockStakingServices,
    mockStakingSession,
    mockStakingState,
} from '../../mocks';
import type { StakingDeviceAccess } from '../createStakingDeviceAccess';
import { stakingActions, stakingReducer } from '../state/stakingReducer';
import { selectStakingSession } from '../state/stakingSessionSelectors';

const eth = mockStakingProductDescriptor();
const account = mockWalletAccount({ symbol: asNetworkSymbol('eth') });
const session = mockStakingSession({ accountKey: account.key });
const { key: sessionKey } = session;
const stake = { sessionKey, stepId: 'stake' };
const composed = mockComposedStakingStep();
const signed = mockSignedStakingStep();
const cancelledPayload = {
    type: events.transactionCancelEvent.name,
    payload: { txType: 'stake', networkSymbol: 'eth', stage: 'signing' },
};

type InitStoreParams = {
    signStep?: StakingProductAdapter['signStep'];
    deviceAccess?: StakingDeviceAccess;
    composedStep?: ComposedStakingStep | null;
    middleware?: Middleware[];
};

const initStore = ({
    signStep = mock(() => Promise.resolve(signed)),
    deviceAccess = mockStakingDeviceAccess(),
    composedStep = composed,
    middleware = [],
}: InitStoreParams = {}) => {
    const adapter = mockStakingProductAdapter({ descriptor: eth, signStep });
    const analytics = mockAnalytics<AnalyticsSharedEvents>();
    const started = mockStakingState({ descriptors: [eth], sessions: [session] });
    const root = createTestCompositionRoot<SignStakingStepThunkDeps, SignStakingStepThunkState>({
        services: () => ({
            staking: mockStakingServices({
                stakingProductRepository: mockStakingProductRepository({
                    get: mock(() => adapter),
                }),
                deviceAccess,
            }),
            analytics,
        }),
        middleware,
        reducer: {
            earn: combineReducers({ staking: stakingReducer }),
            wallet: combineReducers({ accounts: (state = [account]) => state }),
        },
        preloadedState: {
            earn: {
                staking:
                    composedStep === null
                        ? started
                        : stakingReducer(
                              started,
                              stakingActions.stepComposed({ ...stake, composed: composedStep }),
                          ),
            },
        },
    });

    return { store: root.services.store, adapter, analytics };
};

type Store = ReturnType<typeof initStore>['store'];

const getStep = (store: Store) => selectStakingSession(store.getState(), sessionKey)?.steps[0];

const cancelCurrentAttempt = (store: Store | null) => {
    const step = store === null ? undefined : getStep(store);

    if (store !== null && step?.status === 'signing') {
        store.dispatch(stakingActions.stepCancelled({ ...stake, attemptId: step.attemptId }));
    }
};

const sign = (store: Store, feeLevel: StakingFeeLevelLabel = 'normal') =>
    store.dispatch(signStakingStepThunk({ sessionKey, feeLevel }));

describe('signStakingStepThunk', () => {
    beforeEach(() => {
        jest.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('signs the composed step inside the device access and stores the signature', async () => {
        const { store, adapter, analytics } = initStore();
        const result = await sign(store);

        expect(signStakingStepThunk.fulfilled.match(result)).toBe(true);
        expect(result.payload).toBe(signed);
        expect(store.getState().earn.staking.sessions[sessionKey]?.id).toBe(session.id);
        expect(getStep(store)).toMatchObject({
            status: 'signed',
            feeLevel: 'normal',
            signingStartedAt: expect.any(Number),
            expiresAt: null,
            signed,
            error: null,
        });
        expect(adapter.signStep).toHaveBeenCalledWith({
            account,
            plan: session.plan,
            step: session.plan.steps[0],
            composedStep: composed,
            feeLevel: 'normal',
        });
        expect(analytics.report).not.toHaveBeenCalled();
    });

    it('runs the adapter through the device access', async () => {
        const deviceAccess = mockStakingDeviceAccess();
        const { store } = initStore({ deviceAccess });

        await sign(store);

        expect(deviceAccess.run).toHaveBeenCalledTimes(1);
    });

    it('stamps the deadline from the validity window', async () => {
        const { store } = initStore({
            composedStep: mockComposedStakingStep({ validityMs: 24_000 }),
        });

        await sign(store);

        const step = getStep(store);

        if (step?.status !== 'signed') throw new Error('Expected a signed step');

        expect(step.expiresAt).toBe(step.signingStartedAt + 24_000);
    });

    it('rejects when the signing dispatch was refused, without a device call', async () => {
        const dropSigning: Middleware = () => next => action =>
            stakingActions.stepSigning.match(action) ? action : next(action);
        const started = initStore({ middleware: [dropSigning] });

        const result = await sign(started.store);

        expect(result.payload).toBe('step-not-ready');
        expect(started.adapter.signStep).not.toHaveBeenCalled();
        expect(getStep(started.store)?.status).toBe('composed');
    });

    it('rejects a step that is not composed', async () => {
        const { store, adapter } = initStore({ composedStep: null });
        const result = await sign(store);

        expect(result.payload).toBe('step-not-ready');
        expect(adapter.signStep).not.toHaveBeenCalled();
        expect(getStep(store)?.status).toBe('pending');
    });

    it('rejects a fee level that is missing or not final', async () => {
        const { low: _low, ...feeLevels } = mockStakingFeeLevels({
            custom: mockStakingErrorFeeLevel(),
        });
        const { store, adapter } = initStore({
            composedStep: mockComposedStakingStep({ feeLevels }),
        });

        expect((await sign(store, 'low')).payload).toBe('step-not-ready');
        expect((await sign(store, 'custom')).payload).toBe('step-not-ready');
        expect(adapter.signStep).not.toHaveBeenCalled();
        expect(getStep(store)?.status).toBe('composed');
    });

    it('resets the step and reports when the device or the app cancels', async () => {
        const { store, analytics } = initStore({
            signStep: mock(() =>
                Promise.reject(new StakingAdapterError(STAKING_SIGNING_ERROR_CODES.cancelled)),
            ),
        });
        const result = await sign(store);

        expect(result.payload).toBe('cancelled');
        expect(getStep(store)).toMatchObject({ status: 'composed', composed, error: null });
        expect(analytics.report).toHaveBeenCalledWith(cancelledPayload);
    });

    it('resets the step with expired on the validity timeout', async () => {
        const { store, analytics } = initStore({
            signStep: mock(() =>
                Promise.reject(new StakingAdapterError(STAKING_SIGNING_ERROR_CODES.expired)),
            ),
        });
        const result = await sign(store);

        expect(result.payload).toBe('step-expired');
        expect(getStep(store)).toMatchObject({
            status: 'composed',
            error: { kind: 'expired', code: null },
        });
        expect(analytics.report).not.toHaveBeenCalled();
    });

    it('resets the step with the failure code otherwise', async () => {
        const { store } = initStore({
            signStep: mock(() => Promise.reject(new StakingAdapterError('Failure_DataError'))),
        });
        const result = await sign(store);

        expect(result.payload).toBe('adapter-failed');
        expect(getStep(store)).toMatchObject({
            status: 'composed',
            error: { kind: 'sign-failed', code: 'Failure_DataError' },
        });
        expect(console.warn).toHaveBeenCalledWith(
            'Staking step stake sign failed: Failure_DataError',
        );
    });

    it('treats a step reset before the device slot opens as cancelled', async () => {
        let store: Store | null = null;
        const deviceAccess = mockStakingDeviceAccess({
            run: mockStakingDeviceAccessRun(callback => {
                cancelCurrentAttempt(store);

                return callback();
            }),
        });
        const started = initStore({ deviceAccess });

        store = started.store;

        const result = await sign(store);

        expect(result.payload).toBe('cancelled');
        expect(started.adapter.signStep).not.toHaveBeenCalled();
        expect(getStep(store)?.status).toBe('composed');
        expect(started.analytics.report).toHaveBeenCalledWith(cancelledPayload);
    });

    it('drops a signature that arrives after a cancel', async () => {
        let store: Store | null = null;
        const started = initStore({
            signStep: mock(() => {
                cancelCurrentAttempt(store);

                return Promise.resolve(signed);
            }),
        });

        store = started.store;

        const result = await sign(store);

        expect(result.payload).toBe('cancelled');
        expect(getStep(store)).toMatchObject({ status: 'composed', error: null });
        expect(started.analytics.report).toHaveBeenCalledWith(cancelledPayload);
    });
});
