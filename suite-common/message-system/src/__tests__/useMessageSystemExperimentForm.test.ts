import { combineReducers } from '@reduxjs/toolkit';

import { type Experiments } from '@suite-common/suite-types';
import {
    act,
    configureMockStore,
    extraDependenciesCommonMock,
    renderHookWithStoreProvider,
} from '@suite-common/test-utils';

import { messageSystemInitialState, prepareMessageSystemReducer } from '../messageSystemReducer';
import { type MessageSystemState } from '../messageSystemTypes';
import { getDefaultExperiment } from '../messageSystemUtils';
import { useMessageSystemExperimentForm } from '../useMessageSystemExperimentForm';

// jsdom 20 lacks crypto.randomUUID, which getDefaultExperiment relies on
if (typeof globalThis.crypto.randomUUID !== 'function') {
    let counter = 0;
    Object.defineProperty(globalThis.crypto, 'randomUUID', {
        value: () => `00000000-0000-4000-8000-${`${counter++}`.padStart(12, '0')}`,
    });
}

const messageSystemReducer = prepareMessageSystemReducer(extraDependenciesCommonMock);

const createStore = (experiments: Experiments[] = []) =>
    configureMockStore({
        extra: {},
        reducer: combineReducers({ messageSystem: messageSystemReducer }),
        preloadedState: {
            messageSystem: {
                ...messageSystemInitialState,
                config: {
                    version: 1,
                    timestamp: '2023-01-01',
                    sequence: 1,
                    actions: [],
                    experiments,
                },
            } as unknown as MessageSystemState,
        },
    });

const renderForm = (store = createStore()) =>
    renderHookWithStoreProvider(() => useMessageSystemExperimentForm(), { store });

describe('useMessageSystemExperimentForm', () => {
    it('initializes with a valid default experiment', () => {
        const { result } = renderForm();

        const parsed = JSON.parse(result.current.formData);

        expect(parsed.experiment.groups).toHaveLength(2);
        expect(result.current.parsedData).toEqual(parsed);
        expect(result.current.validationErrors).toEqual([]);
        expect(result.current.isValid).toBe(true);
        expect(result.current.canFormat).toBe(true);
    });

    it('reports a JSON error for unparsable input', () => {
        const { result } = renderForm();

        act(() => {
            result.current.setFormData('{ not json');
        });

        expect(result.current.parsedData).toBeNull();
        expect(result.current.isValid).toBe(false);
        expect(result.current.validationErrors).toHaveLength(1);
        expect(result.current.validationErrors[0]?.field).toBe('JSON');
        expect(result.current.canFormat).toBe(false);
    });

    it('surfaces yup errors for a schema-invalid experiment', () => {
        const { result } = renderForm();
        const { experiment, conditions } = getDefaultExperiment();
        const { groups, ...experimentWithoutGroups } = experiment;
        const schemaInvalidExperiment = { experiment: experimentWithoutGroups, conditions };

        act(() => {
            result.current.setFormData(JSON.stringify(schemaInvalidExperiment));
        });

        expect(result.current.parsedData).toEqual(schemaInvalidExperiment);
        expect(result.current.canFormat).toBe(true);
        expect(result.current.isValid).toBe(false);
        expect(
            result.current.validationErrors.some(error => error.field === 'experiment.groups'),
        ).toBe(true);
    });

    it('rejects a duplicate experiment id', () => {
        const existing = getDefaultExperiment();
        const { result } = renderForm(createStore([existing]));

        const duplicate = getDefaultExperiment();
        duplicate.experiment.id = existing.experiment.id;

        act(() => {
            result.current.setFormData(JSON.stringify(duplicate, null, 2));
        });

        expect(result.current.isValid).toBe(false);
        expect(result.current.validationErrors[0]?.field).toBe('experiment.id');
        expect(result.current.validationErrors[0]?.message).toContain('must be unique');
    });

    it('restores a valid default via applyPreset after edits', () => {
        const { result } = renderForm();

        act(() => {
            result.current.setFormData('{ not json');
        });

        expect(result.current.isValid).toBe(false);

        act(() => {
            result.current.applyPreset();
        });

        expect(result.current.isValid).toBe(true);
        expect(result.current.parsedData).toEqual(JSON.parse(result.current.formData));
    });
});
