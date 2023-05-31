import { createAction } from '@reduxjs/toolkit';

import { Category, MessageSystem } from '@suite-common/suite-types';

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

export const messageSystemActions = {
    updateValidMessages,
    dismissMessage,
    fetchSuccess,
    fetchSuccessUpdate,
    fetchError,
} as const;
