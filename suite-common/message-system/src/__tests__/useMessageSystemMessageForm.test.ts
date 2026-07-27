import { combineReducers } from '@reduxjs/toolkit';

import { type Action } from '@suite-common/suite-types';
import {
    act,
    configureMockStore,
    extraDependenciesCommonMock,
    renderHookWithStoreProvider,
} from '@suite-common/test-utils';

import { messageSystemInitialState, prepareMessageSystemReducer } from '../messageSystemReducer';
import { type MessageSystemState } from '../messageSystemTypes';
import { getDefaultActionByCategory } from '../messageSystemUtils';
import { useMessageSystemMessageForm } from '../useMessageSystemMessageForm';

// jsdom 20 lacks crypto.randomUUID, which getDefaultActionByCategory relies on
if (typeof globalThis.crypto.randomUUID !== 'function') {
    let counter = 0;
    Object.defineProperty(globalThis.crypto, 'randomUUID', {
        value: () => `00000000-0000-4000-8000-${`${counter++}`.padStart(12, '0')}`,
    });
}

const messageSystemReducer = prepareMessageSystemReducer(extraDependenciesCommonMock);

const createStore = (actions: Action[] = []) =>
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
                    actions,
                    experiments: [],
                },
            } as unknown as MessageSystemState,
        },
    });

const renderForm = (store = createStore()) =>
    renderHookWithStoreProvider(() => useMessageSystemMessageForm(), { store });

describe('useMessageSystemMessageForm', () => {
    it('initializes with a valid banner preset', () => {
        const { result } = renderForm();

        const parsed = JSON.parse(result.current.formData);

        expect(parsed.message.category).toBe('banner');
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

    it('surfaces yup errors for a schema-invalid action', () => {
        const { result } = renderForm();
        const { message, conditions } = getDefaultActionByCategory('banner');
        const { id, ...messageWithoutId } = message;
        const schemaInvalidAction = { message: messageWithoutId, conditions };

        act(() => {
            result.current.setFormData(JSON.stringify(schemaInvalidAction));
        });

        expect(result.current.parsedData).toEqual(schemaInvalidAction);
        expect(result.current.canFormat).toBe(true);
        expect(result.current.isValid).toBe(false);
        expect(result.current.validationErrors.some(error => error.field === 'message.id')).toBe(
            true,
        );
    });

    it('rejects a duplicate message id', () => {
        const existing = getDefaultActionByCategory('banner');
        const { result } = renderForm(createStore([existing]));

        const duplicate = getDefaultActionByCategory('banner');
        duplicate.message.id = existing.message.id;

        act(() => {
            result.current.setFormData(JSON.stringify(duplicate, null, 2));
        });

        expect(result.current.isValid).toBe(false);
        expect(result.current.validationErrors[0]?.field).toBe('message.id');
        expect(result.current.validationErrors[0]?.message).toContain('must be unique');
    });

    it('applies the modal preset', () => {
        const { result } = renderForm();

        act(() => {
            result.current.applyPreset('modal');
        });

        const parsed = JSON.parse(result.current.formData);

        expect(parsed.message.category).toBe('modal');
        expect(parsed.message.modal).toBeDefined();
        // the modal preset ships with an empty image, which the schema requires the user to fill
        expect(result.current.isValid).toBe(false);
        expect(result.current.validationErrors[0]?.field).toBe('message.modal.image');
    });
});
