import { type Dispatch } from '@reduxjs/toolkit';

import { toGetter } from '@suite-common/dependency-injection';
import { selectSuiteSyncOutputLabelsByAccount } from '@suite-common/suite-sync';
import { type UpdateOutputLabelDep } from '@suite-common/suite-sync-types';

import {
    createDeleteLabelsForSuiteSync,
    createMigrateSuiteSyncLabelsForRbfTransaction,
    createSetLabelsForSuiteSync,
} from './createMigrateSuiteSyncLabelsForRbfTransaction';

type MigrateSuiteSyncLabelsForRbfTransactionCompositionRootDeps = {
    dispatch: Dispatch;
    getState: () => any;
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
