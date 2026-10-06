import { createAction } from '@reduxjs/toolkit';

import { type UserContextPayload } from '../src/modal';

export const mockOpenModal = () => createAction<UserContextPayload>('mock/openModal');
export const mockOnModalCancel = () => createAction('mock/onModalCancel');
