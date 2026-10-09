import { type Dispatch } from '@reduxjs/toolkit';

import {
    type SuiteSyncDataRootState,
    selectSuiteSyncOutputLabelsByAccount,
} from '@suite-common/suite-sync';
import { type UpdateOutputLabelDep } from '@suite-common/suite-sync-types';
import { toGetter } from '@trezor/dependency-injection';

import {
    createDeleteLabelsForSuiteSync,
    createMigrateSuiteSyncLabelsForRbfTransaction,
    createSetLabelsForSuiteSync,
} from './createMigrateSuiteSyncLabelsForRbfTransaction';

type MigrateSuiteSyncLabelsForRbfTransactionCompositionRootDeps = {
    dispatch: Dispatch;
    getState: () => SuiteSyncDataRootState;
} & UpdateOutputLabelDep;

export const createMigrateSuiteSyncLabelsForRbfTransactionCompositionRoot = (
    deps: MigrateSuiteSyncLabelsForRbfTransactionCompositionRootDeps,
) =>
    createMigrateSuiteSyncLabelsForRbfTransaction({
        dispatch: deps.dispatch,
        getOutputs: toGetter(deps.getState, selectSuiteSyncOutputLabelsByAccount),
        deleteLabelsForSuiteSync: createDeleteLabelsForSuiteSync({
            updateOutputLabel: deps.updateOutputLabel,
        }),
        setLabelsForSuiteSync: createSetLabelsForSuiteSync({
            updateOutputLabel: deps.updateOutputLabel,
        }),
    });
