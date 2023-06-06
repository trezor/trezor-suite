import produce from 'immer';
import { createSelector } from '@reduxjs/toolkit';

import { STORAGE, METADATA } from '@suite-actions/constants';
import { Action } from '@suite-types';
import { MetadataState } from '@suite-types/metadata';
import { selectDevice } from '@suite-reducers/suiteReducer';
import { selectSelectedAccount } from '@wallet-reducers/selectedAccountReducer';

export const initialState: MetadataState = {
    // is Suite trying to load metadata (get master key -> sync cloud)?
    enabled: false,
    initiating: false,
    providers: [],
    selectedProvider: {
        labels: '',
        passwords: '',
    },
};

const metadataReducer = (state = initialState, action: Action): MetadataState =>
    produce(state, draft => {
        switch (action.type) {
            case STORAGE.LOAD:
                return action.payload.metadata || state;
            case METADATA.ENABLE:
                draft.enabled = true;
                break;
            case METADATA.DISABLE:
                draft.enabled = false;
                break;
            case METADATA.ADD_PROVIDER:
                draft.providers.push(action.payload);
                break;
            case METADATA.SET_SELECTED_PROVIDER:
                draft.selectedProvider[action.payload.dataType] = action.payload.clientId;
                break;
            case METADATA.SET_EDITING:
                draft.editing = action.payload;
                break;
            case METADATA.SET_INITIATING:
                draft.initiating = action.payload;
                break;
            case METADATA.SET_DATA:
                // if (!draft.data[action.payload.provider]) {
                //     draft.data[action.payload.provider] = {};
                // }
                const targetProvider = draft.providers.find(
                    p =>
                        p.type === action.payload.provider.type &&
                        p.clientId === action.payload.provider.clientId,
                );
                if (!targetProvider) {
                    break;
                }
                if (!targetProvider.data) {
                    targetProvider.data = {};
                }
                targetProvider.data = {
                    ...action.payload.data,
                    ...targetProvider.data,
                };
                break;
            // no default
        }
    });

const selectMetadata = (state: { metadata: MetadataState }) => state.metadata;

export const selectSelectedProviderForLabels = (state: { metadata: MetadataState }) =>
    state.metadata.providers.find(p => p.clientId === state.metadata.selectedProvider['labels']);

export const selectLabelingDataForSelectedAccount = createSelector(
    [selectSelectedProviderForLabels, selectSelectedAccount],
    (provider, selectedAccount) => {
        if (!provider?.data || !selectedAccount?.metadata.fileName) {
            return {
                addressLabels: {},
                outputLabels: {},
                accountLabel: '',
            };
        }

        const data = provider.data[selectedAccount.metadata.fileName];
        if (data && 'outputLabels' in data) {
            return data;
        }

        return {
            addressLabels: {},
            outputLabels: {},
            accountLabel: '',
        };
    },
);

// is everything ready (more or less) to add label?
export const selectIsLabelingAvailable = createSelector(
    [selectDevice, selectMetadata, selectSelectedProviderForLabels],
    (device, metadata, provider) =>
        !!(metadata.enabled && device?.metadata?.status === 'enabled' && provider),
);

export default metadataReducer;
