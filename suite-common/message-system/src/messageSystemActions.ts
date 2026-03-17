import { createAction } from '@reduxjs/toolkit';

import {
    type Action,
    type Category,
    type Experiments,
    type MessageSystem,
} from '@suite-common/suite-types';

import { type MessageSystemConfigSource } from './messageSystemTypes';

export type ValidMessagesPayload = {
    [key in Category]: string[];
};

export type InclusionOverridePayload = {
    id: string;
    inclusion: number;
};

export const ACTION_PREFIX = '@message-system';

const fetchSuccess = createAction(
    `${ACTION_PREFIX}/fetchConfigSuccess`,
    (payload: { timestamp: number }) => ({
        payload,
    }),
);

const fetchSuccessUpdate = createAction(
    `${ACTION_PREFIX}/fetchConfigSuccessUpdate`,
    (payload: { config: MessageSystem; timestamp: number }) => ({
        payload,
    }),
);

const fetchError = createAction(`${ACTION_PREFIX}/fetchConfigError`);

const updateValidMessages = createAction(
    `${ACTION_PREFIX}/updateValidMessages`,
    (payload: ValidMessagesPayload) => ({
        payload,
    }),
);

const dismissMessage = createAction(
    `${ACTION_PREFIX}/dismissMessage`,
    (payload: { id: string; category: Category }) => ({
        payload,
    }),
);

const updateValidExperiments = createAction(
    `${ACTION_PREFIX}/updateValidExperiments`,
    (payload: string[]) => ({
        payload,
    }),
);

const setConfigSource = createAction(
    `${ACTION_PREFIX}/setConfigSource`,
    (payload: MessageSystemConfigSource) => ({
        payload,
    }),
);

const addMessage = createAction(`${ACTION_PREFIX}/addMessage`, (payload: Action) => ({ payload }));

const removeMessage = createAction(`${ACTION_PREFIX}/removeMessage`, (payload: string) => ({
    payload,
}));

const addExperiment = createAction(`${ACTION_PREFIX}/addExperiment`, (payload: Experiments) => ({
    payload,
}));

const removeExperiment = createAction(`${ACTION_PREFIX}/removeExperiment`, (payload: string) => ({
    payload,
}));

export const setExperimentInclusionOverride = createAction(
    `${ACTION_PREFIX}/setExperimentsInclusionOverride`,
    (payload: InclusionOverridePayload) => ({ payload }),
);

export const clearExperimentInclusionOverride = createAction(
    `${ACTION_PREFIX}/clearExperimentsInclusionOverride`,
    (payload: string) => ({ payload }),
);

export const messageSystemActions = {
    updateValidMessages,
    updateValidExperiments,
    dismissMessage,
    fetchSuccess,
    fetchSuccessUpdate,
    fetchError,
    setConfigSource,
    addMessage,
    removeMessage,
    addExperiment,
    removeExperiment,
    setExperimentInclusionOverride,
    clearExperimentInclusionOverride,
} as const;
