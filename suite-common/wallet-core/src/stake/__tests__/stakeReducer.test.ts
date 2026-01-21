import { extraDependenciesCommonMock } from '@suite-common/test-utils';

import * as fixtures from '../__fixtures__/stakeReducer';
import { prepareStakeReducer, stakeInitialState } from '../stakeReducer';
import {
    fetchEverstakeData,
    fetchEverstakeRewards,
    fetchEverstakeStakingInfo,
} from '../stakeThunks';

const stakeReducer = prepareStakeReducer(extraDependenciesCommonMock);

describe('stakeReducer', () => {
    describe('fetchEverstakeData.pending', () => {
        fixtures.fetchEverstakeDataPending.forEach(f => {
            it(f.description, () => {
                const result = stakeReducer(
                    {
                        ...stakeInitialState,
                        ...f.initialState,
                    },
                    {
                        type: fetchEverstakeData.pending.type,
                        meta: { arg: f.actionPayload },
                    },
                );

                expect(result.data).toStrictEqual(f.result);
            });
        });
    });

    describe('fetchEverstakeData.fulfilled', () => {
        fixtures.fetchEverstakeDataFulfilled.forEach(f => {
            it(f.description, () => {
                const result = stakeReducer(
                    {
                        ...stakeInitialState,
                        ...f.initialState,
                    },
                    {
                        type: fetchEverstakeData.fulfilled.type,
                        payload: f.payload,
                        meta: { arg: f.actionPayload },
                    },
                );

                expect(result.data).toStrictEqual(f.result);
            });
        });
    });

    describe('fetchEverstakeData.rejected', () => {
        fixtures.fetchEverstakeDataRejected.forEach(f => {
            it(f.description, () => {
                const result = stakeReducer(
                    {
                        ...stakeInitialState,
                        ...f.initialState,
                    },
                    {
                        type: fetchEverstakeData.rejected.type,
                        meta: { arg: f.actionPayload },
                        error: { message: 'err' },
                    },
                );

                expect(result.data).toStrictEqual(f.result);
            });
        });
    });

    describe('fetchEverstakeStakingInfo.pending', () => {
        fixtures.fetchEverstakeStakingInfoPending.forEach(f => {
            it(f.description, () => {
                const result = stakeReducer(
                    { ...stakeInitialState, ...f.initialState },
                    {
                        type: fetchEverstakeStakingInfo.pending.type,
                        meta: { arg: f.actionPayload },
                    },
                );

                expect(result.data).toStrictEqual(f.result);
            });
        });
    });

    describe('fetchEverstakeStakingInfo.fulfilled', () => {
        fixtures.fetchEverstakeStakingInfoFulfilled.forEach(f => {
            it(f.description, () => {
                const result = stakeReducer(
                    { ...stakeInitialState, ...f.initialState },
                    {
                        type: fetchEverstakeStakingInfo.fulfilled.type,
                        payload: f.payload,
                        meta: { arg: f.actionPayload },
                    },
                );

                expect(result.data).toStrictEqual(f.result);
            });
        });
    });

    describe('fetchEverstakeStakingInfo.rejected', () => {
        fixtures.fetchEverstakeStakingInfoRejected.forEach(f => {
            it(f.description, () => {
                const result = stakeReducer(
                    { ...stakeInitialState, ...f.initialState },
                    {
                        type: fetchEverstakeStakingInfo.rejected.type,
                        meta: { arg: f.actionPayload },
                        error: { message: 'err' },
                    },
                );

                expect(result.data).toStrictEqual(f.result);
            });
        });
    });

    describe('fetchEverstakeRewards.pending', () => {
        fixtures.fetchEverstakeRewardsPending.forEach(f => {
            it(f.description, () => {
                const result = stakeReducer(
                    { ...stakeInitialState, ...f.initialState },
                    {
                        type: fetchEverstakeRewards.pending.type,
                        meta: { arg: f.actionPayload },
                    },
                );

                expect(result.data).toStrictEqual(f.result);
            });
        });
    });

    describe('fetchEverstakeRewards.fulfilled', () => {
        fixtures.fetchEverstakeRewardsFulfilled.forEach(f => {
            it(f.description, () => {
                const result = stakeReducer(
                    { ...stakeInitialState, ...f.initialState },
                    {
                        type: fetchEverstakeRewards.fulfilled.type,
                        payload: f.payload,
                        meta: { arg: f.actionPayload },
                    },
                );

                expect(result.data).toStrictEqual(f.result);
            });
        });
    });

    describe('fetchEverstakeRewards.rejected', () => {
        fixtures.fetchEverstakeRewardsRejected.forEach(f => {
            it(f.description, () => {
                const result = stakeReducer(
                    { ...stakeInitialState, ...f.initialState },
                    {
                        type: fetchEverstakeRewards.rejected.type,
                        meta: { arg: f.actionPayload },
                        error: { message: 'err' },
                    },
                );

                expect(result.data).toStrictEqual(f.result);
            });
        });
    });
});
