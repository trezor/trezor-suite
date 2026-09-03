import {
    type StakingBatchDataItem,
    type StakingBatchErrorsItem,
    getStakingBatch,
} from '@suite-common/earn-staking-api';
import { createTestStore } from '@suite-common/test-utils';
import { type NetworkSymbol, asNetworkSymbol } from '@suite-common/wallet-config';

import { stakeDataActions, stakeDataInitialState } from './stakingDataSlice';
import { stakeInitialState } from './stakingReducer';
import type { StakeState } from './stakingReducerTypes';
import { initStakeDataThunk } from './stakingThunks';

jest.mock('@suite-common/earn-staking-api', () => ({
    getStakingBatch: jest.fn(),
}));

const getStakingBatchMock = jest.mocked(getStakingBatch);

const ethSymbol = asNetworkSymbol('eth');
const solSymbol = asNetworkSymbol('sol');
const adaSymbol = asNetworkSymbol('ada');
const trxSymbol = asNetworkSymbol('trx');

const ethSection = {
    symbol: 'eth',
    stats: { apy: 3.1, nextRewardPayout: 3600 },
    validators: {},
} satisfies StakingBatchDataItem;

const solSection = {
    symbol: 'sol',
    stats: { apy: 6.2 },
} satisfies StakingBatchDataItem;

const adaSection = {
    symbol: 'ada',
    pools: [{ apy: 2.5, saturation: 40, id: 'pool1' }],
} satisfies StakingBatchDataItem;

const trxSection = {
    symbol: 'trx',
    representatives: [{ address: 'TSr1', name: 'SR', url: 'https://example.com', apr: 4.1 }],
} satisfies StakingBatchDataItem;

const unknownError = {
    code: 'upstream_unknown_error',
    message: 'Failed to fetch from upstream',
} satisfies StakingBatchErrorsItem;

const validationError = {
    code: 'upstream_validation_error',
    message: 'Invalid response shape',
} satisfies StakingBatchErrorsItem;

const initStore = ({
    enabledNetworks = [ethSymbol, solSymbol, adaSymbol, trxSymbol],
    stake = stakeInitialState,
}: {
    enabledNetworks?: NetworkSymbol[];
    stake?: StakeState;
} = {}) =>
    createTestStore({
        extra: undefined,
        preloadedState: {
            wallet: {
                settings: { enabledNetworks },
                stake,
            },
        },
    });

// The suite-common jest environment has no console trap, so both spies are asserted
// explicitly — console.error is captured as a Sentry event on web, desktop and mobile
// (captureConsoleIntegration) and must never fire on expected staking failure paths.
const spyOnConsole = () => ({
    warnSpy: jest.spyOn(console, 'warn').mockImplementation(() => {}),
    errorSpy: jest.spyOn(console, 'error').mockImplementation(() => {}),
});

describe('initStakeDataThunk', () => {
    afterEach(() => {
        jest.clearAllMocks();
        jest.restoreAllMocks();
    });

    it('stores fetched staking data on success without logging', async () => {
        const { warnSpy, errorSpy } = spyOnConsole();
        getStakingBatchMock.mockResolvedValueOnce({
            data: [ethSection, solSection, adaSection, trxSection],
            errors: [],
        });
        const store = initStore();

        await store.dispatch(initStakeDataThunk());

        expect(store.getActions()).toContainEqual(
            stakeDataActions.fetchStakeDataSuccess([
                ethSection,
                solSection,
                adaSection,
                trxSection,
            ]),
        );
        expect(warnSpy).not.toHaveBeenCalled();
        expect(errorSpy).not.toHaveBeenCalled();
    });

    it('stores partial data and logs a warning string instead of a Sentry-captured error when part of the batch fails', async () => {
        const { warnSpy, errorSpy } = spyOnConsole();
        getStakingBatchMock.mockResolvedValueOnce({
            data: [ethSection, adaSection, trxSection],
            errors: [unknownError],
        });
        const store = initStore();

        await store.dispatch(initStakeDataThunk());

        expect(store.getActions()).toContainEqual(
            stakeDataActions.fetchStakeDataSuccess([ethSection, adaSection, trxSection]),
        );

        // A single string argument keeps the log out of Sentry object-serialization traps
        // ("[object Object]") on every platform capturing console output.
        expect(warnSpy).toHaveBeenCalledTimes(1);
        expect(warnSpy).toHaveBeenCalledWith(
            'Staking batch upstream error (sol): upstream_unknown_error: Failed to fetch from upstream',
        );
        expect(errorSpy).not.toHaveBeenCalled();
    });

    it('lists every failed network and error when multiple batch requests fail', async () => {
        const { warnSpy, errorSpy } = spyOnConsole();
        getStakingBatchMock.mockResolvedValueOnce({
            data: [adaSection, trxSection],
            errors: [unknownError, validationError],
        });
        const store = initStore();

        await store.dispatch(initStakeDataThunk());

        expect(store.getActions()).toContainEqual(
            stakeDataActions.fetchStakeDataSuccess([adaSection, trxSection]),
        );
        expect(warnSpy).toHaveBeenCalledTimes(1);
        expect(warnSpy).toHaveBeenCalledWith(
            'Staking batch upstream error (eth, sol): upstream_unknown_error: Failed to fetch from upstream; upstream_validation_error: Invalid response shape',
        );
        expect(errorSpy).not.toHaveBeenCalled();
    });

    it('dispatches failure and logs a warning when the whole batch request fails', async () => {
        const { warnSpy, errorSpy } = spyOnConsole();
        getStakingBatchMock.mockRejectedValueOnce(new Error('Network down'));
        const store = initStore();

        await store.dispatch(initStakeDataThunk());

        expect(store.getActions()).toContainEqual(
            stakeDataActions.fetchStakeDataFailure('Network down'),
        );
        expect(warnSpy).toHaveBeenCalledTimes(1);
        expect(warnSpy).toHaveBeenCalledWith('Staking batch request failed: Network down');
        expect(errorSpy).not.toHaveBeenCalled();
    });

    it('skips fetching when current data is fresh', async () => {
        const store = initStore({
            stake: {
                ...stakeInitialState,
                data: { ...stakeDataInitialState, lastSuccessAt: Date.now() },
            },
        });

        await store.dispatch(initStakeDataThunk());

        expect(getStakingBatchMock).not.toHaveBeenCalled();
    });

    it('skips fetching when bitcoin is the only enabled network', async () => {
        const store = initStore({ enabledNetworks: [asNetworkSymbol('btc')] });

        await store.dispatch(initStakeDataThunk());

        expect(getStakingBatchMock).not.toHaveBeenCalled();
    });
});
