import { createAction } from '@reduxjs/toolkit';

import { Action, Category, MessageSystem } from '@suite-common/suite-types';

import { MessageSystemConfigSource } from './messageSystemTypes';

export type ValidMessagesPayload = { [key in Category]: string[] };

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
} as const;
