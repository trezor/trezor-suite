import { type MigrateSuiteSyncLabelsForRbfTransaction } from '../src';

export const mockMigrateSuiteSyncLabelsForRbfTransaction =
    (): MigrateSuiteSyncLabelsForRbfTransaction => () =>
        Promise.resolve([[], []]);
